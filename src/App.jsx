import { useEffect, useRef, useState } from 'react'
import { FORM_INTRO, SAMPLE_APPLICANT, visibleSections, validate } from './formSchema.js'
import { REVIEW_STEPS, runReview } from './reviewRules.js'
import ChatAssistant from './ChatAssistant.jsx'
import './App.css'

function Label({ field, htmlFor, as = 'label' }) {
  const Tag = as
  let content = field.label
  if (field.emphasis) {
    const [before, after] = field.label.split(` ${field.emphasis} `)
    content = (
      <>
        {before} <b><u>{field.emphasis}</u></b> {after}
      </>
    )
  }
  return (
    <Tag className="field-label" htmlFor={as === 'label' ? htmlFor : undefined} id={`${field.id}-label`}>
      {content}
      {field.required && <span className="req" aria-hidden="true"> *</span>}
    </Tag>
  )
}

function Hint({ field }) {
  if (field.hintLink) {
    const { before, text, href, after } = field.hintLink
    return (
      <p className="hint">
        {before}
        <a href={href} target="_blank" rel="noreferrer">{text}</a>
        {after}
      </p>
    )
  }
  return field.hint ? <p className="hint" id={`${field.id}-hint`}>{field.hint}</p> : null
}

function Field({ field, value, error, onChange }) {
  const id = field.id
  const errId = `${id}-error`
  const common = {
    id,
    name: id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [field.hint ? `${id}-hint` : '', error ? errId : ''].filter(Boolean).join(' ') || undefined,
    'aria-required': field.required ? 'true' : undefined,
  }
  const errorEl = error ? <p className="error" id={errId}>{error}</p> : null
  const cls = `field w-${field.width || 'full'}${error ? ' has-error' : ''}`

  switch (field.type) {
    case 'subheading':
      return <h4 className={`subheading${field.plain ? ' plain' : ''}`}>{field.text}</h4>
    case 'paragraph':
      return <p className="section-paragraph">{field.text}</p>
    case 'disabled':
      return (
        <div className={`${cls} is-disabled`}>
          <Label field={field} htmlFor={id} />
          <input {...common} type="text" disabled value="" placeholder="Not collected in prototype" />
          <p className="hint">{field.disabledNote}</p>
        </div>
      )
    case 'textarea':
      return (
        <div className={cls}>
          <Label field={field} htmlFor={id} />
          <textarea {...common} rows={5} maxLength={field.maxLength} value={value || ''} onChange={(e) => onChange(id, e.target.value)} />
          {field.maxLength && <p className="hint counter">{(value || '').length}/{field.maxLength}</p>}
          {errorEl}
        </div>
      )
    case 'radio':
      return (
        <div className={cls} role="radiogroup" aria-labelledby={`${id}-label`} id={id}>
          <Label field={field} as="p" />
          <div className={`choices ${field.layout === 'vertical' ? 'vertical' : 'horizontal'}`}>
            {field.options.map((opt) => (
              <label key={opt} className="choice">
                <input type="radio" name={id} id={`${id}-${opt}`} value={opt} checked={value === opt} onChange={() => onChange(id, opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {errorEl}
        </div>
      )
    case 'checkboxes': {
      const list = Array.isArray(value) ? value : []
      const toggle = (opt) => onChange(id, list.includes(opt) ? list.filter((o) => o !== opt) : [...list, opt])
      return (
        <div className={cls} role="group" aria-labelledby={`${id}-label`} id={id}>
          <Label field={field} as="p" />
          <Hint field={field} />
          <div className="choices grid">
            {field.options.map((opt, i) => (
              <label key={opt} className="choice">
                <input type="checkbox" id={`${id}-${i}`} checked={list.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {errorEl}
        </div>
      )
    }
    case 'select':
      return (
        <div className={cls}>
          <Label field={field} htmlFor={id} />
          <select {...common} value={value || ''} onChange={(e) => onChange(id, e.target.value)}>
            <option value="">Please select...</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {field.prototypeNote && <p className="hint proto-note">{field.prototypeNote}</p>}
          {errorEl}
        </div>
      )
    case 'file':
      return (
        <div className={cls}>
          <Label field={field} htmlFor={id} />
          <input {...common} type="file" onChange={(e) => onChange(id, e.target.files?.[0]?.name || '')} />
          {value && <p className="hint">Selected: {value} (stays on your device)</p>}
          <Hint field={field} />
          {errorEl}
        </div>
      )
    case 'ack':
      return (
        <div className={`${cls} ack`}>
          <label className="choice">
            <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(id, e.target.checked)} />
            <span>{field.label}{field.required && <span className="req" aria-hidden="true">*</span>}</span>
          </label>
          {errorEl}
        </div>
      )
    default: {
      const inputProps = {
        email: { type: 'email', autoComplete: 'email' },
        tel: { type: 'tel', maxLength: 12 },
        state: { type: 'text', maxLength: 2, autoCapitalize: 'characters' },
        zip: { type: 'text', maxLength: 5, inputMode: 'numeric' },
        money: { type: 'text', maxLength: 12, inputMode: 'decimal' },
        number: { type: 'text', inputMode: 'decimal' },
        integer: { type: 'text', inputMode: 'numeric' },
      }[field.type] || { type: 'text', maxLength: field.maxLength }
      return (
        <div className={cls}>
          <Label field={field} htmlFor={id} />
          <div className={field.type === 'money' ? 'money' : undefined}>
            <input
              {...common}
              {...inputProps}
              autoComplete={field.autoComplete || inputProps.autoComplete}
              value={value || ''}
              onChange={(e) => onChange(id, field.type === 'state' ? e.target.value.toUpperCase() : e.target.value)}
            />
          </div>
          <Hint field={field} />
          {errorEl}
        </div>
      )
    }
  }
}

function SuccessDialog({ name, onClose, onReset }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="success-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-check" aria-hidden="true">✓</div>
        <h2 id="success-title">Submitted successfully</h2>
        <p>Thank you{name ? `, ${name}` : ''}. Your intake form has been received. A member of the Invest Detroit team will be in touch about next steps.</p>
        <p className="modal-note">Prototype only: nothing was actually sent or saved.</p>
        <div className="modal-actions">
          <button type="button" className="btn yellow" ref={closeRef} onClick={onClose}>Close</button>
          <button type="button" className="btn outline" onClick={onReset}>Start a new form</button>
        </div>
      </div>
    </div>
  )
}


const LEVELS = [
  { key: 'blocker', title: 'Must fix before submitting', icon: '!' },
  { key: 'warning', title: 'Please double-check', icon: '?' },
  { key: 'info', title: 'Good to know', icon: 'i' },
]

function goToField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusable = el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea')
  focusable?.focus({ preventScroll: true })
}

function ReviewPanel({ review, onReview }) {
  const { status, step, issues, stale } = review
  const blockers = issues.filter((i) => i.level === 'blocker')
  const pct = status === 'running' ? Math.round((step / REVIEW_STEPS.length) * 100) : status === 'done' ? 100 : 0
  const success = status === 'done' && blockers.length === 0

  return (
    <div className="review" id="review">
      {status === 'running' && (
        <div className="review-progress" aria-live="polite">
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Review progress">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <ol className="review-steps">
            {REVIEW_STEPS.map((label, i) => (
              <li key={label} className={i < step ? 'done' : i === step ? 'current' : ''}>
                <span className="dot" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {status === 'idle' && (
        <p className="review-hint" aria-live="polite">
          {stale ? 'You changed an answer after your review. Please review again before submitting.' : 'Before you submit, review your application to catch missing or mistyped answers.'}
        </p>
      )}

      {success && (
        <p className="review-success" role="status"><span aria-hidden="true">✓</span> Review successful</p>
      )}

      {status === 'done' && blockers.length > 0 && (
        <p className="review-failed" role="status">
          Review found {blockers.length} {blockers.length === 1 ? 'item' : 'items'} to fix before you can submit.
        </p>
      )}

      {status === 'done' && issues.length > 0 && (
        <div className="issue-groups">
          {LEVELS.map(({ key, title, icon }) => {
            const list = issues.filter((i) => i.level === key)
            if (!list.length) return null
            return (
              <div key={key} className={`issue-group ${key}`}>
                <h4><span className="badge" aria-hidden="true">{icon}</span>{title} ({list.length})</h4>
                <ul>
                  {list.map((i) => (
                    <li key={i.id}>
                      <div className="issue-text">
                        <strong>{i.title}</strong>
                        <span>{i.message}</span>
                        {i.section && <span className="issue-section">{i.section}</span>}
                      </div>
                      <button type="button" className="go-btn" onClick={() => goToField(i.fieldId)}>Go to field</button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="btn review-btn" onClick={onReview} disabled={status === 'running'}>
        {status === 'running' ? 'Reviewing…' : status === 'done' ? 'Review again' : 'Review My Application'}
      </button>
    </div>
  )
}

function IntakeForm() {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [showErrors, setShowErrors] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [review, setReview] = useState({ status: 'idle', step: 0, issues: [], stale: false })
  const timer = useRef(null)
  const sections = visibleSections(values)
  const canSubmit = review.status === 'done' && !review.issues.some((i) => i.level === 'blocker')

  useEffect(() => () => clearInterval(timer.current), [])

  const invalidateReview = () => {
    clearInterval(timer.current)
    setReview((r) => (r.status === 'idle' && !r.stale ? r : { status: 'idle', step: 0, issues: [], stale: r.status !== 'idle' || r.stale }))
  }

  const startReview = () => {
    clearInterval(timer.current)
    const issues = runReview(values)
    const fieldErrors = {}
    for (const i of issues) if (i.level === 'blocker' && !fieldErrors[i.fieldId]) fieldErrors[i.fieldId] = i.fieldMessage || i.title
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setReview({ status: 'running', step: 0, issues: [], stale: false })
    setShowErrors(false)
    let step = 0
    timer.current = setInterval(() => {
      step += 1
      if (step >= REVIEW_STEPS.length) {
        clearInterval(timer.current)
        setReview({ status: 'done', step, issues, stale: false })
        setErrors(fieldErrors)
      } else {
        setReview((r) => ({ ...r, step }))
      }
    }, reduce ? 120 : 650)
  }

  const onChange = (id, val) => {
    setValues((v) => ({ ...v, [id]: val }))
    if (errors[id]) setErrors(({ [id]: _removed, ...rest }) => rest)
    invalidateReview()
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const found = validate(values)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      setShowErrors(true)
      const el = document.getElementById(first)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus?.({ preventScroll: true })
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
    clearInterval(timer.current)
    setReview({ status: 'idle', step: 0, issues: [], stale: false })
    setFormKey((k) => k + 1)
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const errorCount = Object.keys(errors).length

  return (
    <>
      <div className="proto-tools">
        <span>Prototype tools:</span>
        <button type="button" className="btn small" onClick={() => { setValues(SAMPLE_APPLICANT); setErrors({}); setShowErrors(false); invalidateReview() }}>
          Fill with sample applicant
        </button>
        <button type="button" className="btn small outline" onClick={reset}>Clear form</button>
      </div>

      <form key={formKey} className="intake" onSubmit={onSubmit} noValidate>
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

        <ReviewPanel review={review} onReview={startReview} />

        <div className="actions">
          <button type="submit" className="btn submit" disabled={!canSubmit} aria-describedby="submit-help">Submit</button>
        </div>
        {!canSubmit && <p className="submit-help" id="submit-help">Submit unlocks after a successful review.</p>}
      </form>

      {submitted && <SuccessDialog name={values.first_name} onClose={() => setSubmitted(false)} onReset={reset} />}
    </>
  )
}

export default function App() {
  return (
    <>
      <div className="proto-banner" role="note">
        Student prototype for the Invest Detroit project. Not the official website. Nothing you enter is sent anywhere.
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <span className="logo">Invest Detroit</span>
          <a href="#form" className="btn yellow">Need Support?</a>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h2>Need Support?</h2>
        </div>
      </section>

      <main>
        <section className="band how-it-works">
          <div className="inner">
            <h3>How it works</h3>
            <p>Invest Detroit works with developers, business owners, entrepreneurs, and startup founders to help accomplish our mission to be a financial catalyst for economic growth in underserved communities and markets in Detroit and the region. We believe in one Detroit for all and welcome funding interest from Detroit residents, entrepreneurs of color, women, and immigrants.</p>
            <p>For more information on our <strong>real estate</strong> and <strong>industrial</strong> offerings, please fill out the contact form below with information about your project and someone from our team will be in touch with you.</p>
            <p>For <strong>small business inquiries</strong>, please visit our <a href="https://investdetroit.com/small-business/" target="_blank" rel="noreferrer">small business page</a> and fill out the inquiry form.</p>
            <p>For more information on <strong>ID Ventures</strong>, our venture capital arm, please <a href="https://idventures.com/" target="_blank" rel="noreferrer">click here</a>.</p>
          </div>
        </section>

        <section className="band form-band" id="form">
          <div className="band-title"><span>Get In Touch</span></div>
          <div className="form-holder">
            <IntakeForm />
          </div>
        </section>

        <section className="band contact-band">
          <div className="band-title"><span>Contact Us</span></div>
          <address className="contact">
            950 Selden Street, Suite 360<br />
            Detroit, MI 48201<br />
            info@investdetroit.com<br />
            313.259.6368
          </address>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>Prototype built by students to test an AI application assistant. Content adapted from the public Invest Detroit intake form. Not affiliated with or endorsed by Invest Detroit.</p>
        </div>
      </footer>

      <ChatAssistant />
    </>
  )
}
