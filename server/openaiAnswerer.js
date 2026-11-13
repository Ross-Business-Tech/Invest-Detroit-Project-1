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

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { KNOWLEDGE_TEXT, REPLY_SCHEMA, toChatMessages, fallbackReply, finishReply } from './modelReply.js'

export const DEFAULT_OPENAI_MODEL = 'gpt-6.1-sol'
export const FROM = 'openai'

// The instructions and knowledge base never change between questions. OpenAI caches a repeated
// opening automatically (cheaper and faster); the cache key keeps our requests together.
export const INSTRUCTIONS = `${SYSTEM_PROMPT}\n\n${KNOWLEDGE_TEXT}`
const CACHE_KEY = 'invest-detroit-copilot-v1'

const unsupportedReasoning = (err) => err?.status === 400 && /reasoning|effort/i.test(String(err?.message || ''))

/**
 * @param {{ client?: OpenAI, model?: string, effort?: string, onEvent?: Function }} [opts]
 * @returns {({ modelInput }) => Promise<object>} an `answer` function for handleAssistantRequest
 */
export function createOpenAIAnswerer({ client, model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL, effort = process.env.OPENAI_EFFORT || 'low', onEvent = () => {} } = {}) {
  // Reads OPENAI_API_KEY from the environment. A slow answer gives up after 30 s (one retry), so the
  // chat falls back to the built-in guide instead of hanging.
  // Spaces or line breaks pasted around the key in Render's settings are ignored.
  const api = client || new OpenAI({ apiKey: String(process.env.OPENAI_API_KEY || '').trim(), timeout: 30_000, maxRetries: 1 })
  let sendReasoning = true // switched off once if the chosen model doesn't take a reasoning setting

  return async ({ modelInput }) => {
    const params = {
      model,
      instructions: INSTRUCTIONS,
      input: toChatMessages(modelInput),
      text: { format: { type: 'json_schema', name: 'assistant_reply', schema: REPLY_SCHEMA, strict: true } },
      max_output_tokens: 4000,
      store: false, // OpenAI doesn't keep the conversation for later retrieval
      prompt_cache_key: CACHE_KEY,
    }
    let response
    try {
      response = await api.responses.create(sendReasoning ? { ...params, reasoning: { effort } } : params)
    } catch (err) {
      if (!sendReasoning || !unsupportedReasoning(err)) throw err
      sendReasoning = false
      onEvent({ type: 'openai_reasoning_unsupported', model })
      response = await api.responses.create(params)
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
