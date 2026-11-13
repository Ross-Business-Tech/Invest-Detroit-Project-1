// Usage insights, star ratings and the private dashboard. Everything here is a count by
// category ("review warning: loan_gt_budget", "chat answered by claude"). No message, answer,
// note, name, file or IP address is ever stored.
//
//   POST /api/events     a few events from the browser: { events: [{ type, key }] }
//   POST /api/feedback   a star rating: { feedback_id, rating, submitted_at }
//   GET  /insights       the team's dashboard (password: INSIGHTS_PASSWORD env variable)

import crypto from 'node:crypto'
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

// ---- Dashboard -----------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function authorized(req) {
  const pass = process.env.INSIGHTS_PASSWORD
  if (!pass) return false
  const [scheme, encoded] = String(req.headers.authorization || '').split(' ')
  if (scheme !== 'Basic' || !encoded) return false
  const given = Buffer.from(encoded, 'base64').toString('utf8').split(':').slice(1).join(':')
  const a = crypto.createHash('sha256').update(given).digest()
  const b = crypto.createHash('sha256').update(pass).digest()
  return crypto.timingSafeEqual(a, b)
}

const label = {
  section: (id) => SECTIONS.find((s) => s.id === id)?.title || id,
  field: (id) => FIELDS_BY_ID[id]?.label || id,
  source: (id) => SOURCES[id]?.title || id,
}

function table(title, rows, note = '') {
  const body = rows.length
    ? rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${v}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty">No data yet</td></tr>'
  return `<section><h2>${esc(title)}</h2>${note ? `<p class="note">${esc(note)}</p>` : ''}<table>${body}</table></section>`
}

function pick(totals, prefix, name = (k) => k, limit = 12) {
  return Object.entries(totals).filter(([k]) => k.startsWith(prefix + ':')).map(([k, v]) => [name(k.slice(prefix.length + 1)), v]).sort((a, b) => b[1] - a[1]).slice(0, limit)
}

export function renderDashboard(totals, { days, storeKind }) {
  const t = (k) => totals[k] || 0
  const starts = t('form:start'), submits = t('form:submit')
  const ratings = [1, 2, 3, 4, 5].map((n) => [n, t(`rating:${n}`)])
  const rated = ratings.reduce((n, [, c]) => n + c, 0)
  const avg = rated ? (ratings.reduce((n, [s, c]) => n + s * c, 0) / rated).toFixed(2) : '–'
  const runs = t('review_result:passed') + t('review_result:blocked')
  const stat = (n, l) => `<div class="stat"><b>${n}</b><span>${esc(l)}</span></div>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Copilot insights</title><style>
body{font:15px/1.45 Arial,sans-serif;color:#1d2421;background:#f4f5f4;margin:0;padding:24px 16px}main{max-width:980px;margin:0 auto}
h1{margin:0 0 4px;font-size:26px}h2{font-size:16px;margin:0 0 8px}.sub{color:#515e59;margin:0 0 20px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px}
.stat{background:#fff;border:1px solid #d6dbd9;padding:12px}.stat b{display:block;font-size:26px}.stat span{color:#515e59;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}section{background:#fff;border:1px solid #d6dbd9;padding:14px}
table{width:100%;border-collapse:collapse}td{padding:5px 4px;border-top:1px solid #eef0ef;vertical-align:top}td.n{text-align:right;font-weight:700;width:60px}
.empty,.note{color:#515e59;font-size:13px}.warn{background:#fff3d6;padding:8px 12px;margin-bottom:16px}
</style></head><body><main>
<h1>Application Copilot: usage insights</h1>
<p class="sub">Last ${days} days. Counts only: no messages, answers, notes, names or IP addresses are stored. <a href="?days=${days}&amp;format=csv">Download as CSV</a></p>
${storeKind === 'memory' ? '<p class="warn">Counts are kept in memory and reset when the server restarts. Add a database (DATABASE_URL) to keep them.</p>' : ''}
<div class="stats">
${stat(starts, 'forms started')}${stat(submits, 'forms submitted')}${stat(starts ? Math.round((submits / starts) * 100) + '%' : '–', 'of started forms submitted')}
${stat(runs, 'reviews run')}${stat(t('chat:total'), 'chat questions')}${stat(`${avg} ★`, `average rating (${rated} ratings)`)}
</div>
<div class="grid">
${table('Where people stopped', pick(totals, 'form_exit', label.section), 'First unfinished section when someone left without submitting.')}
${table('Most common review findings', pick(totals, 'review_issue'), 'Issue ids from Review My Application (see docs/ARCHITECTURE.md).')}
${table('Questions people asked for help with', pick(totals, 'chat_field', label.field), 'The form question open while chatting.')}
${table('? button presses', pick(totals, 'field_help', label.field))}
${table('Topics answered (by source used)', pick(totals, 'chat_source', label.source))}
${table('Who answered', pick(totals, 'chat_from'))}
${table('Chat outcomes', pick(totals, 'chat_kind'))}
${table('Requests the guardrails stopped', pick(totals, 'guardrail'))}
${table('Star ratings', ratings.map(([n, c]) => [`${'★'.repeat(n)}`, c]))}
${table('Limits reached', pick(totals, 'limit'), 'Chats answered by the built-in guide because a daily limit was reached.')}
${table('AI service errors', pick(totals, 'ai_error'), 'Answered by the built-in guide because the AI service failed. 401 = wrong key; 403/404 = model not allowed for this key; 429 = rate or budget limit.')}
</div></main></body></html>`
}

export async function insightsHandler(req, res, store) {
  if (!process.env.INSIGHTS_PASSWORD) {
    res.statusCode = 404
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    return res.end('Insights are off. Set the INSIGHTS_PASSWORD environment variable to turn them on.')
  }
  if (!authorized(req)) {
    res.statusCode = 401
    res.setHeader('www-authenticate', 'Basic realm="Copilot insights", charset="UTF-8"')
    return res.end('Password required')
  }
  const params = new URL(req.url, 'http://x').searchParams
  const days = Math.min(Math.max(Number(params.get('days')) || 30, 1), 365)
  if (params.get('format') === 'csv') {
    // The same counts as a spreadsheet, for staff reports (open in Excel or Google Sheets).
    const rows = Object.entries(await store.totals(days)).sort(([a], [b]) => a.localeCompare(b))
    const cell = (s) => `"${String(s).replace(/"/g, '""')}"`
    res.statusCode = 200
    res.setHeader('content-type', 'text/csv; charset=utf-8')
    res.setHeader('content-disposition', `attachment; filename="copilot-insights-${days}d.csv"`)
    res.setHeader('cache-control', 'no-store')
    return res.end(['category,item,count', ...rows.map(([k, v]) => { const i = k.indexOf(':'); return [cell(k.slice(0, i)), cell(k.slice(i + 1)), v].join(',') })].join('\n') + '\n')
  }
  res.statusCode = 200
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-robots-tag', 'noindex')
  return res.end(renderDashboard(await store.totals(days), { days, storeKind: store.kind }))
}
