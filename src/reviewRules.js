// Rule-based "Review My Application" checks. No AI here: every check is a fixed rule.
// level: 'blocker' (must fix before Submit), 'warning' (please double-check), 'info' (helpful note)
import { SECTIONS, visibleSections, validate } from './formSchema.js'

export const REVIEW_STEPS = [
  'Checking required questions',
  'Checking answer formats',
  'Checking that numbers add up',
  'Checking project details',
  'Checking documents and acknowledgements',
]

const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null
  const n = Number(String(v).replace(/[,$\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
const money = (n) => '$' + n.toLocaleString('en-US')

const labelOf = (() => {
  const map = {}
  for (const s of SECTIONS) for (const f of s.fields) if (f.label) map[f.id] = f.label
  return (id) => map[id] || id
})()

const DOC_OR_ACK = new Set(['doc_project_plan', 'doc_dev_budget', 'doc_team_list', 'ack_truthful', 'ack_not_guaranteed', 'ack_credit'])

export function runReview(values) {
  const issues = []
  const visible = visibleSections(values)
  const visibleIds = new Set(visible.flatMap((s) => s.fields.map((f) => f.id)))
  const sectionOf = {}
  for (const s of visible) for (const f of s.fields) sectionOf[f.id] = s.title

  // 1 + 2 + 5: required fields and formats (same rules as the real form)
  for (const [id, message] of Object.entries(validate(values))) {
    const missing = message === 'This field is required.'
    issues.push({
      id: `rule_${id}`,
      fieldId: id,
      level: 'blocker',
      step: DOC_OR_ACK.has(id) ? 4 : missing ? 0 : 1,
      title: missing ? (DOC_OR_ACK.has(id) && id.startsWith('ack') ? 'Acknowledgement not checked' : DOC_OR_ACK.has(id) ? 'Required document missing' : 'Required question left blank') : 'Answer format',
      message: missing ? labelOf(id) : `${labelOf(id)}: ${message}`,
      section: sectionOf[id],
      fieldMessage: message,
    })
  }

  // 3: numbers add up
  const budget = num(values.total_budget)
  const loan = num(values.loan_amount)
  if (budget !== null && loan !== null && loan > budget) {
    issues.push({
      id: 'loan_gt_budget', fieldId: 'loan_amount', level: 'blocker', step: 2, section: sectionOf.loan_amount,
      title: 'Loan is larger than the total budget',
      message: `You asked for ${money(loan)}, but your total budget is ${money(budget)}. The loan request is usually part of the total budget, so please check both numbers.`,
    })
  }

  if (visibleIds.has('housing_units')) {
    const units = num(values.housing_units)
    const amiIds = [...visibleIds].filter((id) => id.startsWith('ami_'))
    const amiTotal = amiIds.reduce((sum, id) => sum + (num(values[id]) || 0), 0)
    if (units !== null && amiTotal > 0 && amiTotal !== units) {
      issues.push({
        id: 'ami_mismatch', fieldId: 'housing_units', level: 'warning', step: 2, section: sectionOf.housing_units,
        title: 'Affordability units don’t match total units',
        message: `You said the project creates ${units} housing units, but the affordability (AMI) boxes add up to ${amiTotal}. Is one of these numbers off?`,
      })
    }
  }

  for (const kind of ['retail', 'office', 'commercial', 'residential']) {
    const g = `${kind}_gross_sqft`, n = `${kind}_net_sqft`
    if (!visibleIds.has(g)) continue
    const gross = num(values[g]), net = num(values[n])
    if (gross !== null && net !== null && net > gross) {
      issues.push({
        id: `net_gt_gross_${kind}`, fieldId: n, level: 'warning', step: 2, section: sectionOf[n],
        title: `Net ${kind} square footage is larger than gross`,
        message: `Net square footage (${net.toLocaleString()}) is usually smaller than gross (${gross.toLocaleString()}), because gross includes walls, hallways and shared space. Could these be swapped?`,
      })
    }
  }

  // 4: project details
  const typeSections = { retail: 'Retail Project', office: 'Office/Commercial Project', residential: 'Residential Project' }
  for (const s of visible) {
    if (!Object.values(typeSections).includes(s.title)) continue
    const inputs = s.fields.filter((f) => ['number', 'integer'].includes(f.type))
    if (inputs.length && inputs.every((f) => num(values[f.id]) === null)) {
      issues.push({
        id: `empty_${s.id}`, fieldId: inputs[0].id, level: 'warning', step: 3, section: s.title,
        title: `${s.title} section is empty`,
        message: `You chose "${values.real_estate_type}" as the type of real estate, so this section applies to you. Filling it in helps the team review your project faster.`,
      })
    }
  }

  if (values.equity_10pct === 'No') {
    issues.push({
      id: 'equity_no', fieldId: 'equity_10pct', level: 'info', step: 3, section: sectionOf.equity_10pct,
      title: 'About the 10% contribution',
      message: 'You answered that you can’t provide at least 10% of the project cost as cash or equity. You can still submit. The Invest Detroit team may ask about other ways to fund that portion.',
    })
  }

  if (values.use_of_funds === undefined && visibleIds.has('use_of_funds')) {
    issues.push({
      id: 'use_of_funds_blank', fieldId: 'use_of_funds', level: 'info', step: 3, section: sectionOf.use_of_funds,
      title: 'How the loan would be used',
      message: 'This question is optional, but answering it helps the team understand your request.',
    })
  }

  return issues
}
