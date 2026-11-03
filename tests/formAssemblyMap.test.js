import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FORM_ASSEMBLY_MAP } from '../src/copilot/adapters/formAssemblyMap.js'
import { INPUT_FIELD_IDS, FIELDS_BY_ID } from '../src/copilot/formDefinition.js'

test('every answerable field is mapped to the live form', () => {
  const missing = INPUT_FIELD_IDS.filter((id) => !FORM_ASSEMBLY_MAP[id])
  assert.deepEqual(missing, [])
})

test('the map only contains fields we define', () => {
  const unknown = Object.keys(FORM_ASSEMBLY_MAP).filter((id) => !FIELDS_BY_ID[id])
  assert.deepEqual(unknown, [])
})

test('the live SSN field is never mapped', () => {
  assert.equal(FORM_ASSEMBLY_MAP.ssn, undefined)
  assert.ok(!Object.values(FORM_ASSEMBLY_MAP).some((e) => e.id === 'tfa_541'))
})

test('each live element is mapped once', () => {
  const seen = Object.values(FORM_ASSEMBLY_MAP).map((e) => e.id)
  assert.equal(new Set(seen).size, seen.length)
})
