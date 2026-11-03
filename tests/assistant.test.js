import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRequest, createAssistant, httpTransport, placeholderTransport } from '../src/copilot/assistant.js'

test('request carries field metadata and the question, not other answers', () => {
  const req = buildRequest({ message: 'What counts here?', activeFieldId: 'total_budget' })
  assert.equal(req.program, 'real_estate_ci')
  assert.equal(req.field.field_id, 'total_budget')
  assert.equal(req.field.field_label, 'What is your total budget?')
  assert.equal(req.field.required, true)
  assert.equal(req.message, 'What counts here?')
  assert.deepEqual(Object.keys(req).sort(), ['field', 'form_id', 'form_version', 'history', 'locale', 'message', 'program'])
})

test('history is limited to a short window and redacted', () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: 'user', text: `q${i}` }))
  history[9] = { role: 'user', text: 'old ssn 123-45-6789' }
  const req = buildRequest({ message: 'hi', history, historyWindow: 3 })
  assert.equal(req.history.length, 3)
  assert.ok(!JSON.stringify(req).includes('123-45-6789'))
})

test('a message containing an SSN is never sent', async () => {
  let sent = 0
  const assistant = createAssistant({ transport: { send: async () => { sent++; return {} } } })
  const { shownMessage, reply } = await assistant.ask({ message: 'my ssn is 123-45-6789' })
  assert.equal(sent, 0)
  assert.equal(reply.kind, 'privacy_warning')
  assert.ok(!shownMessage.includes('6789'))
})

test('placeholder transport answers without a network', async () => {
  const { reply } = await createAssistant({ transport: placeholderTransport }).ask({ message: 'What does AMI mean?' })
  assert.equal(reply.kind, 'placeholder')
})

test('http transport keeps only known sources', async () => {
  const fakeFetch = async (url, init) => {
    assert.equal(url, '/assistant')
    assert.equal(JSON.parse(init.body).message, 'What does AMI mean?')
    return { ok: true, json: async () => ({ text: 'AMI means Area Median Income.', source_ids: ['intake_form_v59', 'made_up_link'] }) }
  }
  const { reply } = await createAssistant({ transport: httpTransport('/assistant', fakeFetch) }).ask({ message: 'What does AMI mean?' })
  assert.equal(reply.kind, 'answer')
  assert.deepEqual(reply.sources.map((s) => s.id), ['intake_form_v59'])
})

test('a failed request becomes a friendly error that offers staff help', async () => {
  const failing = httpTransport('/assistant', async () => ({ ok: false, status: 502 }))
  const { reply } = await createAssistant({ transport: failing }).ask({ message: 'hello' })
  assert.equal(reply.kind, 'error')
  assert.equal(reply.needs_staff, true)
})
