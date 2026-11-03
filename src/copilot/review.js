// "Review My Application": rule-based pre-submission checks. No AI, no UI, no browser APIs.
//
// runReview(snapshot) takes the applicant's answers keyed by field id and returns a list of
// ReviewIssue objects in the shape the project brief calls the "structured review result":
//
//   {
//     id:               stable issue id, e.g. 'loan_gt_budget' or 'missing_first_name'
//     field_id:         field the applicant should look at ("Go to field" target)
//     check:            which review step found it (one of REVIEW_CHECKS ids)
//     level:            'blocker' | 'warning' | 'info'
//     category:         machine-readable reason, e.g. 'missing_required', 'cross_field_inconsistency'
//     title, message:   applicant-facing text (plain language, phrased as a question for warnings)
//     inline_message:   short text to show under the field, or null
//     suggested_action: 'fix' | 'verify_or_edit' | 'read_more'
//     source_ids:       keys into SOURCES (config.js) that back this check
//     blocking:         true only when an approved rule says Submit must wait (never set by AI)
//     requires_staff:   true when only Invest Detroit staff can resolve it
//   }
//
// A future AI consistency check should return the same shape with blocking: false.

import { FIELDS_BY_ID, visibleSections, validate } from './formDefinition.js'

export const REVIEW_CHECKS = [
  { id: 'required', label: 'Checking required questions' },
  { id: 'format', label: 'Checking answer formats' },
  { id: 'consistency', label: 'Checking that numbers add up' },
  { id: 'project_details', label: 'Checking project details' },
  { id: 'documents', label: 'Checking documents and acknowledgements' },
]

export const LEVELS = ['blocker', 'warning', 'info']

const INTAKE = ['intake_form_v59']

const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null
  const n = Number(String(v).replace(/[,$\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
const money = (n) => '$' + n.toLocaleString('en-US')
const labelOf = (id) => FIELDS_BY_ID[id]?.label || id

function issue(fields) {
  return {
    inline_message: null,
    suggested_action: fields.level === 'info' ? 'read_more' : fields.level === 'warning' ? 'verify_or_edit' : 'fix',
    source_ids: INTAKE,
    blocking: fields.level === 'blocker',
    requires_staff: false,
    ...fields,
  }
}

// ---- Individual checks. Each takes a context and returns zero or more issues. ---------------

function requiredAndFormat({ values }) {
  return Object.entries(validate(values)).map(([id, message]) => {
    const type = FIELDS_BY_ID[id]?.type
    const missing = message === 'This field is required.'
    if (type === 'file' || type === 'ack') {
      return issue({
        id: `missing_${id}`, field_id: id, check: 'documents', level: 'blocker',
        category: type === 'ack' ? 'missing_acknowledgement' : 'missing_document',
        title: type === 'ack' ? 'Acknowledgement not checked' : 'Required document missing',
        message: labelOf(id), inline_message: message,
      })
    }
    return issue({
      id: `${missing ? 'missing' : 'format'}_${id}`, field_id: id, check: missing ? 'required' : 'format', level: 'blocker',
      category: missing ? 'missing_required' : 'invalid_format',
      title: missing ? 'Required question left blank' : 'Answer format',
      message: missing ? labelOf(id) : `${labelOf(id)}: ${message}`, inline_message: message,
    })
  })
}

function loanVsBudget({ values }) {
  const budget = num(values.total_budget)
  const loan = num(values.loan_amount)
  if (budget === null || loan === null || loan <= budget) return []
  return [issue({
    id: 'loan_gt_budget', field_id: 'loan_amount', check: 'consistency', level: 'blocker',
    category: 'cross_field_inconsistency',
    title: 'Loan is larger than the total budget',
    message: `You asked for ${money(loan)}, but your total budget is ${money(budget)}. The loan request is usually part of the total budget, so please check both numbers.`,
    inline_message: 'Loan is larger than the total budget.',
  })]
}

function affordableUnits({ values, visibleIds }) {
  if (!visibleIds.has('housing_units')) return []
  const units = num(values.housing_units)
  const amiTotal = [...visibleIds].filter((id) => id.startsWith('ami_')).reduce((sum, id) => sum + (num(values[id]) || 0), 0)
  if (units === null || amiTotal === 0 || amiTotal === units) return []
  return [issue({
    id: 'ami_mismatch', field_id: 'housing_units', check: 'consistency', level: 'warning',
    category: 'cross_field_inconsistency',
    title: 'Affordability units don’t match total units',
    message: `You said the project creates ${units} housing units, but the affordability (AMI) boxes add up to ${amiTotal}. Is one of these numbers off?`,
  })]
}

function netVsGross({ values, visibleIds }) {
  const out = []
  for (const kind of ['retail', 'office', 'commercial', 'residential']) {
    const g = `${kind}_gross_sqft`, n = `${kind}_net_sqft`
    if (!visibleIds.has(g)) continue
    const gross = num(values[g]), net = num(values[n])
    if (gross === null || net === null || net <= gross) continue
    out.push(issue({
      id: `net_gt_gross_${kind}`, field_id: n, check: 'consistency', level: 'warning',
      category: 'possible_misunderstanding',
      title: `Net ${kind} square footage is larger than gross`,
      message: `Net square footage (${net.toLocaleString()}) is usually smaller than gross (${gross.toLocaleString()}), because gross includes walls, hallways and shared space. Could these be swapped?`,
    }))
  }
  return out
}

function emptyTypeSections({ values, visible }) {
  const out = []
  for (const s of visible) {
    if (!['retail', 'office', 'residential'].includes(s.id)) continue
    const inputs = s.fields.filter((f) => ['number', 'integer'].includes(f.type))
    if (!inputs.length || inputs.some((f) => num(values[f.id]) !== null)) continue
    out.push(issue({
      id: `empty_${s.id}`, field_id: inputs[0].id, check: 'project_details', level: 'warning',
      category: 'incomplete_section',
      title: `${s.title} section is empty`,
      message: `You chose "${values.real_estate_type}" as the type of real estate, so this section applies to you. Filling it in helps the team review your project faster.`,
    }))
  }
  return out
}

function equityGuidance({ values }) {
  if (values.equity_10pct !== 'No') return []
  return [issue({
    id: 'equity_no', field_id: 'equity_10pct', check: 'project_details', level: 'info',
    category: 'program_guidance',
    title: 'About the 10% contribution',
    message: 'You answered that you can’t provide at least 10% of the project cost as cash or equity. You can still submit. The Invest Detroit team may ask about other ways to fund that portion.',
  })]
}

function useOfFunds({ values, visibleIds }) {
  if (!visibleIds.has('use_of_funds') || values.use_of_funds) return []
  return [issue({
    id: 'use_of_funds_blank', field_id: 'use_of_funds', check: 'project_details', level: 'info',
    category: 'optional_unanswered',
    title: 'How the loan would be used',
    message: 'This question is optional, but answering it helps the team understand your request.',
  })]
}

/** Add, remove or reorder checks here. Each runs independently on the same snapshot. */
export const RULES = [requiredAndFormat, loanVsBudget, affordableUnits, netVsGross, emptyTypeSections, equityGuidance, useOfFunds]

/**
 * @param {Record<string, unknown>} values  answers keyed by field id (from any form adapter)
 * @returns {object[]} ReviewIssue list, blockers first
 */
export function runReview(values = {}) {
  const visible = visibleSections(values)
  const visibleIds = new Set(visible.flatMap((s) => s.fields.map((f) => f.id)))
  const ctx = { values, visible, visibleIds }
  const issues = RULES.flatMap((rule) => rule(ctx))
  return issues.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))
}

/** Submit is allowed only when no blocking issue remains. */
export const canSubmitWith = (issues) => !issues.some((i) => i.blocking)

/** Counts only, no answers: safe to send to analytics. */
export function summarizeIssues(issues) {
  const summary = { total: issues.length, blocking: 0, by_level: {}, by_category: {} }
  for (const i of issues) {
    if (i.blocking) summary.blocking += 1
    summary.by_level[i.level] = (summary.by_level[i.level] || 0) + 1
    summary.by_category[i.category] = (summary.by_category[i.category] || 0) + 1
  }
  return summary
}
