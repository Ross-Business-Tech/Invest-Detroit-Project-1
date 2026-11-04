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
//     title, message:   applicant-facing text in English (plain language, warnings phrased as questions)
//     title_template, message_template, params:
//                       the same text as a template + values, so screens can translate it
//     inline_message:   short text to show under the field, or null
//     suggested_action: 'fix' | 'verify_or_edit' | 'read_more'
//     source_ids:       keys into SOURCES (config.js) that back this check
//     blocking:         true only when an approved rule says Submit must wait (never set by AI)
//     requires_staff:   true when only Invest Detroit staff can resolve it
//   }
//
// A future AI consistency check should return the same shape with blocking: false.

import { FIELDS_BY_ID, visibleSections, validate } from './formDefinition.js'
import { fill } from './text.js'

export const REVIEW_CHECKS = [
  { id: 'required', label: 'Checking required questions' },
  { id: 'format', label: 'Checking answer formats' },
  { id: 'consistency', label: 'Checking that numbers add up' },
  { id: 'project_details', label: 'Checking project details' },
  { id: 'documents', label: 'Checking documents and acknowledgements' },
]

export const LEVELS = ['blocker', 'warning', 'info']

/** How the review panel groups issues, in order. */
export const REVIEW_GROUPS = [
  { key: 'blocker', title: 'Must fix before submitting', icon: '!' },
  { key: 'warning', title: 'Please double-check', icon: '?' },
  { key: 'info', title: 'Good to know', icon: 'i' },
]

const INTAKE = ['intake_form_v59']

const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null
  const n = Number(String(v).replace(/[,$\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
const money = (n) => '$' + n.toLocaleString('en-US')
const labelOf = (id) => FIELDS_BY_ID[id]?.label || id

// Every applicant-facing sentence the review can produce. Kept together so they can be translated.
export const REVIEW_TEXT = {
  missingTitle: 'Required question left blank',
  formatTitle: 'Answer format',
  docTitle: 'Required document missing',
  ackTitle: 'Acknowledgement not checked',
  fieldOnly: '{field}',
  fieldProblem: '{field}: {problem}',
  loanTitle: 'Loan is larger than the total budget',
  loanMessage: 'You asked for {loan}, but your total budget is {budget}. The loan request is usually part of the total budget, so please check both numbers.',
  loanInline: 'Loan is larger than the total budget.',
  amiTitle: 'Affordability units don’t match total units',
  amiMessage: 'You said the project creates {units} housing units, but the affordability (AMI) boxes add up to {ami}. Is one of these numbers off?',
  netTitle: 'Net {kind} square footage is larger than gross',
  netMessage: 'Net square footage ({net}) is usually smaller than gross ({gross}), because gross includes walls, hallways and shared space. Could these be swapped?',
  emptyTitle: '{section} section is empty',
  emptyMessage: 'You chose "{type}" as the type of real estate, so this section applies to you. Filling it in helps the team review your project faster.',
  equityTitle: 'About the 10% contribution',
  equityMessage: 'You answered that you can’t provide at least 10% of the project cost as cash or equity. You can still submit. The Invest Detroit team may ask about other ways to fund that portion.',
  fundsTitle: 'How the loan would be used',
  fundsMessage: 'This question is optional, but answering it helps the team understand your request.',
  kinds: ['retail', 'office', 'commercial', 'residential'],
  equityConflictTitle: 'Your 10% contribution and loan amount don’t fit together',
  equityConflictMessage: 'You answered Yes to contributing at least 10% of the project cost ({ten}), but your loan request ({loan}) leaves only {left} of your {budget} budget for everything else. Please check the loan amount, the total budget, or your answer.',
  ownerCountTitle: 'Owner counts don’t add up',
  ownerCountMessage: 'You said the business has {owners} owners, but the {group} boxes add up to {sum}. Each owner should be counted once.',
  groups: ['ethnic background', 'gender'],
  percentTitle: 'Percentage over 100',
  percentMessage: 'The percentage owned by the Community Development Organization can’t be more than 100.',
  percentInline: 'Please enter a number from 0 to 100.',
  tinyBudgetTitle: 'Is the total budget in dollars?',
  tinyBudgetMessage: 'You entered {budget} as the total budget. That is unusually small for a real estate project. Did you mean to enter it in thousands, or leave out some zeros?',
  shortSummaryTitle: 'Your summary could say more',
  shortSummaryMessage: 'A clearer summary helps the team understand your project faster. Try to include what you will build or do, where, and roughly when.',
  // Tips based on Invest Detroit's program flyers and lending guide. Information only: never blocking.
  loanRangeTitle: 'Your loan request is outside the typical range',
  loanRangeMessage: 'You asked for {loan}. Invest Detroit’s Real Estate Support flyer gives a typical loan size of $150,000 to $2,500,000 (subject to change). You can still submit. It may help to talk with the team first about how your request fits.',
  equipmentTitle: 'Equipment loans may fit another program',
  equipmentMessage: 'You chose Machinery & Equipment. This form is for Real Estate and C&I lending. If the money is mainly for your own business’s equipment, Invest Detroit’s Small Business program may fit better. You can still submit, and the team can tell you which program fits.',
  constructionTitle: 'Please don’t start construction before closing',
  constructionMessage: 'Invest Detroit’s lending guide asks borrowers not to start construction before the loan closes unless Invest Detroit approves it, because starting early can affect lien rights, costs and the financing. Screening to closing typically takes several months, so plan your start date with that in mind.',
  experienceTitle: 'Consider mentioning your team’s experience',
  experienceMessage: 'Invest Detroit’s Real Estate flyer says financing typically goes to borrowers with relevant experience and a viable plan. One sentence about similar projects you or your team have done can help. New developers are welcome to apply.',
}
const R = REVIEW_TEXT

function issue({ title, message, params = {}, ...fields }) {
  return {
    title: fill(title, params),
    message: fill(message, params),
    title_template: title,
    message_template: message,
    params,
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
        title: type === 'ack' ? R.ackTitle : R.docTitle,
        message: R.fieldOnly, params: { field: labelOf(id) }, inline_message: message,
      })
    }
    return issue({
      id: `${missing ? 'missing' : 'format'}_${id}`, field_id: id, check: missing ? 'required' : 'format', level: 'blocker',
      category: missing ? 'missing_required' : 'invalid_format',
      title: missing ? R.missingTitle : R.formatTitle,
      message: missing ? R.fieldOnly : R.fieldProblem,
      params: missing ? { field: labelOf(id) } : { field: labelOf(id), problem: message },
      inline_message: message,
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
    title: R.loanTitle, message: R.loanMessage, params: { loan: money(loan), budget: money(budget) },
    inline_message: R.loanInline,
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
    title: R.amiTitle, message: R.amiMessage, params: { units, ami: amiTotal },
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
      title: R.netTitle, message: R.netMessage,
      params: { kind, net: net.toLocaleString('en-US'), gross: gross.toLocaleString('en-US') },
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
      title: R.emptyTitle, message: R.emptyMessage, params: { section: s.title, type: values.real_estate_type },
    }))
  }
  return out
}

function equityGuidance({ values }) {
  if (values.equity_10pct !== 'No') return []
  return [issue({
    id: 'equity_no', field_id: 'equity_10pct', check: 'project_details', level: 'info',
    category: 'program_guidance',
    title: R.equityTitle, message: R.equityMessage,
  })]
}

function useOfFunds({ values, visibleIds }) {
  if (!visibleIds.has('use_of_funds') || values.use_of_funds) return []
  return [issue({
    id: 'use_of_funds_blank', field_id: 'use_of_funds', check: 'project_details', level: 'info',
    category: 'optional_unanswered',
    title: R.fundsTitle, message: R.fundsMessage,
  })]
}

// ---- "Possible misunderstanding" checks done with plain rules (the brief planned these for AI).
// Each flags only a real contradiction in the numbers, and none of them blocks Submit except an
// impossible percentage.

function equityConflict({ values }) {
  const budget = num(values.total_budget)
  const loan = num(values.loan_amount)
  // If the loan alone is over 90% of the budget, the applicant's own share must be under 10%,
  // whatever other lenders contribute. (Loan > budget is already its own blocker.)
  if (values.equity_10pct !== 'Yes' || !budget || loan === null || loan > budget || loan <= budget * 0.9) return []
  return [issue({
    id: 'equity_conflict', field_id: 'equity_10pct', check: 'consistency', level: 'warning',
    category: 'cross_field_inconsistency',
    title: R.equityConflictTitle, message: R.equityConflictMessage,
    params: { ten: money(Math.ceil(budget * 0.1)), loan: money(loan), left: money(budget - loan), budget: money(budget) },
  })]
}

function ownerCounts({ values, visibleIds }) {
  const owners = num(values.owner_count)
  if (owners === null) return []
  const out = []
  for (const [prefix, group] of [['eth_count_', R.groups[0]], ['gender_count_', R.groups[1]]]) {
    const ids = [...visibleIds].filter((id) => id.startsWith(prefix))
    const filled = ids.filter((id) => num(values[id]) !== null)
    if (!filled.length) continue
    const sum = filled.reduce((n, id) => n + num(values[id]), 0)
    if (sum === owners) continue
    out.push(issue({
      id: `owner_count_${prefix.split('_')[0]}`, field_id: filled[0], check: 'consistency', level: 'warning',
      category: 'cross_field_inconsistency',
      title: R.ownerCountTitle, message: R.ownerCountMessage, params: { owners, group, sum },
    }))
  }
  return out
}

function percentRange({ values, visibleIds }) {
  const pct = num(values.cdo_pct)
  if (!visibleIds.has('cdo_pct') || pct === null || pct <= 100) return []
  return [issue({
    id: 'cdo_pct_range', field_id: 'cdo_pct', check: 'format', level: 'blocker',
    category: 'invalid_format', title: R.percentTitle, message: R.percentMessage, inline_message: R.percentInline,
  })]
}

function tinyBudget({ values }) {
  const budget = num(values.total_budget)
  if (budget === null || budget <= 0 || budget >= 10000) return []
  return [issue({
    id: 'budget_units', field_id: 'total_budget', check: 'consistency', level: 'warning',
    category: 'possible_misunderstanding',
    title: R.tinyBudgetTitle, message: R.tinyBudgetMessage, params: { budget: money(budget) },
  })]
}

function shortSummary({ values }) {
  const text = String(values.executive_summary || '').trim()
  if (!text || text.length >= 60) return []
  return [issue({
    id: 'summary_short', field_id: 'executive_summary', check: 'project_details', level: 'info',
    category: 'clarity', title: R.shortSummaryTitle, message: R.shortSummaryMessage,
  })]
}

// ---- Tips from Invest Detroit's documents. Information only; they never block Submit. --------

const FLYER = ['re_flyer']
const LOAN_MIN = 150000
const LOAN_MAX = 2500000

function loanRange({ values }) {
  const loan = num(values.loan_amount)
  if (loan === null || loan <= 0 || (loan >= LOAN_MIN && loan <= LOAN_MAX)) return []
  return [issue({
    id: 'loan_outside_range', field_id: 'loan_amount', check: 'project_details', level: 'info',
    category: 'program_guidance', source_ids: FLYER,
    title: R.loanRangeTitle, message: R.loanRangeMessage, params: { loan: money(loan) },
  })]
}

function equipmentProgram({ values, visibleIds }) {
  if (!visibleIds.has('use_of_funds') || values.use_of_funds !== 'Machinery & Equipment') return []
  return [issue({
    id: 'equipment_program', field_id: 'use_of_funds', check: 'project_details', level: 'info',
    category: 'program_guidance', source_ids: ['sb_flyer', 'program_overviews'], requires_staff: true,
    title: R.equipmentTitle, message: R.equipmentMessage,
  })]
}

function constructionTiming({ values, visibleIds }) {
  if (!visibleIds.has('use_of_funds') || values.use_of_funds !== 'Constructed Improvements') return []
  return [issue({
    id: 'construction_before_closing', field_id: 'use_of_funds', check: 'project_details', level: 'info',
    category: 'program_guidance', source_ids: ['lending_guide'],
    title: R.constructionTitle, message: R.constructionMessage,
  })]
}

const EXPERIENCE = /experien|track record|\b(have|has|we've|i've|already) (completed|built|developed|renovated|rehabbed|managed|owned|done|led)\b|\bcompleted (\d+|two|three|four|five|several|many)\b|\b(previous|prior|past) (project|projects|development|developments|work|deals?)\b|\b\d+\+? years|\bsince (19|20)\d\d|portfolio/i

function summaryExperience({ values }) {
  const text = String(values.executive_summary || '').trim()
  // Short summaries already get the "could say more" tip.
  if (text.length < 60 || EXPERIENCE.test(text)) return []
  return [issue({
    id: 'summary_experience', field_id: 'executive_summary', check: 'project_details', level: 'info',
    category: 'clarity', source_ids: FLYER,
    title: R.experienceTitle, message: R.experienceMessage,
  })]
}

/** Add, remove or reorder checks here. Each runs independently on the same snapshot. */
export const RULES = [
  requiredAndFormat, loanVsBudget, affordableUnits, netVsGross, emptyTypeSections, equityGuidance, useOfFunds,
  equityConflict, ownerCounts, percentRange, tinyBudget, shortSummary,
  loanRange, equipmentProgram, constructionTiming, summaryExperience,
]

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
