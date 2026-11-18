// Notes shown under a question once the applicant leaves it: format problems, numbers that
// don't fit together, and a ZIP code that doesn't match the state. Shared by the demo form
// (src/prototype/IntakeForm.jsx) and the add-on for the live FormAssembly form.

import { validate } from './formDefinition.js'
import { runReview } from './review.js'
import { stateForZip, ZIP_STATE, ZIP_TEXT } from './formHelpers.js'

const filled = (v) => !(v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0))

/**
 * Checks for one-by-one feedback as the applicant leaves each question: format problems and
 * numbers that don't fit together, for questions they have already visited. Blank required
 * answers and documents wait for the final review, so nobody is scolded for skipping ahead.
 */
export function liveNotesFor(values, touched) {
  const notes = {}
  const fmt = validate(values)
  for (const id of touched) if (fmt[id] && filled(values[id])) notes[id] = { level: 'blocker', text: fmt[id] }
  for (const i of runReview(values)) {
    if (!touched.has(i.field_id) || notes[i.field_id] || i.level === 'info') continue
    if (/^(missing_|format_|file_)/.test(i.id)) continue
    notes[i.field_id] = { level: i.blocking ? 'blocker' : 'warning', text: i.inline_message || i.title_template, params: i.params }
  }
  for (const [zipId, stateId] of Object.entries(ZIP_STATE)) {
    const st = stateForZip(values[zipId])
    if (touched.has(zipId) && !notes[zipId] && st && values[stateId] && values[stateId] !== st) notes[zipId] = { level: 'warning', text: ZIP_TEXT }
  }
  return notes
}

