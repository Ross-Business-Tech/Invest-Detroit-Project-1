// The prototype's copy of the intake form. On Invest Detroit's site the real FormAssembly form
// takes this component's place, and adapters/formAssemblyAdapter.js plays the part that
// `values`, `goToField` and the Submit lock play here.

import { useEffect, useRef, useState } from 'react'
import { FORM_INTRO, visibleSections, validate, FIELDS_BY_ID } from '../copilot/formDefinition.js'
import Field, { UploadTips } from '../components/Field.jsx'
import ReviewPanel from '../components/ReviewPanel.jsx'
import SuccessDialog from '../components/SuccessDialog.jsx'
import { useReviewSession } from '../components/useReviewSession.js'
import { useI18n } from '../components/i18nContext.js'
import { SAMPLE_APPLICANT } from './sampleApplicant.js'
import { goToField } from './goToField.js'
import BeforeYouStart from './BeforeYouStart.jsx'
import DocSuggestionDemo from './DocSuggestionDemo.jsx'
import { uploadTips } from '../copilot/uploadTips.js'
import { equityMath, stateForZip, ZIP_STATE } from '../copilot/formHelpers.js'
import { liveNotesFor } from '../copilot/liveNotes.js'
import FormProgress from './FormProgress.jsx'
import { formProgress } from '../copilot/formHelpers.js'
import { track } from '../copilot/events.js'
import { buildStaffSummary } from '../copilot/staffSummary.js'
import { saveDraft, loadDraft, clearDraft, draftsOff, setDraftsOff } from './draft.js'

const isFileField = (id) => FIELDS_BY_ID[id]?.type === 'file'

const HOME_TO_BUSINESS = { home_address: 'business_address', home_city: 'business_city', home_state: 'business_state', home_zip: 'business_zip' }
const BUSINESS_FIELDS = new Set(Object.values(HOME_TO_BUSINESS))

/** Inline error text for each field a finished review blocks on. */
function errorsFrom(issues) {
  const errors = {}
  for (const i of issues) if (i.blocking && !errors[i.field_id]) errors[i.field_id] = i.inline_message || i.title
  return errors
}

/**
 * @param {{ onActiveFieldChange?: (fieldId: string) => void, onHelp?: (fieldId: string) => void }} props
 */
export default function IntakeForm({ onActiveFieldChange = () => {}, onHelp }) {
  const { t, locale } = useI18n()
  const [values, setValues] = useState({})
  const valuesRef = useRef(values)
  useEffect(() => { valuesRef.current = values })
  const [errors, setErrors] = useState({})
  const [showErrors, setShowErrors] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [sameAddress, setSameAddress] = useState(false)
  // Questions the applicant has visited and left (only these get live notes).
  const touched = useRef(new Set())
  const [live, setLive] = useState({})
  const [reviewNotes, setReviewNotes] = useState({})
  // Save & resume: a draft kept on this device only (see draft.js).
  const [draftOffer, setDraftOffer] = useState(() => loadDraft())
  const [savingOff, setSavingOff] = useState(() => draftsOff())
  const [staffSummary, setStaffSummary] = useState('')
  const started = useRef(false)
  const submittedRef = useRef(false)
  const [review, session] = useReviewSession(() => valuesRef.current)
  const sections = visibleSections(values)

  // When a review finishes, highlight each blocking field. Highlights then clear one by one as
  // the applicant edits those fields.
  useEffect(() => session.subscribe((state) => {
    if (state.status === 'done') {
      setErrors(errorsFrom(state.issues))
      setShowErrors(false)
    }
  }), [session])

  // Keep the draft up to date (not while a saved draft is waiting to be resumed or discarded).
  useEffect(() => {
    if (draftOffer || submitted || !started.current) return
    const timer = setTimeout(() => saveDraft(values, { isFileField, extra: { sameAddress } }), 600)
    return () => clearTimeout(timer)
  }, [values, sameAddress, draftOffer, submitted])

  // Where people stop: when the page closes before Submit, count the first unfinished section.
  useEffect(() => {
    const onLeave = () => {
      if (!started.current || submittedRef.current) return
      const section = formProgress(valuesRef.current).sections.find((s) => s.done < s.total)?.id
      track({ type: 'form_left', section })
    }
    addEventListener('pagehide', onLeave)
    return () => removeEventListener('pagehide', onLeave)
  }, [])

  const markStarted = () => {
    if (started.current) return
    started.current = true
    track({ type: 'form_started' })
  }

  const resumeDraft = () => {
    setValues(draftOffer.values)
    setSameAddress(!!draftOffer.sameAddress)
    setDraftOffer(null)
    started.current = true // a resumed form was already counted as started on the first visit
    session.invalidate()
  }
  const discardDraft = () => { clearDraft(); setDraftOffer(null) }
  const toggleSaving = () => {
    const off = !savingOff
    setDraftsOff(off)
    setSavingOff(off)
    if (!off) saveDraft(valuesRef.current, { isFileField, extra: { sameAddress } })
  }

  const onChange = (id, val, file) => {
    markStarted()
    setValues((v) => {
      const next = { ...v, [id]: val }
      // Keep the business address in step with the home address while the box is ticked.
      if (sameAddress && HOME_TO_BUSINESS[id]) next[HOME_TO_BUSINESS[id]] = val
      // Fill in the state from a Michigan ZIP code when the state is still blank.
      const stateId = ZIP_STATE[id]
      if (stateId && !next[stateId] && stateForZip(val)) {
        next[stateId] = stateForZip(val)
        if (sameAddress && HOME_TO_BUSINESS[stateId]) next[HOME_TO_BUSINESS[stateId]] = next[stateId]
      }
      // Remember a chosen file's name and size (never its contents) for the file checks.
      if (file !== undefined) next._files = { ...(v._files || {}), [id]: file }
      return next
    })
    setErrors(({ [id]: _removed, ...rest }) => rest)
    setLive(({ [id]: _removed, ...rest }) => rest)
    if (file !== undefined) {
      touched.current.add(id)
      setTimeout(() => setLive(liveNotesFor(valuesRef.current, touched.current)), 0)
    }
    session.invalidate()
  }

  // Check a question when the applicant leaves it.
  const onBlur = (id) => {
    touched.current.add(id)
    // Read the latest answers after this event's state update has landed.
    setTimeout(() => setLive(liveNotesFor(valuesRef.current, touched.current)), 0)
  }

  const toggleSameAddress = (on) => {
    setSameAddress(on)
    if (on) {
      setValues((v) => {
        const next = { ...v }
        for (const [home, biz] of Object.entries(HOME_TO_BUSINESS)) next[biz] = v[home] || ''
        return next
      })
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !BUSINESS_FIELDS.has(k))))
      setLive((l) => Object.fromEntries(Object.entries(l).filter(([k]) => !BUSINESS_FIELDS.has(k))))
      session.invalidate()
    }
  }

  const onNote = (issueId, text) => setReviewNotes((n) => ({ ...n, [issueId]: text }))
  // Notes for warnings in the latest review: these go in with the application.
  const sentNotes = review.issues.filter((i) => i.level === 'warning' && reviewNotes[i.id]?.trim())

  const onSubmit = (e) => {
    e.preventDefault()
    if (!review.canSubmit) return
    // Defensive re-check, same as the real form's own validation on Submit.
    const found = validate(values)
    const first = Object.keys(found)[0]
    if (first) {
      setErrors(found)
      setShowErrors(true)
      goToField(first)
      return
    }
    setShowErrors(false)
    // What Invest Detroit's staff would receive with the application (never sent to our server).
    setStaffSummary(buildStaffSummary({ issues: review.issues, notes: reviewNotes, locale }))
    clearDraft()
    submittedRef.current = true
    track({ type: 'form_submitted' })
    setSubmitted(true)
  }

  const reset = () => {
    clearDraft()
    started.current = false
    submittedRef.current = false
    setValues({})
    setErrors({})
    setShowErrors(false)
    setSubmitted(false)
    setSameAddress(false)
    touched.current = new Set()
    setLive({})
    setReviewNotes({})
    session.reset()
    setFormKey((k) => k + 1)
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const fillSample = () => {
    markStarted()
    setValues(SAMPLE_APPLICANT)
    setSameAddress(false)
    setLive({})
    setErrors({})
    setShowErrors(false)
    session.invalidate()
  }

  const onFocusCapture = (e) => {
    const id = e.target.closest?.('[data-field-id]')?.dataset.fieldId
    if (id) onActiveFieldChange(id)
  }

  const errorCount = Object.keys(errors).length

  return (
    <>
      {draftOffer && (
        <div className="draft-offer" role="region" aria-label={t('Saved answers')}>
          <p>
            <strong>{t('You have saved answers from {date}.', { date: new Date(draftOffer.savedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}</strong>{' '}
            {t('Files need to be attached again.')}
          </p>
          <div className="draft-actions">
            <button type="button" className="btn small" onClick={resumeDraft}>{t('Continue where I left off')}</button>
            <button type="button" className="btn small outline" onClick={discardDraft}>{t('Start over')}</button>
          </div>
        </div>
      )}

      <BeforeYouStart />

      <div className="proto-tools">
        <span>{t('Prototype tools:')}</span>
        <button type="button" className="btn small" onClick={fillSample}>{t('Fill with sample applicant')}</button>
        <button type="button" className="btn small outline" onClick={reset}>{t('Clear form')}</button>
      </div>

      <form key={formKey} className="intake" onSubmit={onSubmit} onFocus={onFocusCapture} noValidate>
        <FormProgress values={values} />
        <h1 className="form-title">{t('Real Estate/C&I In-Take Form')}</h1>
        <div className="form-intro">
          {FORM_INTRO.map((p) => <p key={p}>{t(p)}</p>)}
        </div>

        <p className="draft-status" role="status">
          {savingOff ? t('Answers are not being saved on this device.') : t('Your answers are saved on this device as you type, so you can come back later.')}{' '}
          <button type="button" className="link-btn" onClick={toggleSaving}>{savingOff ? t('Save on this device') : t('Don’t save on this device')}</button>
        </p>

        {showErrors && errorCount > 0 && (
          <div className="error-summary" role="alert">
            {errorCount === 1 ? t('Please correct the highlighted field before submitting.') : t('Please correct the {count} highlighted fields before submitting.', { count: errorCount })}
          </div>
        )}

        {sections.map((section) => (
          <fieldset key={section.id} className="section" id={`section-${section.id}`}>
            <legend>{t(section.title)}</legend>
            {section.intro && <p className={`section-paragraph${section.introBold ? ' bold' : ''}`}>{t(section.intro)}</p>}
            <UploadTips tips={uploadTips(section.id, values)} />
            {section.id === 'company' && (
              <label className="choice same-address">
                <input type="checkbox" checked={sameAddress} onChange={(e) => toggleSameAddress(e.target.checked)} />
                <span>{t('Business address is the same as my home address')}</span>
              </label>
            )}
            <div className="field-grid">
              {section.fields.map((f) => (
                <Field
                  key={f.id}
                  field={f}
                  value={values[f.id]}
                  error={errors[f.id]}
                  onChange={onChange}
                  onHelp={onHelp}
                  onBlur={onBlur}
                  readOnly={sameAddress && BUSINESS_FIELDS.has(f.id)}
                  file={values._files?.[f.id]}
                  notes={[live[f.id], f.id === 'equity_10pct' ? { ...equityMath(values), level: 'calc' } : null].filter((n) => n?.text)}
                  tips={f.type === 'file' ? uploadTips(f.id, values) : undefined}
                />
              ))}
            </div>
            {section.id === 'required_docs' && values.doc_dev_budget && (
              <DocSuggestionDemo
                key={values.doc_dev_budget}
                fileName={values.doc_dev_budget}
                onAccept={(amount) => onChange('total_budget', amount)}
                onEdit={() => goToField('total_budget')}
              />
            )}
          </fieldset>
        ))}

        <p className="treasury">
          {t('In accordance with federal laws and U.S. Department of the Treasury policy, this organization is prohibited from discriminating on the basis of race, color, national origin, sex, age, or disability. To file a complaint of discrimination, write to: U.S. Department of the Treasury, Director, Office of Civil Rights and Equal Employment Opportunity, 1500 Pennsylvania Avenue, N.W., Washington, DC 20220; call (202) 622-1160; or send an e-mail to: crcomplaints@treasury.gov')}
        </p>

        <ReviewPanel state={review} onRun={session.run} onGoToField={goToField} notes={reviewNotes} onNote={onNote} />

        <div className="actions">
          <button type="submit" className="btn submit" disabled={!review.canSubmit} aria-describedby="submit-help">{t('Submit')}</button>
        </div>
        {!review.canSubmit && <p className="submit-help" id="submit-help">{t('Submit unlocks after a successful review.')}</p>}
      </form>

      {submitted && <SuccessDialog name={values.first_name} noteCount={sentNotes.length} staffSummary={staffSummary} onClose={() => setSubmitted(false)} onReset={reset} />}
    </>
  )
}
