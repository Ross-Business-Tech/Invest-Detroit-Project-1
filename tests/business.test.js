import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryStore } from '../server/store.js'
import { eventsHandler, feedbackHandler, insightsHandler, recordChat, renderDashboard } from '../server/insights.js'
import assistant from '../api/assistant.js'
import { toCounted } from '../src/copilot/metrics.js'
import { buildStaffSummary } from '../src/copilot/staffSummary.js'
import { runReview } from '../src/copilot/review.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'

function fakeRes() {
  const res = { statusCode: 0, headers: {}, payload: null, body: '' }
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (p) => { res.payload = p; return res }
  res.end = (b = '') => { res.body = String(b); return res }
  return res
}
const post = (body, extra = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9', ...extra }, body })

test('only known event types and keys are counted; free text is dropped', async () => {
  const store = createMemoryStore()
  const res = fakeRes()
  await eventsHandler(post({ events: [
    { type: 'review_issue', key: 'loan_gt_budget' },
    { type: 'form_exit', key: 'business_info' },
    { type: 'field_help', key: 'total_budget' },
    { type: 'form', key: 'start' },
    { type: 'review_issue', key: 'My SSN is 123-45-6789' },
    { type: 'chat_text', key: 'what is dscr' },
    { type: 'form_exit', key: 'not_a_section' },
  ] }), res, store)
  assert.equal(res.payload.accepted, 4)
  const totals = await store.totals()
  assert.deepEqual(Object.keys(totals).sort(), ['field_help:total_budget', 'form:start', 'form_exit:business_info', 'review_issue:loan_gt_budget'])
})

test('chat outcomes are counted by category, never by text', async () => {
  const store = createMemoryStore()
  await recordChat(store, {
    body: { message: 'What is the rate for my bakery at 123 Main St?', field: { field_id: 'loan_amount' } },
    out: { reply: { kind: 'answer', from: 'claude', text: 'Rates are 8%–9.5%…', sources: [{ id: 're_flyer' }, { id: 'made_up' }] } },
  })
  const totals = await store.totals()
  assert.deepEqual(totals, { 'chat:total': 1, 'chat_kind:answer': 1, 'chat_from:claude': 1, 'chat_field:loan_amount': 1, 'chat_source:re_flyer': 1 })
  assert.ok(!JSON.stringify(totals).includes('bakery'))
})

test('star ratings are saved through our server', async () => {
  const store = createMemoryStore()
  let res = fakeRes()
  await feedbackHandler(post({ feedback_id: 'abc', rating: 4, submitted_at: new Date().toISOString() }), res, store)
  assert.equal(res.statusCode, 201)
  assert.ok(res.payload.record) // the rating card checks for this
  res = fakeRes()
  await feedbackHandler(post({ feedback_id: 'abc', rating: 9 }), res, store)
  assert.equal(res.statusCode, 400)
  assert.equal((await store.totals())['rating:4'], 1)
})

test('the insights dashboard is off without a password, and asks for it when set', async () => {
  const store = createMemoryStore()
  const saved = process.env.INSIGHTS_PASSWORD
  delete process.env.INSIGHTS_PASSWORD
  let res = fakeRes(); await insightsHandler({ url: '/insights', headers: {} }, res, store); assert.equal(res.statusCode, 404)
  process.env.INSIGHTS_PASSWORD = 'pilot-pass'
  res = fakeRes(); await insightsHandler({ url: '/insights', headers: {} }, res, store); assert.equal(res.statusCode, 401)
  const wrong = 'Basic ' + Buffer.from('staff:nope').toString('base64')
  res = fakeRes(); await insightsHandler({ url: '/insights', headers: { authorization: wrong } }, res, store); assert.equal(res.statusCode, 401)
  await store.incr('form:start'); await store.incr('form:submit'); await store.incr('rating:5')
  const right = 'Basic ' + Buffer.from('staff:pilot-pass').toString('base64')
  res = fakeRes(); await insightsHandler({ url: '/insights', headers: { authorization: right } }, res, store)
  assert.equal(res.statusCode, 200)
  assert.match(res.body, /forms started/)
  assert.match(res.body, /100%/)
  assert.equal(res.headers['x-robots-tag'], 'noindex')
  if (saved === undefined) delete process.env.INSIGHTS_PASSWORD; else process.env.INSIGHTS_PASSWORD = saved
})

test('the dashboard escapes anything it shows', () => {
  const html = renderDashboard({ 'review_issue:<script>alert(1)</script>': 3 }, { days: 30, storeKind: 'memory' })
  assert.ok(!html.includes('<script>alert'))
  assert.match(html, /reset when the server restarts/)
})

test('daily limits switch the AI off for that visitor (and site) and answer from the guide', async () => {
  const store = createMemoryStore()
  const saved = { ...process.env }
  process.env.OPENAI_API_KEY = 'test-key-not-used'
  process.env.ASSISTANT_VISITOR_DAILY = '1'
  const res1 = fakeRes()
  // Pre-fill the site-wide counter to the limit so no real API call is attempted.
  process.env.ASSISTANT_DAILY_LIMIT = '1'
  await store.incr('ai:daily', 1)
  await assistant(post({ message: 'What does AMI mean?' }), res1, { store })
  assert.equal(res1.payload.reply.from, 'field_guide_limit')
  assert.equal((await store.totals())['limit:site_daily'], 1)
  process.env = saved
})

test('browser events become counts with ids only', () => {
  assert.deepEqual(toCounted({ type: 'review_completed', can_submit: false, issue_ids: ['loan_gt_budget', 'missing_email'] }), [
    { type: 'review_result', key: 'blocked' }, { type: 'review_issue', key: 'loan_gt_budget' }, { type: 'review_issue', key: 'missing_email' },
  ])
  assert.deepEqual(toCounted({ type: 'assistant_question', field_id: 'x', message: 'secret' }), [])
  assert.deepEqual(toCounted({ type: 'form_left', section: 'impact' }), [{ type: 'form_exit', key: 'impact' }])
})

test('the staff summary lists double-check items with the applicant\'s notes', () => {
  const issues = runReview({ ...SAMPLE_APPLICANT, housing_units: '8', doc_project_plan: 'a.pdf', doc_dev_budget: 'b.pdf', doc_team_list: 'c.pdf', ack_truthful: true, ack_not_guaranteed: true, ack_credit: true })
  const text = buildStaffSummary({ issues, notes: { ami_mismatch: 'Two units are market-rate.' }, locale: 'es-US', now: new Date('2026-11-11') })
  assert.match(text, /^Application Copilot summary \(2026-11-11\)/)
  assert.match(text, /Review passed with \d+ item\(s\) to double-check/)
  assert.match(text, /Affordability units don’t match total units/)
  assert.match(text, /Applicant's note: "Two units are market-rate\."/)
  assert.match(text, /Applicant used the form in: es-US/)
  assert.ok(!/\d{3}-\d{2}-\d{4}/.test(text))
  assert.ok(text.length <= 3000)
})

test('drafts keep answers on this device only, never the SSN or files, and expire', async () => {
  const mem = new Map()
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  const { saveDraft, loadDraft, clearDraft, setDraftsOff } = await import('../src/prototype/draft.js?' + Date.now())
  const isFile = (id) => id.startsWith('doc_')
  assert.equal(saveDraft({ first_name: 'Jo', ssn: '123-45-6789', doc_pfs: 'pfs.pdf', _files: { doc_pfs: { name: 'pfs.pdf' } } }, { isFileField: isFile }), true)
  const d = loadDraft()
  assert.deepEqual(d.values, { first_name: 'Jo' })
  assert.equal(loadDraft({ now: Date.now() + 8 * 864e5 }), null) // expired after 7 days
  saveDraft({ first_name: 'Jo' }, { isFileField: isFile })
  setDraftsOff(true)
  assert.equal(loadDraft(), null)
  assert.equal(saveDraft({ first_name: 'Jo' }, { isFileField: isFile }), false)
  setDraftsOff(false)
  clearDraft()
  delete globalThis.localStorage
})
