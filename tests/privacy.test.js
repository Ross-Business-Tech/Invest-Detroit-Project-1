import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redactSensitive, containsSensitive } from '../src/copilot/privacy.js'

test('masks SSNs in common formats', () => {
  for (const ssn of ['123-45-6789', '123 45 6789', '123456789']) {
    const { text, found } = redactSensitive(`my ssn is ${ssn}`)
    assert.ok(!text.includes(ssn.replace(/\D/g, '').slice(0, 5)), text)
    assert.deepEqual(found, ['ssn'])
  }
})

test('masks long account numbers', () => {
  const { text, found } = redactSensitive('account 000123456789012')
  assert.ok(!text.includes('000123456789012'))
  assert.deepEqual(found, ['account_number'])
})

test('leaves ordinary numbers alone', () => {
  for (const s of ['My budget is $1,450,000', 'zip 48201', 'We will build 6 units']) {
    assert.equal(containsSensitive(s), false, s)
    assert.equal(redactSensitive(s).text, s)
  }
})
