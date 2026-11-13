// Usage counts and star ratings, for Invest Detroit's own reporting (see docs/DATA-PIPELINE.md).
// Everything here is a count by category ("review_issue:loan_gt_budget", "chat_from:openai").
// No message, answer, note, name, file or IP address is ever stored.
//
//   POST /api/events     a few events from the browser: { events: [{ type, key }] }
//   POST /api/feedback   a star rating: { feedback_id, rating, submitted_at }
//   GET  /api/usage      the counts by day, as JSON, for a data pipeline (needs USAGE_EXPORT_TOKEN)
//
// There is no dashboard: Invest Detroit reads the counts into its own system, by the export
// above, by the webhook in server/store.js (USAGE_WEBHOOK_URL), or straight from the database.

import crypto from 'node:crypto'
import { isInternalKey } from './store.js'
import { FIELDS_BY_ID, SECTIONS } from '../src/copilot/formDefinition.js'
import { SOURCES } from '../src/copilot/config.js'

const SECTION_IDS = new Set(SECTIONS.map((s) => s.id))
const ISSUE_ID = /^[a-z0-9_]{2,60}$/
const KINDS = new Set(['answer', 'no_answer', 'out_of_scope', 'clarify', 'integrity', 'privacy_warning', 'error'])
const FROM = new Set(['openai', 'claude', 'field_guide', 'field_guide_fallback', 'field_guide_limit'])

/** Which browser events are accepted, and how each key is checked. */
const EVENT_RULES = {
  review_issue: (k) => ISSUE_ID.test(k), // an issue id such as loan_gt_budget (never the answer)
  review_result: (k) => k === 'passed' || k === 'blocked',
  form: (k) => k === 'start' || k === 'submit',
  form_exit: (k) => SECTION_IDS.has(k), // the first unfinished section when someone left without submitting
  field_help: (k) => !!FIELDS_BY_ID[k], // the ? button on a question
}
export const EVENT_TYPES = Object.keys(EVENT_RULES)

export async function recordChat(store, { body, out }) {
  const reply = out?.reply
  if (!reply) return
  await store.incr('chat:total')
  if (KINDS.has(reply.kind)) await store.incr(`chat_kind:${reply.kind}`)
  if (FROM.has(reply.from)) await store.incr(`chat_from:${reply.from}`)
  if (reply.guardrail?.category && /^[a-z_]{2,40}$/.test(reply.guardrail.category)) await store.incr(`guardrail:${reply.guardrail.category}`)
  const fieldId = body?.field?.field_id
  if (typeof fieldId === 'string' && FIELDS_BY_ID[fieldId]) await store.incr(`chat_field:${fieldId}`)
  for (const s of reply.sources || []) if (SOURCES[s?.id]) await store.incr(`chat_source:${s.id}`)
}

const json = (res, status, payload) => res.status(status).json(payload)

export async function eventsHandler(req, res, store) {
  if (req.method !== 'POST') return json(res, 405, { error: { code: 'method_not_allowed' } })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { return json(res, 400, { error: { code: 'invalid_json' } }) } }
  const events = Array.isArray(body?.events) ? body.events.slice(0, 40) : []
  let accepted = 0
  for (const e of events) {
    const rule = EVENT_RULES[e?.type]
    const key = typeof e?.key === 'string' ? e.key : ''
    if (rule && rule(key)) { await store.incr(`${e.type}:${key}`); accepted++ }
  }
  return json(res, 202, { accepted })
}

export async function feedbackHandler(req, res, store) {
  if (req.method !== 'POST') return json(res, 405, { error: { code: 'method_not_allowed' } })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { return json(res, 400, { error: { code: 'invalid_json' } }) } }
  const rating = Number(body?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof body?.feedback_id !== 'string') return json(res, 400, { error: { code: 'invalid_rating' } })
  await store.incr(`rating:${rating}`)
  // Same reply shape as here.now Site Data, so the rating card works unchanged.
  return json(res, 201, { record: { id: body.feedback_id.slice(0, 64), data: { rating } } })
}

// ---- Export for Invest Detroit's data pipeline -----------------------------------------------

/** True when the request carries the export token (Authorization: Bearer <USAGE_EXPORT_TOKEN>). */
function exportAllowed(req) {
  const token = process.env.USAGE_EXPORT_TOKEN
  if (!token) return false
  const [scheme, given] = String(req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !given) return false
  const a = crypto.createHash('sha256').update(given).digest()
  const b = crypto.createHash('sha256').update(token).digest()
  return crypto.timingSafeEqual(a, b)
}


/**
 * GET /api/usage?days=30  ->  { from, to, rows: [{ day, category, item, count }] }
 * Off (404) unless USAGE_EXPORT_TOKEN is set; 401 without the right token.
 */
export async function usageHandler(req, res, store) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'GET') return json(res, 405, { error: { code: 'method_not_allowed' } })
  if (!process.env.USAGE_EXPORT_TOKEN) return json(res, 404, { error: { code: 'export_off' } })
  if (!exportAllowed(req)) return json(res, 401, { error: { code: 'token_required' } })
  const days = Math.min(Math.max(Number(new URL(req.url, 'http://x').searchParams.get('days')) || 30, 1), 400)
  const rows = (await store.daily(days))
    .filter((r) => !isInternalKey(r.key))
    .map(({ day, key, count }) => { const i = key.indexOf(':'); return { day, category: key.slice(0, i), item: key.slice(i + 1), count } })
  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10)
  return json(res, 200, { from, to, rows })
}

