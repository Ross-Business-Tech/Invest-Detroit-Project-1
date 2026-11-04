import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runReview, canSubmitWith, summarizeIssues, REVIEW_CHECKS } from '../src/copilot/review.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'

const complete = {
  ...SAMPLE_APPLICANT,
  doc_project_plan: 'plan.pdf', doc_dev_budget: 'budget.pdf', doc_team_list: 'team.pdf',
  ack_truthful: true, ack_not_guaranteed: true, ack_credit: true,
}
const ids = (issues) => issues.map((i) => i.id)

test('empty form is blocked on required questions, documents and acknowledgements', () => {
  const issues = runReview({})
  assert.equal(canSubmitWith(issues), false)
  assert.ok(ids(issues).includes('missing_first_name'))
  assert.ok(ids(issues).includes('missing_doc_project_plan'))
  assert.ok(ids(issues).includes('missing_ack_credit'))
  assert.equal(issues.find((i) => i.id === 'missing_ack_credit').check, 'documents')
})

test('complete sample applicant can submit', () => {
  const issues = runReview(complete)
  assert.equal(canSubmitWith(issues), true, JSON.stringify(issues.filter((i) => i.blocking)))
})

test('loan larger than budget blocks submit', () => {
  const issues = runReview({ ...complete, loan_amount: '2000000' })
  const i = issues.find((x) => x.id === 'loan_gt_budget')
  assert.ok(i)
  assert.equal(i.blocking, true)
  assert.equal(i.field_id, 'loan_amount')
  assert.equal(canSubmitWith(issues), false)
})

test('consistency warnings never block', () => {
  const issues = runReview({ ...complete, housing_units: '9', retail_net_sqft: '9999' })
  for (const id of ['ami_mismatch', 'net_gt_gross_retail']) {
    const i = issues.find((x) => x.id === id)
    assert.ok(i, id)
    assert.equal(i.level, 'warning')
    assert.equal(i.blocking, false)
  }
  assert.equal(canSubmitWith(issues), true)
})

test('format problems are reported with an inline message', () => {
  const i = runReview({ ...complete, home_zip: '4820' }).find((x) => x.id === 'format_home_zip')
  assert.equal(i.inline_message, 'Please enter a 5 digit zip code.')
  assert.equal(i.check, 'format')
})

test('hidden follow-up questions are not required', () => {
  assert.ok(!ids(runReview(complete)).includes('missing_other_lender_text'))
  const withOther = { ...complete, other_lenders: ['Other (Please specify)'] }
  assert.ok(ids(runReview(withOther)).includes('missing_other_lender_text'))
})

test('the SSN field is never required or reviewed, even when it is shown', () => {
  const issues = runReview({ ...complete, criminal: 'Yes' })
  assert.ok(!issues.some((i) => i.field_id === 'ssn'))
  assert.ok(ids(issues).includes('missing_mi_entity_id'))
})

test('every issue follows the review result contract', () => {
  const checks = new Set(REVIEW_CHECKS.map((c) => c.id))
  const issues = runReview({ equity_10pct: 'No', real_estate_type: 'Retail', loan_amount: '5', total_budget: '1' })
  assert.ok(issues.length > 0)
  for (const i of issues) {
    for (const key of ['id', 'field_id', 'check', 'level', 'category', 'title', 'message', 'suggested_action', 'source_ids', 'blocking', 'requires_staff']) {
      assert.ok(key in i, `${i.id} missing ${key}`)
    }
    assert.ok(checks.has(i.check), `${i.id} has unknown check ${i.check}`)
    assert.equal(i.blocking, i.level === 'blocker')
  }
})

test('blockers come first', () => {
  const levels = runReview({ equity_10pct: 'No' }).map((i) => i.level)
  assert.equal(levels[0], 'blocker')
  assert.equal(levels.at(-1), 'info')
})

test('summary contains counts only, no answers', () => {
  const summary = summarizeIssues(runReview({ first_name: 'Jordan' }))
  assert.ok(summary.total > 0)
  assert.ok(!JSON.stringify(summary).includes('Jordan'))
})

test('a Yes to 10% that the loan amount contradicts is flagged, not blocked', () => {
  const i = runReview({ ...complete, total_budget: '1000000', loan_amount: '950000', equity_10pct: 'Yes' }).find((x) => x.id === 'equity_conflict')
  assert.ok(i)
  assert.equal(i.blocking, false)
  assert.match(i.message, /\$100,000/)
  assert.ok(!runReview({ ...complete, total_budget: '1000000', loan_amount: '850000' }).some((x) => x.id === 'equity_conflict'))
})

test('owner counts that do not add up are flagged', () => {
  const values = { ...complete, owner_count: '3', ethnicities: ['Asian', 'White'], eth_count_asian: '2', eth_count_white: '2' }
  const i = runReview(values).find((x) => x.id === 'owner_count_eth')
  assert.ok(i)
  assert.equal(i.params.sum, 4)
  assert.ok(!runReview({ ...values, eth_count_white: '1' }).some((x) => x.id === 'owner_count_eth'))
})

test('a CDO share over 100% blocks submit', () => {
  const issues = runReview({ ...complete, owners_cdo: 'Yes', cdo_pct: '150' })
  assert.ok(issues.find((x) => x.id === 'cdo_pct_range').blocking)
})

test('a tiny budget asks whether it is in dollars', () => {
  assert.ok(runReview({ ...complete, total_budget: '1450', loan_amount: '600' }).some((x) => x.id === 'budget_units'))
})

test('a very short summary gets a non-blocking tip', () => {
  const i = runReview({ ...complete, executive_summary: 'Grow the business' }).find((x) => x.id === 'summary_short')
  assert.equal(i.level, 'info')
})

test('the complete sample applicant still passes with no new warnings', () => {
  const ids = runReview(complete).map((i) => i.id)
  for (const id of ['equity_conflict', 'owner_count_eth', 'owner_count_gender', 'budget_units', 'summary_short', 'cdo_pct_range']) assert.ok(!ids.includes(id), id)
})

test('tips from Invest Detroit documents are information only and cite their source', () => {
  const cases = [
    [{ loan_amount: '100000' }, 'loan_outside_range', 're_flyer'],
    [{ loan_amount: '3000000', total_budget: '9000000' }, 'loan_outside_range', 're_flyer'],
    [{ use_of_funds: 'Machinery & Equipment' }, 'equipment_program', 'sb_flyer'],
    [{ use_of_funds: 'Constructed Improvements' }, 'construction_before_closing', 'lending_guide'],
    [{ executive_summary: 'We will turn a vacant building on Grand River into six apartments above two new shops.' }, 'summary_experience', 're_flyer'],
  ]
  for (const [change, id, source] of cases) {
    const issues = runReview({ ...complete, ...change })
    const i = issues.find((x) => x.id === id)
    assert.ok(i, id)
    assert.equal(i.level, 'info', id)
    assert.equal(i.blocking, false, id)
    assert.ok(i.source_ids.includes(source), id)
    assert.equal(canSubmitWith(issues), true, id)
  }
})

test('document tips stay quiet when they do not apply', () => {
  const issues = ids(runReview({
    ...complete, loan_amount: '600000', use_of_funds: 'Refinance',
    executive_summary: 'Our team has completed three similar rehabs in Detroit. We will renovate a vacant building into six apartments.',
  }))
  for (const id of ['loan_outside_range', 'equipment_program', 'construction_before_closing', 'summary_experience']) assert.ok(!issues.includes(id), id)
})
