// What every AI service gets and must send back, whichever one is connected (OpenAI or Claude).
// Keeping this in one place means the chat, the guardrails and the tests behave the same way
// whatever service answers.

import { KNOWLEDGE_TEXT, SOURCE_IDS } from './knowledgeContext.js'
import { SOURCES } from '../src/copilot/config.js'
import { NO_MATCH } from '../src/copilot/guideTransport.js'
import { OUT_OF_SCOPE_MESSAGE } from '../src/copilot/guardrails/messages.js'

/** Reply `from` values that mean "an AI model answered" (the chat shows its connected subtitle). */
export const AI_FROM = ['openai', 'claude']

const LANGUAGE = { 'en-US': 'English', 'es-US': 'Spanish', ar: 'Arabic', bn: 'Bengali', 'zh-Hans': 'Simplified Chinese' }

// The model must reply in this shape, so the chat can show the answer and only real source links.
// (Strict JSON schema: every property required, no extra properties.)
export const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'The reply shown to the applicant: short, friendly, plain language, in the requested language.' },
    source_ids: { type: 'array', items: { type: 'string', enum: SOURCE_IDS }, description: 'Ids of the knowledge-base sources the answer relies on.' },
    needs_staff: { type: 'boolean', description: 'True when only the Invest Detroit team can answer the rest (eligibility, approval, the applicant\'s own terms).' },
    in_scope: { type: 'boolean', description: 'False when the question is unrelated to this application, Invest Detroit\'s lending, or preparing and financing a business or real-estate project.' },
  },
  required: ['answer', 'source_ids', 'needs_staff', 'in_scope'],
  additionalProperties: false,
}

export { KNOWLEDGE_TEXT }

/** The conversation for the model: it starts with the applicant, and the language goes with the question. */
export function toChatMessages(modelInput) {
  const msgs = [...modelInput.messages]
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  const last = msgs[msgs.length - 1]
  const language = LANGUAGE[modelInput.locale] || 'English'
  msgs[msgs.length - 1] = { role: 'user', content: `Reply in ${language}.\n\n${last.content}` }
  return msgs
}

/** Declined, cut off or unreadable: say so and point to the team, never show a partial answer. */
export const fallbackReply = (from) => ({ kind: 'no_answer', text: NO_MATCH, sources: [], needs_staff: true, english_only: false, from })

/** Turns the model's JSON text into a chat reply, keeping only sources we know. */
export function finishReply(text, from) {
  let parsed
  try { parsed = JSON.parse(text) } catch { return fallbackReply(from) }
  // The model judged it off-topic: show the same fixed, translated reply the guardrails use.
  if (parsed?.in_scope === false) {
    return { kind: 'out_of_scope', text: OUT_OF_SCOPE_MESSAGE, sources: [], needs_staff: false, english_only: false, from, guardrail: { action: 'reject', category: 'model_out_of_scope' } }
  }
  if (typeof parsed?.answer !== 'string' || !parsed.answer.trim()) return fallbackReply(from)
  const ids = Array.isArray(parsed.source_ids) ? [...new Set(parsed.source_ids)].filter((id) => SOURCES[id]) : []
  return {
    kind: 'answer',
    text: parsed.answer.trim(),
    sources: ids.map((id) => ({ id, title: SOURCES[id].title, url: SOURCES[id].url })),
    needs_staff: !!parsed.needs_staff,
    english_only: false,
    from,
  }
}
