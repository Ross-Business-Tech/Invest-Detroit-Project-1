// Run: node tools/measure-impact.mjs  (numbers used on the "Mistakes caught before submitting" slide)
// Same example applications through (a) today's Submit checks and (b) the copilot.
// "Today" = formDefinition.validate() minus the phone rule we added (the official form's own
// required/format checks as copied into the replica). "Copilot" = validate() + runReview()
// (+ file checks, which the review receives as values._files).
import { validate } from '../src/copilot/formDefinition.js'
import { runReview } from '../src/copilot/review.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'

const base = { ...SAMPLE_APPLICANT, office_gross_sqft: '1200', office_net_sqft: '1050',
  executive_summary: 'Our team has completed three similar rehabs in Detroit. We will renovate a vacant two-story building into 6 apartments above 2 ground-floor shops.',
  doc_project_plan: 'Project-Plan.pdf', doc_dev_budget: 'Development-Budget.pdf', doc_team_list: 'Team-List.pdf',
  ack_truthful: true, ack_not_guaranteed: true, ack_credit: true,
  _files: { doc_project_plan: { name: 'Project-Plan.pdf', size: 90000 }, doc_dev_budget: { name: 'Development-Budget.pdf', size: 60000 }, doc_team_list: { name: 'Team-List.pdf', size: 20000 } } }

const todayErrors = (v) => { const e = validate(v); if (e.phone === 'Please enter a 10 digit phone number.') delete e.phone; return Object.keys(e) }
const baseIssues = new Set(runReview(base).map((i) => i.id))
const copilotNew = (v) => [...new Set([...runReview(v).map((i) => i.id).filter((id) => !baseIssues.has(id)), ...Object.keys(validate(v)).map((k) => 'validate:' + k)])]

const CASES = [
  ['Required question left blank (job title)', { job_title: '' }],
  ['Email address mistyped', { email: 'jordan.ellis@example' }],
  ['Loan request larger than the total budget', { loan_amount: '2000000' }],
  ['Total budget missing zeros ($1,450)', { total_budget: '1450', loan_amount: '600' }],
  ['Affordable-unit counts don’t add up to housing units', { housing_units: '8' }],
  ['Net square footage entered larger than gross', { retail_net_sqft: '3400' }],
  ['“Yes” to 10% equity, but the loan is 95% of the budget', { loan_amount: '1380000' }],
  ['Owner counts don’t match number of owners', { owner_count: '3', ethnicities: ['Asian', 'White'], eth_count_asian: '1', eth_count_white: '1' }],
  ['Mixed-use project with the office section left blank', { real_estate_type: 'Mixed Use', office_gross_sqft: '', office_net_sqft: '' }],
  ['One-line executive summary', { executive_summary: 'Apartments and shops.' }],
]
const rows = []
for (const [label, change] of CASES) {
  const v = { ...base, ...change }
  const today = todayErrors(v).length > 0
  const cop = copilotNew(v)
  rows.push({ label, today, copilot: cop.length > 0, ids: cop.join(',') })
}
console.log('baseline today errors:', todayErrors(base), '| baseline copilot issues:', [...baseIssues])
for (const r of rows) console.log((r.today ? 'T' : '-') + (r.copilot ? 'C' : '-'), r.label, '|', r.ids)
const t = rows.filter((r) => r.today).length, c = rows.filter((r) => r.copilot).length
console.log(`TODAY ${t}/${rows.length}  COPILOT ${c}/${rows.length}`)
