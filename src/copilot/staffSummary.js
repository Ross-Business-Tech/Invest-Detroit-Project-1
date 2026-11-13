// The short summary that goes with an application to Invest Detroit's screening staff: what the
// review flagged and the applicant's "this is correct because…" notes, so open questions are
// visible at once instead of being found by email.
//
// PRIVACY: built in the applicant's browser at Submit and sent only inside the application to
// Invest Detroit's own form system (a hidden FormAssembly field, see the add-on's
// data-summary-field option). It is never sent to our server or stored by us. It contains no
// SSN and no form answers beyond what the review messages already say.
//
// Written in English for staff, whatever language the applicant used.

const plain = (s) => String(s || '').replace(/\s+/g, ' ').trim()

/**
 * @param {{ issues?: object[], notes?: Record<string,string>, locale?: string, now?: Date }} input
 *   issues: the latest Review My Application result; notes: applicant notes keyed by issue id
 * @returns {string} plain text, at most about 3,000 characters
 */
export function buildStaffSummary({ issues = [], notes = {}, locale = 'en', now = new Date() } = {}) {
  const warnings = issues.filter((i) => i.level === 'warning')
  const tips = issues.filter((i) => i.level === 'info')
  const blockers = issues.filter((i) => i.level === 'blocker')
  const lines = [
    `Application Copilot summary (${now.toISOString().slice(0, 10)})`,
    blockers.length
      ? `Review: ${blockers.length} item(s) still had to be fixed.`
      : `Review passed${warnings.length ? ` with ${warnings.length} item(s) to double-check` : ' with nothing to double-check'}${tips.length ? ` and ${tips.length} tip(s)` : ''}.`,
  ]
  if (locale && !String(locale).startsWith('en')) lines.push(`Applicant used the form in: ${locale}.`)
  if (warnings.length) {
    lines.push('', 'Items to double-check:')
    for (const i of warnings) {
      const note = plain(notes[i.id])
      lines.push(`- ${plain(i.title)}: ${plain(i.message)}`)
      lines.push(note ? `  Applicant's note: "${note.slice(0, 300)}"` : '  No note from the applicant.')
    }
  }
  if (tips.length) {
    lines.push('', 'Tips shown to the applicant:')
    for (const i of tips) lines.push(`- ${plain(i.title)}`)
  }
  return lines.join('\n').slice(0, 3000)
}
