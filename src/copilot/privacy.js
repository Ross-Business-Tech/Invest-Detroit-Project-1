// Detects and hides sensitive numbers before text is shown, logged or sent to an AI service.
// Rule from the brief: never send SSNs or bank details to general-purpose chat or analytics.

const PATTERNS = [
  { kind: 'ssn', re: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, mask: '•••-••-••••' },
  // Long digit runs (bank account or card numbers). Checked after SSN so SSNs get their own label.
  { kind: 'account_number', re: /\b\d{10,17}\b/g, mask: '••••••••' },
]

/** @returns {{ text: string, found: string[] }} text with sensitive numbers masked, and what kinds were found */
export function redactSensitive(text) {
  let out = String(text ?? '')
  const found = []
  for (const { kind, re, mask } of PATTERNS) {
    if (out.search(re) !== -1) {
      found.push(kind)
      out = out.replace(re, mask)
    }
  }
  return { text: out, found }
}

export const containsSensitive = (text) => redactSensitive(text).found.length > 0
