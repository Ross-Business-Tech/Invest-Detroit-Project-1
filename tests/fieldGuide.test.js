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
  assert.deepEqual(r.sources.map((s) => s.id), ['intake_form_v59', 're_flyer', 'lending_guide', 'occ_cre'])
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

test('approval and qualification questions always go to staff, never a guess', () => {
  for (const q of ['Will I be approved?', 'Do I qualify?', '¿Me aprobarán?', 'What are my chances?', 'What rate will I get?', 'Am I eligible?']) {
    const r = ask(q, 'loan_amount')
    assert.match(r.text, /Only the Invest Detroit team decides that/, q)
    assert.equal(r.needs_staff, true, q)
  }
})

test('published rates and fees are quoted with their source and "subject to change"', () => {
  for (const q of ['What is the interest rate?', 'Are there fees?', 'What closing costs should I expect?', '¿Cuál es la tasa de interés?', '利率是多少？']) {
    const r = ask(q, 'loan_amount')
    assert.match(r.text, /8%–9\.5%/, q)
    assert.match(r.text, /1%–3%/, q)
    assert.match(r.text, /subject to change/, q)
    assert.ok(r.sources.some((s) => s.id === 're_flyer'), q)
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

test('rates, fees and loan sizes appear only in entries that cite an official source and say "subject to change"', () => {
  const entries = [...Object.entries(FIELD_GUIDE), ...TOPICS.map((t) => [t.id, t])]
  const TERMS = /\d+(\.\d+)?%\s?[–-]\s?\d+(\.\d+)?%|\$\d[\d,]*\s?(to|–|-)\s?\$\d|\$\d[\d,]* (fee|assessment)/i
  for (const [id, e] of entries) {
    if (!TERMS.test(e.explain)) continue
    assert.match(e.explain, /subject to change/, id)
    assert.ok((e.source_ids || []).some((s) => SOURCES[s]?.category === 'official_policy' && SOURCES[s].provider === 'Invest Detroit'), id)
  }
  assert.ok(!/guaranteed approval|(?<!whether )you will be approved|(?<!whether )you qualify/i.test(JSON.stringify([FIELD_GUIDE, TOPICS])))
})

test('the four Invest Detroit documents keep priority over web research', () => {
  // Rates, timeline, address and impact figures come from the documents, not older web sheets.
  const all = JSON.stringify([FIELD_GUIDE, TOPICS])
  assert.ok(!/6%–8%|7%–8%|600 Renaissance|\$661 million|6–12 weeks/.test(all))
  assert.match(ask('How long does the lending process take?').text, /Screening \(1–2 weeks\)/)
  assert.match(ask('Who is Invest Detroit?').text, /501\(c\)\(3\).*\$593 million/s)
})

test('Small Business numbers are always labeled as a different program', () => {
  for (const t of TOPICS) {
    if (!/8%–10%|\$50,000|\$250/.test(t.explain)) continue
    assert.ok(t.source_ids.includes('sb_flyer'), t.id)
    assert.match(t.explain, /do not apply to this form/, t.id)
  }
})

// Golden questions from Invest Detroit's documents: each must reach the right entry.
const GOLDEN = [
  ['How long does the lending process take?', /four stages/],
  ['What happens after I submit?', /Screening \(1–2 weeks\)/],
  ['How can I speed up my loan?', /fastest closings/],
  ['What is underwriting?', /management capacity/],
  ['Will there be a site visit?', /visit the site/],
  ['What is a term sheet?', /commitment letter/],
  ['What happens after my loan is approved?', /commitment letter is issued/],
  ['What due diligence will you need?', /title commitment, survey, appraisal/],
  ['Can I start construction before closing?', /Don't start construction before the loan closes/],
  ['How are loan funds disbursed for construction?', /draws/],
  ['What happens after closing?', /financial reporting/],
  ['How much can I borrow?', /\$150,000 to \$2,500,000/],
  ['How many years is the loan term?', /6 months to 7 years/],
  ['What collateral do you need?', /senior or subordinate mortgage/],
  ['I am a new developer. Who can apply?', /New developers and startups can be eligible/],
  ['I need a loan for equipment for my bakery. Is this the right form?', /Small Business program may fit better/],
  ['Who is Invest Detroit?', /Community Development Financial Institution/],
  ['Who should I contact with questions?', /Business Development Officer/],
  ['What is the Strategic Neighborhood Fund?', /March 29, 2016/],
  ['What is DSCR?', /net operating income \(NOI\) divided by/],
  ['What does loan-to-value mean?', /LTV/],
  ['What are soft costs?', /Soft costs are/],
  ['How big should my contingency be?', /5% to 10%/],
  ['What is a pro forma?', /SBA suggests five years/],
  ['What is a title commitment?', /title insurance company/],
  ['Do I need a Phase I environmental report?', /All Appropriate Inquiries/],
  ['What does fully amortizing mean?', /balloon/],
  ['How do I get a certificate of good standing?', /michigan\.gov\/fileonline/],
  ['How do I get a building permit in Detroit?', /BSEED/],
  ['How do I file a discrimination complaint?', /crcomplaints@treasury\.gov/],
  ['Is the Property Owner Fund open?', /is closed/],
  ['What other documents will you ask for in the formal application?', /2020 small business checklist/],
  ['My ZIP code says Detroit. Is that inside Detroit city limits?', /Parcel Viewer/],
  ['What are the AMI income limits for Detroit?', /\$104,800/],
  ['Can you help with permitting?', /technical assistance/],
  ['Does Invest Detroit do equipment financing for industrial businesses?', /Commercial and Industrial page/],
  ['What happens after I submit the form?', /discussion with a team member/],
]
test('golden questions from Invest Detroit documents reach the right answer', () => {
  for (const [q, want] of GOLDEN) assert.match(ask(q).text, want, q)
})

test('every source a reply cites has a title, and links only when a url exists', () => {
  const r = ask('How long does the lending process take?')
  assert.deepEqual(r.sources[0], { id: 'lending_guide', title: SOURCES.lending_guide.title, url: null })
  assert.ok(r.sources.slice(1).every((s) => s.url && s.title))
})

test('new help tips exist for the remaining document and yes/no questions', () => {
  for (const id of ['doc_tax_returns', 'doc_bank_statements', 'previous_client', 're_team_contact']) assert.ok(FIELD_GUIDE[id], id)
})

test('SSNs are still blocked before the guide sees them', async () => {
  const { reply } = await createAssistant({ transport: guideTransport }).ask({ message: 'ssn 123-45-6789' })
  assert.equal(reply.kind, 'privacy_warning')
})

test('an unrelated question is not answered with the current question', () => {
  assert.equal(ask('Can my cat sign the form?', 'total_budget').text, NO_MATCH)
})
