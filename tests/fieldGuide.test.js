import { test } from 'node:test'
import assert from 'node:assert/strict'
import { answerFromGuide, NO_MATCH } from '../src/copilot/guideTransport.js'
import { buildRequest, createAssistant } from '../src/copilot/assistant.js'
import { guideTransport } from '../src/copilot/guideTransport.js'
import { FIELD_GUIDE, TOPICS } from '../src/copilot/fieldGuide.js'
import { FIELDS_BY_ID } from '../src/copilot/formDefinition.js'
import { SOURCES } from '../src/copilot/config.js'

const ask = (message, activeFieldId = null, extra = {}) => answerFromGuide(buildRequest({ message, activeFieldId, ...extra }))

test('the ? button explains the question the applicant is on', () => {
  const r = ask('Explain this question', 'total_budget', { intent: 'explain_field' })
  assert.match(r.text, /full cost of the whole project/)
  assert.deepEqual(r.sources.map((s) => s.id), ['intake_form_v59'])
})

test('a vague question uses the current question', () => {
  assert.match(ask('what does this mean?', 'housing_units').text, /Area Median Income/)
})

test('keywords find the right entry even from another question', () => {
  assert.match(ask('What is the difference between gross and net square footage?', 'first_name').text, /Gross square footage is/)
  assert.match(ask('What does AMI mean?').text, /Area Median Income/)
  assert.match(ask('Which documents do I need?').text, /Required: a project plan/)
})

test('questions in other languages still match the main topics', () => {
  assert.match(ask('¿Qué incluye el "presupuesto total"?').text, /full cost/)
  assert.match(ask('ما المستندات التي أحتاجها؟').text, /Required: a project plan/)
  assert.match(ask('毛面积和净面积有什么区别？').text, /Gross square footage/)
  assert.equal(ask('¿Qué significa AMI?', null, { locale: 'es-US' }).english_only, true)
})

test('eligibility, rates and fees always go to staff, never a guess', () => {
  for (const q of ['Will I be approved?', 'What is the interest rate?', 'Are there fees?', 'Do I qualify?', '¿Me aprobarán?']) {
    const r = ask(q, 'loan_amount')
    assert.match(r.text, /only the Invest Detroit team can answer/, q)
    assert.equal(r.needs_staff, true)
  }
})

test('no good match says so and points to staff', () => {
  const r = ask('Can I bring my dog to the closing meeting next Thursday afternoon?')
  assert.equal(r.text, NO_MATCH)
  assert.equal(r.kind, 'no_answer')
  assert.equal(r.needs_staff, true)
})

test('guide entries point at real fields and known sources', () => {
  for (const [fieldId, entry] of Object.entries(FIELD_GUIDE)) {
    assert.ok(FIELDS_BY_ID[fieldId], `unknown field ${fieldId}`)
    assert.ok(entry.explain, fieldId)
    for (const id of entry.source_ids || []) assert.ok(SOURCES[id], `${fieldId}: unknown source ${id}`)
  }
  for (const t of TOPICS) for (const id of t.source_ids || []) assert.ok(SOURCES[id], `${t.id}: unknown source ${id}`)
})

test('the guide never states rates, fees or approval odds', () => {
  const all = JSON.stringify([FIELD_GUIDE, TOPICS])
  assert.ok(!/\d+(\.\d+)?\s?% (interest|apr)|\$\d[\d,]* fee|guaranteed approval/i.test(all))
})

test('SSNs are still blocked before the guide sees them', async () => {
  const { reply } = await createAssistant({ transport: guideTransport }).ask({ message: 'ssn 123-45-6789' })
  assert.equal(reply.kind, 'privacy_warning')
})

test('an unrelated question is not answered with the current question', () => {
  assert.equal(ask('Can my cat sign the form?', 'total_budget').text, NO_MATCH)
})
