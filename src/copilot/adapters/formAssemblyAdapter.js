// Form adapter for Invest Detroit's live FormAssembly form.
//
// Every form adapter (this one, or the prototype's) offers the same small interface, so the
// review session and chat window don't care which form they're attached to:
//
//   getSnapshot()                -> answers keyed by OUR field ids (see formDefinition.js)
//   subscribe(cb)                -> calls cb() whenever an answer changes; returns unsubscribe
//   onActiveFieldChange(cb)      -> calls cb(fieldId) when the applicant moves to a question
//   focusField(fieldId)          -> scrolls to and focuses that question ("Go to field")
//   setSubmitEnabled(enabled)    -> locks or unlocks the form's own Submit button
//
// Extras for the add-on's per-question help (live FormAssembly pages only):
//   elementsFor(fieldId)         -> { container: #tfa_N-D, label: #tfa_N-L } where present
//   onFieldLeave(cb)             -> calls cb(fieldId) when the applicant leaves a question
//   setValue(fieldId, value)     -> fills in a text answer (used ONLY by the opt-in fill helpers,
//                                   such as "same as home address"; off unless turned on)
//   restore(values)              -> puts saved answers back (ONLY the opt-in save & resume)
//
// It reads the page and never submits it. It never reads fields that aren't mapped (the live
// form's SSN field is deliberately unmapped), and it never reads a file's contents: only its
// name, size and type, for the file checks.

import { FORM_ASSEMBLY_MAP, FORM_ASSEMBLY_SUBMIT_ID } from './formAssemblyMap.js'
import { FIELDS_BY_ID } from '../formDefinition.js'

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()

/** Option code (tfa_373) -> our option ("Yes"), using the field's options in formDefinition.js. */
function optionLookup(fieldId, codes) {
  const options = FIELDS_BY_ID[fieldId]?.options || []
  return codes ? Object.fromEntries(codes.map((code, i) => [code, options[i]])) : null
}

// With a code list, answers come from hidden option values so translated pages still read
// "Yes". Without one, fall back to the visible text.
function readField(root, { kind, id }, lookup) {
  const choice = (value, text) => (lookup && lookup[value]) || clean(text)
  if (kind === 'radio') {
    const checked = root.querySelector(`input[type="radio"][name="${id}"]:checked`)
    if (!checked) return undefined
    return choice(checked.value, root.querySelector(`label[for="${checked.id}"]`)?.textContent || checked.value)
  }
  const el = root.querySelector(`#${id}`)
  if (!el) return undefined
  switch (kind) {
    case 'select':
      return el.value ? choice(el.value, el.selectedOptions[0]?.textContent) : ''
    case 'multi':
      return [...el.selectedOptions].filter((o) => o.value).map((o) => choice(o.value, o.textContent))
    case 'file':
      return el.files?.[0]?.name || ''
    case 'checkbox':
      return !!el.checked
    default:
      return el.value
  }
}

/** Element to focus for a mapped field (first radio for a radio group). */
function elementFor(root, { kind, id }) {
  return kind === 'radio' ? root.querySelector(`input[type="radio"][name="${id}"]`) : root.querySelector(`#${id}`)
}

/**
 * @param {object} [opts]
 * @param {ParentNode} [opts.root]   the form element, or document
 * @param {Record<string, {kind: string, id: string}>} [opts.map]
 * @param {string} [opts.submitId]
 */
export function createFormAssemblyAdapter({ root = document, map = FORM_ASSEMBLY_MAP, submitId = FORM_ASSEMBLY_SUBMIT_ID } = {}) {
  // Reverse lookup: page element id / radio name -> our field id
  const byElement = {}
  for (const [fieldId, entry] of Object.entries(map)) byElement[entry.id] = fieldId
  const fieldIdOf = (el) => byElement[el?.id] || byElement[el?.name] || byElement[el?.name?.replace(/\[\]$/, '')] || null
  const lookups = Object.fromEntries(Object.entries(map).map(([fieldId, e]) => [fieldId, optionLookup(fieldId, e.codes)]))

  return {
    getSnapshot() {
      const values = {}
      for (const [fieldId, entry] of Object.entries(map)) {
        const v = readField(root, entry, lookups[fieldId])
        if (v !== undefined) values[fieldId] = v
        if (entry.kind === 'file') {
          const f = root.querySelector(`#${entry.id}`)?.files?.[0]
          if (f) (values._files ||= {})[fieldId] = { name: f.name, size: f.size, type: f.type }
        }
      }
      return values
    },

    subscribe(cb) {
      const handler = (e) => { if (fieldIdOf(e.target)) cb() }
      root.addEventListener('input', handler)
      root.addEventListener('change', handler)
      return () => {
        root.removeEventListener('input', handler)
        root.removeEventListener('change', handler)
      }
    },

    onActiveFieldChange(cb) {
      const handler = (e) => { const id = fieldIdOf(e.target); if (id) cb(id) }
      root.addEventListener('focusin', handler)
      return () => root.removeEventListener('focusin', handler)
    },

    focusField(fieldId) {
      const entry = map[fieldId]
      const el = entry && elementFor(root, entry)
      if (!el) return false
      el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      el.focus?.({ preventScroll: true })
      return true
    },

    elementsFor(fieldId) {
      const entry = map[fieldId]
      if (!entry) return {}
      const byId = (suffix) => (root.getElementById ? root.getElementById(`${entry.id}${suffix}`) : root.querySelector(`#${entry.id}${suffix}`))
      return { container: byId('-D'), label: byId('-L') }
    },

    onFieldLeave(cb) {
      const handler = (e) => { const id = fieldIdOf(e.target); if (id) cb(id) }
      root.addEventListener('focusout', handler)
      return () => root.removeEventListener('focusout', handler)
    },

    setValue(fieldId, value) {
      const entry = map[fieldId]
      const el = entry?.kind === 'text' && root.querySelector(`#${entry.id}`)
      if (!el || el.value === value) return false
      el.value = value
      // Let FormAssembly's own scripts (validation, conditional questions) see the change.
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    },

    /**
     * Puts saved answers back (opt-in save & resume only). Takes answers keyed by our field ids,
     * as getSnapshot() returns them; choices are matched by option, so translated pages work.
     * Files and unmapped fields (the SSN) are never touched. Returns how many were restored.
     */
    restore(values = {}) {
      let n = 0
      const fire = (el) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) }
      for (const [fieldId, value] of Object.entries(values)) {
        const entry = map[fieldId]
        if (!entry || entry.kind === 'file' || value === undefined || value === null) continue
        const codeOf = (v) => { const l = lookups[fieldId]; return l ? Object.keys(l).find((c) => l[c] === v) : null }
        if (entry.kind === 'radio') {
          const code = codeOf(value)
          const el = code ? root.querySelector(`input[type="radio"][name="${entry.id}"][value="${code}"]`) : null
          if (el && !el.checked) { el.checked = true; fire(el); n++ }
          continue
        }
        const el = root.querySelector(`#${entry.id}`)
        if (!el) continue
        if (entry.kind === 'checkbox') { if (el.checked !== !!value) { el.checked = !!value; fire(el); n++ } continue }
        if (entry.kind === 'select') {
          const code = codeOf(value) || [...el.options].find((o) => o.textContent.trim() === value)?.value
          if (code && el.value !== code) { el.value = code; fire(el); n++ }
          continue
        }
        if (entry.kind === 'multi') {
          const codes = new Set((Array.isArray(value) ? value : []).map((v) => codeOf(v)).filter(Boolean))
          for (const o of el.options) o.selected = codes.has(o.value)
          fire(el); n++
          continue
        }
        if (typeof value === 'string' && el.value !== value) { el.value = value; fire(el); n++ }
      }
      return n
    },

    setSubmitEnabled(enabled) {
      const btn = root.querySelector(`#${submitId}`)
      if (btn) btn.disabled = !enabled
    },
  }
}
