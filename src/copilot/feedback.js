// Chat feedback: a 1–5 star rating saved through here.now Site Data (or any endpoint that
// accepts the same JSON). Each record holds exactly three things: the rating, a random
// feedback id and the time. Never form answers, chat messages or anything about the applicant.

import { FEEDBACK } from './config.js'

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
 * Ask for feedback only after real use: the assistant has answered at least `minAnswers` of
 * the applicant's own questions (privacy warnings and connection errors don't count).
 */
export function hasMeaningfulInteraction(messages, minAnswers = FEEDBACK.min_answers_before_asking) {
  const answered = messages.filter((m) => m.role === 'assistant' && ['answer', 'no_answer', 'placeholder'].includes(m.kind)).length
  return answered >= minAnswers
}

export function createFeedbackClient({ endpoint = FEEDBACK.endpoint, fetchImpl = (...a) => fetch(...a), onEvent = () => {} } = {}) {
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
