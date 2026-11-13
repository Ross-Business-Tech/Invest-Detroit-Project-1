// Run: node tools/run-test-set.mjs   (writes docs/handoff/test-results.csv and prints the score)
// Runs every example in docs/handoff/test-set.json through the real code: the form review
// (validate + Review My Application) and the chat assistant's server handler, which applies the
// guardrails. By default the chat rows are answered by the built-in field guide.
//
// With the AI:  OPENAI_API_KEY=... node tools/run-test-set.mjs --ai
//   (run on a computer, never paste the key into a chat or file) sends the chat rows to OpenAI,
//   exactly as the live site does, and writes test-results-ai.csv/json instead. The automatic
//   checks look for key phrases, so a person should read every FAIL: a reworded but correct answer
//   counts as a pass once a person has checked it (note it in the sheet).
// Rule: rerun the full set before changing the prompt or rules, and don't keep a change that
// lowers the score.
import { readFileSync, writeFileSync } from 'node:fs'
import { validate } from '../src/copilot/formDefinition.js'
import { runReview, canSubmitWith } from '../src/copilot/review.js'
import { handleAssistantRequest } from '../server/assistantHandler.js'
import { aiProvider, createAnswerer, PROVIDER_NAME } from '../server/aiProvider.js'
import { OUT_OF_SCOPE_MESSAGE } from '../src/copilot/guardrails/index.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'

const here = new URL('../docs/handoff/', import.meta.url)
const USE_AI = process.argv.includes('--ai')
const provider = USE_AI ? aiProvider() : null
if (USE_AI && !provider) { console.error('--ai needs OPENAI_API_KEY (or ANTHROPIC_API_KEY) set in this terminal.'); process.exit(1) }
const answer = provider ? createAnswerer(provider) : undefined
const suffix = provider ? '-ai' : ''
const { cases } = JSON.parse(readFileSync(new URL('test-set.json', here), 'utf8'))

// The same clean example application used for the measured impact (tools/measure-impact.mjs).
const base = { ...SAMPLE_APPLICANT, office_gross_sqft: '1200', office_net_sqft: '1050',
  executive_summary: 'Our team has completed three similar rehabs in Detroit. We will renovate a vacant two-story building into 6 apartments above 2 ground-floor shops.',
  doc_project_plan: 'Project-Plan.pdf', doc_dev_budget: 'Development-Budget.pdf', doc_team_list: 'Team-List.pdf',
  ack_truthful: true, ack_not_guaranteed: true, ack_credit: true,
  _files: { doc_project_plan: { name: 'Project-Plan.pdf', size: 90000 }, doc_dev_budget: { name: 'Development-Budget.pdf', size: 60000 }, doc_team_list: { name: 'Team-List.pdf', size: 20000 } } }

const short = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }

async function runCase(c) {
  const k = c.check
  const fails = []
  let actual
  if (k.review) {
    const v = { ...base, ...k.review }
    const issues = runReview(v)
    const errors = Object.keys(validate(v))
    const ids = issues.map((i) => i.id)
    const can = canSubmitWith(issues) && errors.length === 0
    actual = `${can ? 'Submit allowed' : 'Submit blocked'}; flagged: ${errors.length ? 'form errors: ' + errors.join(', ') + '; ' : ''}${ids.length ? issues.map((i) => i.title || i.id).join('; ') : 'nothing'}`
    for (const id of k.flags || []) if (!ids.includes(id)) fails.push(`did not flag ${id}`)
    for (const id of k.errors || []) if (!errors.includes(id)) fails.push(`did not catch ${id}`)
    for (const id of k.notFlags || []) if (ids.includes(id)) fails.push(`wrongly flagged ${id}`)
    if (k.canSubmit !== undefined && can !== k.canSubmit) fails.push(k.canSubmit ? 'blocked a correct application' : 'let it submit')
  } else {
    const reply = (await handleAssistantRequest({ ...k.chat }, answer ? { answer, lenientScope: true } : {})).body.reply
    actual = `[${reply.kind}] ${short(reply.text)}${reply.sources?.length ? ` (source: ${reply.sources.map((s) => s.title || s.id).join(', ')})` : ''}`
    if (k.kind && !k.kind.includes(reply.kind)) fails.push(`reply type was ${reply.kind}`)
    if (k.notKind && k.notKind.includes(reply.kind)) fails.push(`answered when it should have refused`)
    if (k.text && !reply.text.toLowerCase().includes(k.text.toLowerCase())) fails.push(`missing "${k.text}"`)
    if (k.hasSource && !reply.sources?.length) fails.push('no source shown')
    if (k.outOfScope && reply.text !== OUT_OF_SCOPE_MESSAGE) fails.push('did not give the standard off-topic message')
  }
  return { ...c, actual, pass: fails.length === 0, notes: [fails.join('; '), c.reviewer_note || ''].filter(Boolean).join(' ') }
}

const rows = []
for (const c of cases) rows.push(await runCase(c))
const passed = rows.filter((r) => r.pass).length
const byCat = {}
for (const r of rows) { byCat[r.category] ??= [0, 0]; byCat[r.category][1]++; if (r.pass) byCat[r.category][0]++ }

const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
const lines = [
  ['Score', `${passed}/${rows.length}`, Object.entries(byCat).map(([k, [p, t]]) => `${k} ${p}/${t}`).join(' · ')],
  ['Run on', new Date().toISOString().slice(0, 10), provider ? `Chat rows answered by ${PROVIDER_NAME[provider]} (${process.env.OPENAI_MODEL || 'default model'}); a person reviewed each FAIL.` : 'Chat rows answered by the built-in field guide (AI key not connected).'],
  ['Main miss', '', rows.filter((r) => !r.pass).map((r) => `${r.id}: ${r.input}`).join(' | ') || 'none'],
  [],
  ['ID', 'Area', 'Category', 'Input', 'Expected (written before running)', 'Actual', 'Pass/Fail', 'Notes'],
  ...rows.map((r) => [r.id, r.area, r.category, r.input, r.expected, r.actual, r.pass ? 'PASS' : 'FAIL', r.notes]),
]
writeFileSync(new URL(`test-results${suffix}.csv`, here), lines.map((l) => l.map(csvCell).join(',')).join('\n') + '\n')
writeFileSync(new URL(`test-results${suffix}.json`, here), JSON.stringify({ score: `${passed}/${rows.length}`, byCategory: byCat, rows }, null, 2) + '\n')
for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.id, r.input, r.pass ? '' : '→ ' + r.notes, '\n     ', r.actual)
console.log(`\nSCORE ${passed}/${rows.length}`, byCat)
