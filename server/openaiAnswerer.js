// Answers allowed chat questions with OpenAI, using our knowledge base. Runs on the server only
// (the key is read from the server's OPENAI_API_KEY environment variable, never the website).
//
// Plugs into handleAssistantRequest() as its `answer` function, so the guardrails, privacy
// checks and output check in assistantHandler.js still run before and after every call.
//
// Settings (environment variables, all optional except the key):
//   OPENAI_API_KEY   the key (required for OpenAI answers; without it the field guide answers)
//   OPENAI_MODEL     model id, default gpt-6.1-sol. If the key is limited to certain models
//                    (some "Codex" keys are), set this to one the key allows.
//   OPENAI_EFFORT    reasoning effort: none | minimal | low | medium | high, default low
//                    (quick, conversational answers). Sent only to models that accept it.
//   OPENAI_BASE_URL  send requests to another OpenAI-compatible gateway instead of OpenAI, e.g.
//                    U-M GPT Toolkit: https://api.toolkit.umgpt.umich.edu/v1 (read by the SDK)

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { KNOWLEDGE_TEXT, REPLY_SCHEMA, toChatMessages, fallbackReply, finishReply } from './modelReply.js'

export const DEFAULT_OPENAI_MODEL = 'gpt-6.1-sol'
export const FROM = 'openai'

// The instructions and knowledge base never change between questions. OpenAI caches a repeated
// opening automatically (cheaper and faster); the cache key keeps our requests together.
export const INSTRUCTIONS = `${SYSTEM_PROMPT}\n\n${KNOWLEDGE_TEXT}`
const CACHE_KEY = 'invest-detroit-copilot-v1'

// Optional settings a gateway (for example U-M's GPT Toolkit) might not accept. If a request is
// rejected naming one of them, it is retried once without it and left out from then on.
const OPTIONAL = [
  ['reasoning', /reasoning|effort/i],
  ['prompt_cache_key', /prompt_cache_key|prompt cache/i],
  ['store', /\bstore\b/i],
]
const rejectedOptional = (err, sent) => err?.status === 400 ? OPTIONAL.find(([key, re]) => key in sent && re.test(String(err?.message || '')))?.[0] : undefined

/**
 * @param {{ client?: OpenAI, model?: string, effort?: string, onEvent?: Function }} [opts]
 * @returns {({ modelInput }) => Promise<object>} an `answer` function for handleAssistantRequest
 */
export function createOpenAIAnswerer({ client, model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL, effort = process.env.OPENAI_EFFORT || 'low', onEvent = () => {} } = {}) {
  // Reads OPENAI_API_KEY from the environment. A slow answer gives up after 30 s (one retry), so the
  // chat falls back to the built-in guide instead of hanging.
  // Spaces or line breaks pasted around the key in Render's settings are ignored.
  const api = client || new OpenAI({ apiKey: String(process.env.OPENAI_API_KEY || '').trim(), baseURL: String(process.env.OPENAI_BASE_URL || '').trim() || undefined, timeout: 30_000, maxRetries: 1 })
  const dropped = new Set() // optional settings this model or gateway rejected

  return async ({ modelInput }) => {
    const params = {
      model,
      instructions: INSTRUCTIONS,
      input: toChatMessages(modelInput),
      text: { format: { type: 'json_schema', name: 'assistant_reply', schema: REPLY_SCHEMA, strict: true } },
      max_output_tokens: 4000,
      store: false, // OpenAI doesn't keep the conversation for later retrieval
      prompt_cache_key: CACHE_KEY,
      reasoning: { effort },
    }
    let response
    for (let attempt = 0; ; attempt++) {
      const sent = Object.fromEntries(Object.entries(params).filter(([k]) => !dropped.has(k)))
      try {
        response = await api.responses.create(sent)
        break
      } catch (err) {
        const key = rejectedOptional(err, sent)
        if (!key || attempt >= OPTIONAL.length) throw err
        dropped.add(key)
        onEvent({ type: 'openai_setting_unsupported', setting: key, model })
      }
    }
    const usage = response.usage || {}
    onEvent({ type: 'ai_answer', provider: 'openai', status: response.status, input_tokens: usage.input_tokens, cached_tokens: usage.input_tokens_details?.cached_tokens, output_tokens: usage.output_tokens, reasoning_tokens: usage.output_tokens_details?.reasoning_tokens })

    // Cut off, filtered or declined: point to the team instead of showing a partial answer.
    if (response.status && response.status !== 'completed') return fallbackReply(FROM)
    const parts = (response.output || []).filter((o) => o.type === 'message').flatMap((o) => o.content || [])
    if (parts.some((c) => c.type === 'refusal')) return fallbackReply(FROM)
    const text = response.output_text ?? parts.filter((c) => c.type === 'output_text').map((c) => c.text).join('')
    return finishReply(text, FROM)
  }
}
