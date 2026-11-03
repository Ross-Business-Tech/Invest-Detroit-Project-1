import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES, makeT, localeFromLang } from '../src/copilot/i18n/index.js'
import { formStrings, reviewStrings, assistantStrings, screenStrings } from './i18nCatalog.js'
import { runReview } from '../src/copilot/review.js'

const ALL = new Set([...formStrings(), ...reviewStrings(), ...assistantStrings(), ...screenStrings()])
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort()

for (const [locale, dict] of Object.entries(DICTIONARIES)) {
  test(`${locale}: every piece of text on the page is translated`, () => {
    const missing = [...ALL].filter((s) => !dict[s])
    assert.deepEqual(missing, [], `${missing.length} missing`)
  })

  test(`${locale}: translations keep the same {placeholders}`, () => {
    const broken = Object.entries(dict).filter(([en, tr]) => placeholders(en).join() !== placeholders(tr).join())
    assert.deepEqual(broken, [])
  })

  test(`${locale}: review messages read fully in the language`, () => {
    const t = makeT(locale)
    const issue = runReview({ total_budget: '100', loan_amount: '500', real_estate_type: 'Retail' }).find((i) => i.id === 'empty_retail')
    const title = t(issue.title_template, issue.params)
    assert.ok(!title.includes('{'), title)
    assert.notEqual(title, issue.title)
  })
}

test('page language codes map to our languages', () => {
  assert.equal(localeFromLang('es-MX'), 'es')
  assert.equal(localeFromLang('ar'), 'ar')
  assert.equal(localeFromLang('fr'), 'en')
  assert.equal(localeFromLang(''), 'en')
})

test('English needs no dictionary and fills templates', () => {
  const t = makeT('en')
  assert.equal(t('{section} section is empty', { section: 'Retail Project' }), 'Retail Project section is empty')
})
