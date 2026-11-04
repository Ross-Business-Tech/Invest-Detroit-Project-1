// Collects every English string the app can show, for tests/i18n.test.js.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SECTIONS, FORM_INTRO, COUNT_HINT } from '../src/copilot/formDefinition.js'
import { REVIEW_TEXT, REVIEW_CHECKS, REVIEW_GROUPS } from '../src/copilot/review.js'
import { PRIVACY_WARNING, CANNED_REPLIES } from '../src/copilot/assistant.js'
import { SUGGESTIONS, WELCOME_TEXT, DEFAULT_SUBTITLE, CONNECTED_SUBTITLE } from '../src/components/chatText.js'
import { NO_MATCH } from '../src/copilot/guideTransport.js'
import { NUMBERS } from '../src/prototype/beforeYouStartText.js'

// Organization names stay in their original form in every language.
const PROPER_NOUN_LISTS = new Set(['other_lenders', 'community_partners'])

export const VALIDATION_MESSAGES = [
  'This field is required.', 'Please enter a valid email address.', 'Please enter a valid state abbreviation.',
  'Please enter a 5 digit zip code.', 'Please enter a number.', 'Please enter a whole number.',
]

export function formStrings() {
  const out = new Set([...FORM_INTRO, COUNT_HINT, ...VALIDATION_MESSAGES])
  for (const s of SECTIONS) {
    out.add(s.title)
    if (s.intro) out.add(s.intro)
    for (const f of s.fields) {
      for (const k of ['label', 'text', 'disabledNote', 'prototypeNote']) if (f[k]) out.add(f[k])
      if (f.hint && !f.hintTemplate) out.add(f.hint)
      if (f.hintParams) Object.values(f.hintParams).forEach((v) => out.add(v))
      if (f.hintLink) ['before', 'text', 'after'].forEach((k) => f.hintLink[k].trim() && out.add(f.hintLink[k]))
      for (const o of f.options || []) {
        if (!PROPER_NOUN_LISTS.has(f.id) || o === 'None' || o === 'Other (Please specify)') out.add(o)
      }
    }
  }
  return out
}

export function reviewStrings() {
  const out = new Set([...REVIEW_CHECKS.map((c) => c.label), ...REVIEW_GROUPS.map((g) => g.title)])
  for (const [key, v] of Object.entries(REVIEW_TEXT)) {
    if (key === 'kinds' || key === 'groups') v.forEach((k) => out.add(k))
    else if (key !== 'fieldOnly' && key !== 'fieldProblem') out.add(v)
  }
  return out
}

export function assistantStrings() {
  return new Set([...NUMBERS, PRIVACY_WARNING, NO_MATCH, ...Object.values(CANNED_REPLIES), ...SUGGESTIONS, WELCOME_TEXT, DEFAULT_SUBTITLE, CONNECTED_SUBTITLE])
}

/** Static strings passed to t('…') in the screen code. */
export function screenStrings() {
  const files = []
  const walk = (dir) => readdirSync(dir).forEach((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.jsx?$/.test(n)) files.push(p)
  })
  // Screen code only: src/copilot has its own text lists (and a t() helper for field ids).
  for (const dir of ['components', 'prototype', 'embed']) walk(new URL(`../src/${dir}`, import.meta.url).pathname)
  files.push(new URL('../src/App.jsx', import.meta.url).pathname)
  const out = new Set()
  const re = /\bt\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(re)) {
      if (m[1] === '`' && m[2].includes('${')) continue
      out.add(m[2].replace(/\\(['"`\\])/g, '$1'))
    }
  }
  return out
}
