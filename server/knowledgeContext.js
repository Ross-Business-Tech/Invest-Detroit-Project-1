// The knowledge base the AI model answers from: every field-guide entry, topic, knowledge entry and
// glossary term, plus the list of sources it may cite. Built once from the same files the
// browser's built-in answers use, so both always say the same thing.
//
// Sent as part of the (cached) system prompt. It is public material, never applicant data.

import { FIELD_GUIDE, TOPICS } from '../src/copilot/fieldGuide.js'
import { FIELDS_BY_ID } from '../src/copilot/formDefinition.js'
import { SOURCES } from '../src/copilot/config.js'

function entryText(id, entry, about) {
  const lines = [`### ${id}${about ? ` (${about})` : ''}`]
  if (entry.source_ids?.length) lines.push(`Sources: ${entry.source_ids.join(', ')}`)
  if (entry.needs_staff) lines.push('Point the applicant to the Invest Detroit team for anything specific to their case.')
  lines.push(entry.explain)
  if (entry.example) lines.push(`Example: ${entry.example}`)
  if (entry.mistakes?.length) lines.push(`Common mistakes: ${entry.mistakes.join(' ')}`)
  return lines.join('\n')
}

export function buildKnowledgeText() {
  // Several form questions share one entry (for example every square-footage box). List it once.
  const byEntry = new Map()
  for (const [fieldId, entry] of Object.entries(FIELD_GUIDE)) {
    if (!byEntry.has(entry)) byEntry.set(entry, [])
    byEntry.get(entry).push(fieldId)
  }
  const fieldParts = [...byEntry.entries()].map(([entry, ids]) => {
    const labels = ids.map((id) => `"${FIELDS_BY_ID[id]?.label || id}"`).slice(0, 4).join('; ')
    return entryText(`field:${ids[0]}`, entry, `form question: ${labels}${ids.length > 4 ? '; …' : ''}`)
  })
  const topicParts = TOPICS.map((t) => entryText(`topic:${t.id}`, t, t.program && t.program !== 'all' ? `program: ${t.program}` : ''))
  const sourceList = Object.entries(SOURCES).map(([id, s]) => `- ${id}: ${s.title} (${s.provider}${s.category === 'educational' ? ', general education' : ''})`)

  return [
    '# Invest Detroit knowledge base',
    'Answer only from this material. It was written from Invest Detroit\'s own documents (which take priority) and official public sources. If it does not cover the question, say you don\'t have an approved answer and give the contact: info@investdetroit.com or 313.259.6368.',
    '## Sources you may cite (use these ids in source_ids)',
    ...sourceList,
    '## Help for specific form questions',
    ...fieldParts,
    '## Topics, lending process, programs and glossary',
    ...topicParts,
  ].join('\n\n')
}

export const KNOWLEDGE_TEXT = buildKnowledgeText()
export const SOURCE_IDS = Object.keys(SOURCES)
