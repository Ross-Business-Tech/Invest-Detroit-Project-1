// Built-in assistant answers from the draft field guide: no AI model, no network.
// Same request/reply contract as a real AI endpoint (see assistant.js), so switching to a model
// later changes only the transport.
//
// How it picks an answer:
//   1. "Explain this question" (the ? button) -> that question's guide entry.
//   2. Eligibility, rates, fees, timelines -> always "only staff can answer" (brief: never guess).
//   3. Otherwise the guide entry whose keywords best match the message, preferring the question
//      the applicant is on. Short or vague messages ("what does this mean?") use that question.
//   4. No good match -> say so and point to staff instead of guessing.

import { FIELD_GUIDE, TOPICS } from './fieldGuide.js'
import { SOURCES } from './config.js'

const LATIN = /^[\p{Script=Latin}\d%&\s\-'.]+$/u

function hits(keyword, text) {
  const k = keyword.toLowerCase()
  if (!LATIN.test(k)) return text.includes(k) // Arabic, Bengali, Chinese: no reliable word gaps
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\d])${escaped}`, 'u').test(text)
}

const score = (entry, text) => (entry.keywords || []).reduce((n, k) => n + (hits(k, text) ? (k.includes(' ') ? 2 : 1) : 0), 0)

// Phrases that mean "the question I'm on" ("what does this mean?", "what should I put here?").
const VAGUE = /\b(this|here|mean|means|meaning|explain)\b|what (should|do) i (put|enter|write)|esto|esta pregunta|qué significa|هذا|ماذا يعني|এটা|এর মানে|这个|这里|什么意思/i
const isVague = (text) => VAGUE.test(text)

export const NO_MATCH = 'I don\'t have an approved answer for that yet. The Invest Detroit team can help: info@investdetroit.com or 313.259.6368.'

function compose(entry) {
  const parts = [entry.explain]
  if (entry.example) parts.push(`Example: ${entry.example}`)
  if (entry.mistakes?.length) parts.push(`Common mistakes:\n${entry.mistakes.map((m) => `• ${m}`).join('\n')}`)
  return parts.join('\n\n')
}

function reply(entry, request) {
  const ids = (entry.source_ids || []).filter((id) => SOURCES[id])
  return {
    kind: 'answer',
    text: compose(entry),
    sources: ids.map((id) => ({ id, title: SOURCES[id].title, url: SOURCES[id].url })),
    needs_staff: !!entry.needs_staff,
    english_only: !!request.locale && !String(request.locale).toLowerCase().startsWith('en'),
    from: 'field_guide',
  }
}

/** Pure function: request (from buildRequest) -> reply. Exported for tests. */
export function answerFromGuide(request) {
  const text = String(request.message || '').toLowerCase().trim()
  const fieldId = request.field?.field_id || null
  const fieldEntry = fieldId ? FIELD_GUIDE[fieldId] : null

  if (request.intent === 'explain_field' && fieldEntry) return reply(fieldEntry, request)

  const staffOnly = TOPICS.find((t) => t.id === 'staff_only')
  if (score(staffOnly, text) > 0) return reply(staffOnly, request)

  const candidates = [...new Set([...Object.values(FIELD_GUIDE), ...TOPICS.filter((t) => t !== staffOnly)])]
  let best = null
  let bestScore = 0
  for (const entry of candidates) {
    const s = score(entry, text) + (entry === fieldEntry ? 0.5 : 0)
    if (s > bestScore) { best = entry; bestScore = s }
  }
  if (best && bestScore >= 1) return reply(best, request)
  if (fieldEntry && isVague(text)) return reply(fieldEntry, request)

  // kind 'no_answer' is fixed text, so the chat shows it translated.
  return { kind: 'no_answer', text: NO_MATCH, sources: [], needs_staff: true, english_only: false, from: 'field_guide' }
}

export const guideTransport = {
  async send(request) {
    return answerFromGuide(request)
  },
}
