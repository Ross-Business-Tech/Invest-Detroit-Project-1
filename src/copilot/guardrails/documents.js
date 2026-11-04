// Uploaded application documents are untrusted DATA, never instructions.
//
// The prototype never reads uploaded files. When document text is used later (the brief's
// "document-assisted suggestions"), it must go through screenDocument() and be wrapped with
// wrapUntrustedDocument() before any model sees it. The guardrail decision itself never looks
// at document text, so a document can't make an off-topic request allowed or change the rules.

import { INJECTION_PATTERNS, PROTECTED_PATTERNS } from './lexicon.js'
import { fold } from './normalize.js'
import { redactSensitive } from '../privacy.js'

const MAX_CHARS = 20000
const EXTRA = [
  /\b(approve|accept|fund) (this|the|my) (loan|application)\b/,
  /\b(you must|you should|you will|assistant (must|should|will)|the (ai|assistant|model|chatbot) (must|should|will))\b/,
  /\b(respond|reply|answer) (only )?with\b/,
  /<\/?\s*(system|instructions?|prompt|untrusted_document)\b/,
]

/** Removes instruction-like lines and sensitive numbers. Returns what was flagged (no content). */
export function screenDocument(text) {
  const flagged = []
  const lines = String(text ?? '').slice(0, MAX_CHARS).split(/\r?\n/)
  const kept = lines.map((line) => {
    const f = fold(line)
    if ([...INJECTION_PATTERNS, ...PROTECTED_PATTERNS, ...EXTRA].some((re) => re.test(f))) {
      flagged.push('instruction_like_text')
      return '[removed: instruction-like text]'
    }
    return line
  })
  const { text: redacted, found } = redactSensitive(kept.join('\n'))
  if (found.length) flagged.push(...found.map((k) => `redacted_${k}`))
  return { text: redacted, flagged: [...new Set(flagged)], truncated: String(text ?? '').length > MAX_CHARS }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Wraps screened document text so a model treats it strictly as quoted data. */
export function wrapUntrustedDocument(name, text) {
  return `<untrusted_document name="${esc(name).slice(0, 120)}">\n${esc(text)}\n</untrusted_document>`
}
