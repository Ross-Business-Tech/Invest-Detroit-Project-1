// Chat feedback: a 1–5 star rating saved through here.now Site Data (or any endpoint that
// accepts the same JSON). Each record holds exactly three things: the rating, a random
// feedback id and the time. Never form answers, chat messages or anything about the applicant.

import { FEEDBACK } from './config.js'
import { onServerHost, onHereNow } from './hosting.js'

export function newFeedbackId() {
  const rand = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  return `fb_${rand}`
}

/** The full record that gets saved. Exported so tests can prove nothing else is sent. */
export function buildFeedbackRecord(rating, { id = newFeedbackId(), now = new Date() } = {}) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be a whole number from 1 to 5')
  return { feedback_id: id, rating, submitted_at: now.toISOString() }
}

/**
 * Ask for feedback only after real use: the applicant has sent at least `minUserMessages`
 * messages and received at least `minAnswers` real answers (clarifying questions, refusals,
 * privacy warnings and connection errors don't count as answers).
 */
export function hasMeaningfulInteraction(messages, { minUserMessages = FEEDBACK.min_user_messages, minAnswers = FEEDBACK.min_answers } = {}) {
  const userMessages = messages.filter((m) => m.role === 'user').length
  const answered = messages.filter((m) => m.role === 'assistant' && ['answer', 'no_answer', 'placeholder'].includes(m.kind)).length
  return userMessages >= minUserMessages && answered >= minAnswers
}

/**
 * Where ratings can be saved from this site: our server (Render/Vercel) at /api/feedback, or
 * here.now Site Data. Anywhere else there is nowhere to save them, so the card stays hidden.
 * Outside a browser (tests), here.now's path is assumed.
 */
export function defaultFeedbackEndpoint(hostname = typeof location !== 'undefined' ? location.hostname : null) {
  if (!hostname) return FEEDBACK.endpoint
  if (onServerHost(hostname)) return FEEDBACK.server_endpoint
  if (onHereNow(hostname)) return FEEDBACK.endpoint
  return null
}

export function createFeedbackClient({ endpoint, fetchImpl = (...a) => fetch(...a), onEvent = () => {}, hostname } = {}) {
  if (endpoint === undefined) endpoint = defaultFeedbackEndpoint(hostname) // null = explicitly off
  if (!endpoint) return null
  return {
    /** Saves one rating. Throws on any failure so the card can show an error and allow a retry. */
    async submit(rating) {
      const record = buildFeedbackRecord(rating)
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(record),
      })
      if (!res.ok) throw new Error(`Feedback not saved (${res.status})`)
      // here.now answers { record: { id, data, ... } }. Anything else (e.g. an HTML page) is a failure.
      const body = await res.json().catch(() => null)
      if (!body || typeof body !== 'object' || !body.record) throw new Error('Feedback not saved (unexpected response)')
      onEvent({ type: 'feedback_submitted', rating })
      return record
    },
  }
}
