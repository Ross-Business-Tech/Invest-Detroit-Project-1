// The prototype's copy of the intake form. On Invest Detroit's site the real FormAssembly form
// takes this component's place, and adapters/formAssemblyAdapter.js plays the part that
// `values`, `goToField` and the Submit lock play here.

import { useEffect, useRef, useState } from 'react'
import { FORM_INTRO, visibleSections, validate } from '../copilot/formDefinition.js'
import Field from '../components/Field.jsx'
import ReviewPanel from '../components/ReviewPanel.jsx'
import SuccessDialog from '../components/SuccessDialog.jsx'
import { useReviewSession } from '../components/useReviewSession.js'
import { SAMPLE_APPLICANT } from './sampleApplicant.js'
import { goToField } from './goToField.js'

/** Inline error text for each field a finished review blocks on. */
function errorsFrom(issues) {
  const errors = {}
  for (const i of issues) if (i.blocking && !errors[i.field_id]) errors[i.field_id] = i.inline_message || i.title
  return errors
}

/**
 * @param {{ onActiveFieldChange?: (fieldId: string) => void }} props
 */
export default function IntakeForm({ onActiveFieldChange = () => {} }) {
  const [values, setValues] = useState({})
  const valuesRef = useRef(values)
  useEffect(() => { valuesRef.current = values })
  const [errors, setErrors] = useState({})
  const [showErrors, setShowErrors] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formKey, setFormKey] = useState(0)
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

  const onChange = (id, val) => {
    setValues((v) => ({ ...v, [id]: val }))
    setErrors(({ [id]: _removed, ...rest }) => rest)
    session.invalidate()
  }

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
    setSubmitted(true)
  }

  const reset = () => {
    setValues({})
    setErrors({})
    setShowErrors(false)
    setSubmitted(false)
    session.reset()
    setFormKey((k) => k + 1)
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const fillSample = () => {
    setValues(SAMPLE_APPLICANT)
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
      <div className="proto-tools">
        <span>Prototype tools:</span>
        <button type="button" className="btn small" onClick={fillSample}>Fill with sample applicant</button>
        <button type="button" className="btn small outline" onClick={reset}>Clear form</button>
      </div>

      <form key={formKey} className="intake" onSubmit={onSubmit} onFocus={onFocusCapture} noValidate>
        <h1 className="form-title">Real Estate/C&amp;I In-Take Form</h1>
        <div className="form-intro">
          {FORM_INTRO.map((p) => <p key={p}>{p}</p>)}
        </div>

        {showErrors && errorCount > 0 && (
          <div className="error-summary" role="alert">
            Please correct the {errorCount} highlighted {errorCount === 1 ? 'field' : 'fields'} before submitting.
          </div>
        )}

        {sections.map((section) => (
          <fieldset key={section.id} className="section" id={`section-${section.id}`}>
            <legend>{section.title}</legend>
            {section.intro && <p className={`section-paragraph${section.introBold ? ' bold' : ''}`}>{section.intro}</p>}
            <div className="field-grid">
              {section.fields.map((f) => (
                <Field key={f.id} field={f} value={values[f.id]} error={errors[f.id]} onChange={onChange} />
              ))}
            </div>
          </fieldset>
        ))}

        <p className="treasury">
          In accordance with federal laws and U.S. Department of the Treasury policy, this organization is prohibited from discriminating on the basis of race, color, national origin, sex, age, or disability. To file a complaint of discrimination, write to: U.S. Department of the Treasury, Director, Office of Civil Rights and Equal Employment Opportunity, 1500 Pennsylvania Avenue, N.W., Washington, DC 20220; call (202) 622-1160; or send an e-mail to: crcomplaints@treasury.gov
        </p>

        <ReviewPanel state={review} onRun={session.run} onGoToField={goToField} />

        <div className="actions">
          <button type="submit" className="btn submit" disabled={!review.canSubmit} aria-describedby="submit-help">Submit</button>
        </div>
        {!review.canSubmit && <p className="submit-help" id="submit-help">Submit unlocks after a successful review.</p>}
      </form>

      {submitted && <SuccessDialog name={values.first_name} onClose={() => setSubmitted(false)} onReset={reset} />}
    </>
  )
}
