// Translations for everything the copilot shows: form questions, review messages, chat, page.
//
// Dictionaries are keyed by the English text, so English needs no dictionary and anything
// missing falls back to English instead of breaking. Answers and review rules always use the
// English option values underneath, so switching language never changes what is checked.
//
// The Spanish, Arabic and Bengali text was drafted with AI and has NOT been reviewed by a
// qualified translator. The brief asks for translations of high-impact terms to be validated
// before real use (Invest Detroit Language Assistance Plan, 2024).
// tests/i18n.test.js fails if any text on the page is missing from a dictionary.

import es from './es.js'
import ar from './ar.js'
import bn from './bn.js'
import { fill } from '../text.js'

// Same languages as the translation menu on investdetroit.com.
export const LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr', bcp47: 'en-US' },
  { code: 'es', name: 'Español', dir: 'ltr', bcp47: 'es-US' },
  { code: 'ar', name: 'العربية', dir: 'rtl', bcp47: 'ar' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr', bcp47: 'bn' },
]

export const DICTIONARIES = { es, ar, bn }

export const localeInfo = (code) => LOCALES.find((l) => l.code === code) || LOCALES[0]

/** Pick a supported locale from a page's lang attribute, e.g. "es-MX" -> "es". */
export function localeFromLang(lang) {
  const base = String(lang || '').toLowerCase().split('-')[0]
  return LOCALES.some((l) => l.code === base) ? base : 'en'
}

export function translate(locale, text) {
  if (text === null || text === undefined || locale === 'en') return text
  return DICTIONARIES[locale]?.[text] ?? text
}

/**
 * Returns t(text, params?). With params, the template and each value are translated, then
 * the values are filled in: t('{section} section is empty', { section: 'Retail Project' }).
 */
export function makeT(locale) {
  return (text, params) => {
    if (!params) return translate(locale, text)
    const translated = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, translate(locale, String(v))]))
    return fill(translate(locale, text), translated)
  }
}
