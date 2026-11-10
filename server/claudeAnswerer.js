// Answers allowed chat questions with Claude, using our knowledge base. Runs on the server only
// (the API key is read from the server's ANTHROPIC_API_KEY environment variable, never the site).
//
// Plugs into handleAssistantRequest() as its `answer` function, so the guardrails, privacy
// checks and output check in assistantHandler.js still run before and after every call.
//
// Settings (environment variables, all optional except the key):
//   ANTHROPIC_API_KEY   the key (required for Claude answers; without it the field guide answers)
//   ASSISTANT_MODEL     model id, default claude-opus-5-5
//   ASSISTANT_EFFORT    low | medium | high, default low (quick, conversational answers)

import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { KNOWLEDGE_TEXT, SOURCE_IDS } from './knowledgeContext.js'
import { SOURCES } from '../src/copilot/config.js'
import { NO_MATCH } from '../src/copilot/guideTransport.js'

export const DEFAULT_MODEL = 'claude-opus-5-5'

const LANGUAGE = { 'en-US': 'English', 'es-US': 'Spanish', ar: 'Arabic', bn: 'Bengali', 'zh-Hans': 'Simplified Chinese' }

// Claude must reply in this shape, so the chat can show the answer and only real source links.
export const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'The reply shown to the applicant: short, friendly, plain language, in the requested language.' },
    source_ids: { type: 'array', items: { type: 'string', enum: SOURCE_IDS }, description: 'Ids of the knowledge-base sources the answer relies on.' },
    needs_staff: { type: 'boolean', description: 'True when only the Invest Detroit team can answer the rest (eligibility, approval, the applicant\'s own terms).' },
  },
  required: ['answer', 'source_ids', 'needs_staff'],
  additionalProperties: false,
}

const fallbackReply = () => ({ kind: 'no_answer', text: NO_MATCH, sources: [], needs_staff: true, english_only: false, from: 'claude' })

/** Claude's messages: history must start with the applicant, and the language goes with the question. */
export function toClaudeMessages(modelInput) {
  const msgs = [...modelInput.messages]
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  const last = msgs[msgs.length - 1]
  const language = LANGUAGE[modelInput.locale] || 'English'
  msgs[msgs.length - 1] = { role: 'user', content: `Reply in ${language}.\n\n${last.content}` }
  return msgs
}

/**
 * @param {{ client?: Anthropic, model?: string, effort?: string, onEvent?: Function }} [opts]
 * @returns {({ modelInput }) => Promise<object>} an `answer` function for handleAssistantRequest
 */
export function createClaudeAnswerer({ client, model = process.env.ASSISTANT_MODEL || DEFAULT_MODEL, effort = process.env.ASSISTANT_EFFORT || 'low', onEvent = () => {} } = {}) {
  const api = client || new Anthropic() // reads ANTHROPIC_API_KEY from the environment
  return async ({ modelInput }) => {
    const response = await api.beta.messages.create({
      model,
      max_tokens: 8000,
      // If Claude's safety filters decline a request, the API retries it on a suitable model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        // The knowledge base never changes between questions, so it is cached and billed at a fraction.
        { type: 'text', text: KNOWLEDGE_TEXT, cache_control: { type: 'ephemeral' } },
      ],
      messages: toClaudeMessages(modelInput),
    })
    onEvent({ type: 'claude_answer', stop_reason: response.stop_reason, input_tokens: response.usage?.input_tokens, cached_tokens: response.usage?.cache_read_input_tokens, output_tokens: response.usage?.output_tokens })

    // Declined or cut off: say so and point to the team, never show a partial answer.
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return fallbackReply()
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
    let parsed
    try { parsed = JSON.parse(text) } catch { return fallbackReply() }
    if (typeof parsed?.answer !== 'string' || !parsed.answer.trim()) return fallbackReply()

    const ids = Array.isArray(parsed.source_ids) ? [...new Set(parsed.source_ids)].filter((id) => SOURCES[id]) : []
    return {
      kind: 'answer',
      text: parsed.answer.trim(),
      sources: ids.map((id) => ({ id, title: SOURCES[id].title, url: SOURCES[id].url })),
      needs_staff: !!parsed.needs_staff,
      english_only: false,
      from: 'claude',
    }
  }
}
