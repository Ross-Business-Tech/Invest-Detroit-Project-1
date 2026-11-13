// The add-on's screens on Invest Detroit's live FormAssembly form. One React tree draws them all
// into small "hosts" (shadow roots) placed around the form, so they share one state:
//   review   the Review My Application panel, above the form's Submit button
//   chat     the Need help? chat in the corner
//   progress the progress bar at the top of the form
//   fields   per question: a ? button by the label, an upload tip before file inputs, and notes
//            under the question (live checks, "About $1.45 million", the 10% equity math,
//            file checks)
//   same     opt-in "Business address is the same as my home address" box
//   intro    opt-in "How it works" and "Before you start", above the form
//   draft    opt-in save & resume on this device: "Continue where I left off" and the saving line
//   submit   "Submit unlocks after a successful review." under the locked Submit button
//   notice   on translated pages: the screens were translated with AI; English is official
// After a review, each question that must be fixed shows its error under it, and its container
// gets the class idc-invalid (red outline with data-theme) and aria-invalid on the control.
// They reuse the demo site's components, so both behave the same.
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReviewPanel from '../components/ReviewPanel.jsx'
import ChatAssistant from '../components/ChatAssistant.jsx'
import I18nProvider from '../components/I18nProvider.jsx'
import { Notes, UploadTips } from '../components/Field.jsx'
import FormProgress from '../prototype/FormProgress.jsx'
import HowItWorks from '../prototype/HowItWorks.jsx'
import BeforeYouStart from '../prototype/BeforeYouStart.jsx'
import { saveDraft, loadDraft, clearDraft, draftsOff, setDraftsOff } from '../prototype/draft.js'
import { useI18n } from '../components/i18nContext.js'
import { localeFromLang } from '../copilot/i18n/index.js'
import { FIELDS_BY_ID, SECTIONS } from '../copilot/formDefinition.js'
import { FIELD_GUIDE } from '../copilot/fieldGuide.js'
import { liveNotesFor } from '../copilot/liveNotes.js'
import { uploadTips } from '../copilot/uploadTips.js'
import { equityMath, moneyNote, checkFile, stateForZip, ZIP_STATE } from '../copilot/formHelpers.js'
import { track } from '../copilot/events.js'

/** Hides the add-on and reports the error (so it can unlock Submit) if a screen crashes. */
export class FailSafe extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { this.props.onError(error) }
  render() { return this.state.failed ? null : this.props.children }
}

/** Uses the host page's language (<html lang="es">) and follows it if the page changes it. */
export function PageLanguage({ fixed, children }) {
  const read = () => fixed || localeFromLang(document.documentElement.lang)
  const [locale, setLocale] = useState(read)
  useEffect(() => {
    if (fixed) return undefined
    const observer = new MutationObserver(() => setLocale(localeFromLang(document.documentElement.lang)))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [fixed])
  return <I18nProvider locale={locale}>{children}</I18nProvider>
}

const HOME_TO_BUSINESS = { home_address: 'business_address', home_city: 'business_city', home_state: 'business_state', home_zip: 'business_zip' }
const level = (l) => (l === 'blocker' ? 'error' : l === 'info' ? 'calc' : l)

function HelpButton({ onClick }) {
  const { t } = useI18n()
  return (
    <button type="button" className="help-btn" aria-label={t('Explain this question')} title={t('Explain this question')}
      // The button can sit inside the form's <label>: don't let the click also jump to the input.
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}>?</button>
  )
}

const isFileField = (id) => FIELDS_BY_ID[id]?.type === 'file'

/** Save & resume on this device, like the demo form: the offer to continue, and the saving line. */
function DraftBar({ offer, savingOff, onResume, onDiscard, onToggle }) {
  const { t, locale } = useI18n()
  return (
    <>
      {offer && (
        <div className="draft-offer" role="region" aria-label={t('Saved answers')}>
          <p>
            <strong>{t('You have saved answers from {date}.', { date: new Date(offer.savedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}</strong>{' '}
            {t('Files need to be attached again.')}
          </p>
          <div className="draft-actions">
            <button type="button" className="btn small" onClick={onResume}>{t('Continue where I left off')}</button>
            <button type="button" className="btn small outline" onClick={onDiscard}>{t('Start over')}</button>
          </div>
        </div>
      )}
      <p className="draft-status" role="status">
        {savingOff ? t('Answers are not being saved on this device.') : t('Your answers are saved on this device as you type, so you can come back later.')}{' '}
        <button type="button" className="link-btn" onClick={onToggle}>{savingOff ? t('Save on this device') : t('Don’t save on this device')}</button>
      </p>
    </>
  )
}

function SubmitHelp({ locked }) {
  const { t } = useI18n()
  return locked ? <p className="submit-help">{t('Submit unlocks after a successful review.')}</p> : null
}

/** On a translated page: our screens were translated with AI, and the English version is official. */
function TranslationNotice() {
  const { t, locale } = useI18n()
  if (!locale || locale === 'en') return null
  return <p className="translation-note">{t('This page was translated with AI and has not yet been reviewed by a professional translator. If anything is unclear, the English version is the official one.')}</p>
}

function SameAddressBox({ checked, onChange }) {
  const { t } = useI18n()
  return (
    <label className="same-address">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{t('Business address is the same as my home address')}</span>
    </label>
  )
}

/** Notes under one question: a review error or the live check, the money amount in words, the equity math, file checks, a character count. */
function fieldNotes(id, values, live, error) {
  const field = FIELDS_BY_ID[id]
  const notes = []
  if (error) notes.push({ text: error, level: 'error' }) // a review error wins, as on the demo
  else if (live[id]) notes.push({ ...live[id], level: level(live[id].level) })
  if (field?.type === 'money' && !live[id]) notes.push(moneyNote(values[id]))
  if (id === 'equity_10pct') notes.push({ ...equityMath(values), level: 'calc' })
  if (field?.type === 'file' && values._files?.[id]) notes.push(...checkFile(id, values._files[id]).map((c) => ({ ...c, level: level(c.level) })))
  if (field?.type === 'textarea' && field.maxLength) notes.push({ text: `${(values[id] || '').length}/${field.maxLength}`, level: 'calc' })
  return notes.filter((n) => n?.text)
}

/**
 * @param {object} props
 * @param {object} props.adapter   the FormAssembly adapter
 * @param {object} props.session   the review session
 * @param {object} props.assistant the chat assistant client
 * @param {object} props.hosts     where to draw: { review, chat, progress, fields: { [id]: { help, tips, notes } }, same }
 * @param {{ current: Record<string,string> }} props.notesRef  the applicant's "this is correct because…" notes, read at Submit
 */
export function EmbeddedApp({ adapter, session, assistant, hosts, notesRef, feedbackClient = null, waitForReply = false, fillHelpers = false, drafts = false, canSave = false, onStartForm, onError }) {
  const [values, setValues] = useState(() => adapter.getSnapshot())
  const [review, setReview] = useState(session.getState())
  const [touched, setTouched] = useState(() => new Set())
  const [activeFieldId, setActiveFieldId] = useState(null)
  const [helpRequest, setHelpRequest] = useState(null)
  const [reviewNotes, setReviewNotes] = useState({})
  const [same, setSame] = useState(false)
  const started = useRef(false)
  // Review errors shown under each question; one goes away as soon as that answer changes.
  const [reviewErrors, setReviewErrors] = useState({})
  useEffect(() => session.subscribe((st) => {
    if (st.status !== 'done') return
    const snap = adapter.getSnapshot()
    const errs = {}
    for (const i of st.issues) if (i.blocking && !errs[i.field_id]) errs[i.field_id] = { text: i.inline_message || i.title, value: JSON.stringify(snap[i.field_id] ?? '') }
    setReviewErrors(errs)
  }), [session, adapter])
  // Save & resume (opt-in): offer a draft from an earlier visit; save as the applicant types.
  const [draftOffer, setDraftOffer] = useState(() => (drafts ? loadDraft() : null))
  const [savingOff, setSavingOff] = useState(() => draftsOff())
  useEffect(() => {
    if (!drafts || draftOffer || !started.current) return undefined
    const timer = setTimeout(() => saveDraft(values, { isFileField, extra: { sameAddress: same } }), 600)
    return () => clearTimeout(timer)
  }, [values, same, drafts, draftOffer])
  const resumeDraft = () => {
    const offer = draftOffer
    setDraftOffer(null)
    started.current = true // already counted as started on the first visit
    adapter.restore(offer.values)
    if (offer.sameAddress) setSame(true)
    session.invalidate()
  }
  const discardDraft = () => { clearDraft(); setDraftOffer(null) }
  const toggleSaving = () => {
    const off = !savingOff
    setDraftsOff(off)
    setSavingOff(off)
    if (!off) saveDraft(adapter.getSnapshot(), { isFileField, extra: { sameAddress: same } })
  }

  useEffect(() => session.subscribe(setReview), [session])
  useEffect(() => adapter.onActiveFieldChange(setActiveFieldId), [adapter])
  useEffect(() => adapter.subscribe(() => {
    const next = adapter.getSnapshot()
    setValues(next)
    if (!started.current) { started.current = true; track({ type: 'form_started' }) }
  }), [adapter])
  useEffect(() => adapter.onFieldLeave((id) => setTouched((s) => (s.has(id) ? s : new Set(s).add(id)))), [adapter])
  useEffect(() => { notesRef.current = reviewNotes }, [reviewNotes, notesRef])


  // Opt-in fill helpers: copy the home address while the box is ticked; fill the state from a Michigan ZIP.
  useEffect(() => {
    if (!fillHelpers) return
    if (same) for (const [home, biz] of Object.entries(HOME_TO_BUSINESS)) if ((values[home] || '') !== (values[biz] || '')) adapter.setValue(biz, values[home] || '')
    for (const [zip, state] of Object.entries(ZIP_STATE)) if (!values[state] && stateForZip(values[zip])) adapter.setValue(state, stateForZip(values[zip]))
  }, [values, same, fillHelpers, adapter])

  // A chosen file counts as visited at once, so its checks show without leaving the field.
  const live = useMemo(() => liveNotesFor(values, new Set([...touched, ...Object.keys(values._files || {})])), [values, touched])
  const errors = useMemo(() => Object.fromEntries(Object.entries(reviewErrors)
    .filter(([id, e]) => JSON.stringify(values[id] ?? '') === e.value).map(([id, e]) => [id, e.text])), [reviewErrors, values])
  // Mark questions that need fixing on the page itself: aria-invalid always; the red look comes with data-theme.
  useEffect(() => {
    for (const id of Object.keys(hosts.fields || {})) {
      const { container } = adapter.elementsFor(id)
      if (!container) continue
      const bad = !!errors[id] || live[id]?.level === 'blocker'
      container.classList.toggle('idc-invalid', bad)
      container.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((el) => {
        if (bad) el.setAttribute('aria-invalid', 'true'); else if (el.getAttribute('aria-invalid') === 'true') el.removeAttribute('aria-invalid')
      })
    }
  }) // runs after every render: cheap, and keeps the page in step with the notes
  // Business address boxes are locked while "same as home address" is ticked, as on the demo.
  useEffect(() => {
    if (!fillHelpers) return undefined
    const ids = Object.values(HOME_TO_BUSINESS)
    for (const id of ids) { const el = adapter.elementsFor(id).container?.querySelector('input, select'); if (el) el.readOnly = same }
    return () => { for (const id of ids) { const el = adapter.elementsFor(id).container?.querySelector('input, select'); if (el) el.readOnly = false } }
  }, [same, fillHelpers, adapter])

  const askHelp = (fieldId) => {
    track({ type: 'field_help', field_id: fieldId })
    setHelpRequest((r) => ({ fieldId, n: (r?.n || 0) + 1 }))
  }
  const run = () => { try { session.run() } catch (e) { onError(e) } }
  const firstQuestion = (sectionId) => SECTIONS.find((s) => s.id === sectionId)?.fields.find((f) => adapter.elementsFor(f.id).container)?.id
  const portal = (node, host, key) => (host ? createPortal(node, host, key) : null)

  return (
    <>
      {portal(<ReviewPanel state={review} onRun={run} onGoToField={(id) => adapter.focusField(id)} notes={reviewNotes} onNote={(id, text) => setReviewNotes((n) => ({ ...n, [id]: text }))} />, hosts.review, 'review')}
      {portal(<ChatAssistant assistant={assistant} activeFieldId={activeFieldId} helpRequest={helpRequest} feedbackClient={feedbackClient} waitForReply={waitForReply} />, hosts.chat, 'chat')}
      {portal(<FormProgress values={values} embedded onJump={(id) => { const q = firstQuestion(id); if (q) adapter.focusField(q) }} />, hosts.progress, 'progress')}
      {fillHelpers && portal(<SameAddressBox checked={same} onChange={setSame} />, hosts.same, 'same')}
      {portal(<div className="intro"><HowItWorks canSave={canSave} onStart={onStartForm} /><BeforeYouStart canSave={canSave} /></div>, hosts.intro, 'intro')}
      {portal(<SubmitHelp locked={!review.canSubmit} />, hosts.submit, 'submit')}
      {portal(<TranslationNotice />, hosts.notice, 'notice')}
      {drafts && portal(<DraftBar offer={draftOffer} savingOff={savingOff} onResume={resumeDraft} onDiscard={discardDraft} onToggle={toggleSaving} />, hosts.draft, 'draft')}
      {Object.entries(hosts.fields || {}).map(([id, h]) => (
        <FieldExtras key={id} id={id} hosts={h} values={values} live={live} error={errors[id]} onHelp={askHelp} />
      ))}
    </>
  )
}

function FieldExtras({ id, hosts, values, live, error, onHelp }) {
  const tipsFor = id === 'doc_pfs' ? 'supporting_docs' : id // the supporting documents' tip sits before the first one
  return (
    <>
      {hosts.help && FIELD_GUIDE[id] && createPortal(<HelpButton onClick={() => onHelp(id)} />, hosts.help)}
      {hosts.tips && createPortal(<UploadTips tips={uploadTips(tipsFor, values)} id={`idc-${id}-tips`} />, hosts.tips)}
      {hosts.notes && createPortal(<Notes id={`idc-${id}`} notes={fieldNotes(id, values, live, error)} />, hosts.notes)}
    </>
  )
}
