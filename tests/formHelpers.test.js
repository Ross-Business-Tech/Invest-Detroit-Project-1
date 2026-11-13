import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMoney, formatMoneyInput, moneyNote, equityMath, stateForZip, checkFile, formProgress } from '../src/copilot/formHelpers.js'
import { validate } from '../src/copilot/formDefinition.js'
import { runReview, canSubmitWith } from '../src/copilot/review.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'
import { answerFromGuide, NO_MATCH } from '../src/copilot/guideTransport.js'
import { buildRequest } from '../src/copilot/assistant.js'

test('money is formatted as people type and still read as a number', () => {
  assert.equal(formatMoneyInput('1450000'), '1,450,000')
  assert.equal(formatMoneyInput('$1,450,000'), '1,450,000')
  assert.equal(formatMoneyInput('0012.345'), '12.34')
  assert.equal(parseMoney('1,450,000'), 1450000)
  assert.equal(parseMoney('abc'), null)
  assert.deepEqual(moneyNote('1,450,000').params, { amount: '$1.45' })
  assert.deepEqual(moneyNote('145000').params, { amount: '$145' })
  assert.equal(moneyNote('500'), null)
  assert.deepEqual(validate({ total_budget: '1,450,000' }).total_budget, undefined)
})

test('the 10% equity math uses the total budget', () => {
  assert.deepEqual(equityMath({ total_budget: '1,450,000' }).params, { budget: '$1,450,000', ten: '$145,000' })
  assert.equal(equityMath({}), null)
})

test('a phone number needs 10 digits', () => {
  assert.equal(validate({ phone: '313-555' }).phone, 'Please enter a 10 digit phone number.')
  for (const ok of ['313-555-0142', '(313) 555-0142', '+1 313 555 0142']) assert.equal(validate({ phone: ok }).phone, undefined, ok)
})

test('state is filled only for Michigan ZIP codes', () => {
  assert.equal(stateForZip('48207'), 'MI')
  assert.equal(stateForZip('49503'), 'MI')
  assert.equal(stateForZip('10001'), null)
  assert.equal(stateForZip('482'), null)
})

test('files are checked by name and size only', () => {
  const keys = (f) => checkFile('doc_dev_budget', f).map((c) => c.key)
  assert.deepEqual(keys({ name: 'Development-Budget.pdf', size: 20000 }), [])
  assert.deepEqual(keys({ name: 'scan001.pdf', size: 20000 }), ['name'])
  assert.deepEqual(keys({ name: 'IMG_1234.heic', size: 20000 }), ['type', 'name'])
  assert.deepEqual(keys({ name: 'Budget.pdf', size: 0 }), ['empty'])
  assert.deepEqual(keys({ name: 'Budget.pdf', size: 30 * 1024 * 1024 }), ['large'])
  // In the review: an empty file blocks Submit; a vague name is only a tip.
  const base = { ...SAMPLE_APPLICANT, doc_project_plan: 'plan.pdf', doc_team_list: 'team.pdf', ack_truthful: true, ack_not_guaranteed: true, ack_credit: true }
  const empty = runReview({ ...base, doc_dev_budget: 'Budget.pdf', _files: { doc_dev_budget: { name: 'Budget.pdf', size: 0 } } })
  assert.equal(canSubmitWith(empty), false)
  const vague = runReview({ ...base, doc_dev_budget: 'scan001.pdf', _files: { doc_dev_budget: { name: 'scan001.pdf', size: 900 } } })
  assert.equal(canSubmitWith(vague), true)
  assert.ok(vague.some((i) => i.id === 'file_name_doc_dev_budget' && i.level === 'info'))
})

test('progress counts required answers per section', () => {
  const empty = formProgress({})
  assert.equal(empty.done, 0)
  assert.ok(empty.total > 20)
  const docs = empty.sections.find((s) => s.id === 'required_docs')
  assert.deepEqual([docs.done, docs.total], [0, 3])
  const contact = formProgress({ first_name: 'A', phone: '313-555' }).sections.find((s) => s.id === 'contact')
  assert.equal(contact.done, 1) // a 7-digit phone doesn't count as done
})

test('the no-answer reply makes the assistant\'s limits clear', () => {
  assert.match(NO_MATCH, /^I can only help with this form and Invest Detroit's lending process/)
  assert.equal(answerFromGuide(buildRequest({ message: 'Can my cat sign the form?' })).text, NO_MATCH)
})
