// Save & resume for the prototype: a draft of the answers kept in this browser only (never sent
// anywhere), so closing the page doesn't lose work. The real form can use FormAssembly's own
// "Save & Resume" feature instead.
//
// Never saved: the SSN box (disabled anyway), uploaded files (browsers can't keep them; the
// applicant re-attaches them), and file details. Drafts expire after 7 days and are deleted on
// Submit, on "Clear form", and when the applicant chooses "Start over".

const KEY = 'id-copilot-draft-v1'
const OFF = 'id-copilot-draft-off'
const MAX_AGE = 7 * 864e5
const SKIP = new Set(['ssn', '_files'])

const storage = () => { try { return globalThis.localStorage || null } catch { return null } }

/** Answers safe to keep on the device: no SSN, no files. */
export function draftableValues(values, isFileField = () => false) {
  return Object.fromEntries(Object.entries(values || {}).filter(([k, v]) => !SKIP.has(k) && !isFileField(k) && v !== '' && v !== undefined && v !== null))
}

export function saveDraft(values, { isFileField, extra = {}, now = Date.now() } = {}) {
  const s = storage()
  if (!s || draftsOff()) return false
  const data = draftableValues(values, isFileField)
  if (!Object.keys(data).length) { clearDraft(); return false }
  try { s.setItem(KEY, JSON.stringify({ savedAt: now, values: data, ...extra })); return true } catch { return false }
}

export function loadDraft({ now = Date.now() } = {}) {
  const s = storage()
  if (!s) return null
  try {
    const d = JSON.parse(s.getItem(KEY) || 'null')
    if (!d || typeof d.values !== 'object' || now - d.savedAt > MAX_AGE) { clearDraft(); return null }
    return d
  } catch { clearDraft(); return null }
}

export function clearDraft() {
  try { storage()?.removeItem(KEY) } catch { /* storage blocked: nothing to clear */ }
}

/** The applicant can turn saving off on a shared computer. */
export function draftsOff() {
  try { return storage()?.getItem(OFF) === '1' } catch { return true }
}
export function setDraftsOff(off) {
  try {
    if (off) { storage()?.setItem(OFF, '1'); clearDraft() } else storage()?.removeItem(OFF)
  } catch { /* storage blocked */ }
}
