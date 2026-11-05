/** Prototype equivalent of adapter.focusField(): our element ids are the field ids. */
export function goToField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusable = el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea')
  focusable?.focus({ preventScroll: true })
}
