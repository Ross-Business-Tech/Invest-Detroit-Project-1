// Normalizes untrusted text before checks, so simple tricks (odd Unicode, zero-width
// characters, s p a c e d letters, l33t spelling) don't slip past the patterns.

const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿]/g
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' }

/** Lowercase, Unicode-normalized, single-spaced. Numbers are kept as they are. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(ZERO_WIDTH, '')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extra-aggressive form for pattern checks: undo l33t and join s-p-a-c-e-d letters. */
export function fold(text) {
  return normalize(text)
    .replace(/\b(?:[a-z][\s.\-_*]){3,}[a-z]\b/g, (m) => m.replace(/[\s.\-_*]/g, ''))
    .replace(/[a-z0-9@$]+/g, (w) => (/[a-z]/.test(w) && /[013457@$]/.test(w) ? w.replace(/[013457@$]/g, (c) => LEET[c]) : w))
}

export function sentences(text) {
  return String(text).split(/(?<=[.?!;\n])\s+/).map((s) => s.trim()).filter(Boolean)
}
