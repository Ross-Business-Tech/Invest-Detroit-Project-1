import { useEffect, useRef } from 'react'
import { useI18n } from './i18nContext.js'

export default function SuccessDialog({ name, noteCount = 0, staffSummary = '', onClose, onReset }) {
  const { t } = useI18n()
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
        <h2 id="success-title">{t('Submitted successfully')}</h2>
        <p>{name ? t('Thank you, {name}.', { name }) : t('Thank you.')} {t('Your intake form has been received. A member of the Invest Detroit team will be in touch about next steps.')}</p>
        {noteCount > 0 && <p className="modal-notes">{noteCount === 1 ? t('Your note explaining 1 review item was included.') : t('Your notes explaining {count} review items were included.', { count: noteCount })}</p>}
        <section className="next-steps" aria-labelledby="next-steps-title">
          <h3 id="next-steps-title">{t('What happens next')}</h3>
          <ol>
            <li><strong>{t('Screening')}</strong> <span className="next-time">{t('{range} weeks', { range: '1–2' })}</span><br />{t('Invest Detroit reviews mission fit and feasibility.')}</li>
            <li><strong>{t('Term sheet')}</strong> <span className="next-time">{t('{range} weeks', { range: '2–6' })}</span><br />{t('Site visit, credit review and an indicative term sheet.')}</li>
            <li><strong>{t('Commitment')}</strong> <span className="next-time">{t('{range} weeks', { range: '5–10' })}</span><br />{t('Underwriting and committee decision. Approval brings a commitment letter.')}</li>
            <li><strong>{t('Closing')}</strong> <span className="next-time">{t('{range} weeks', { range: '4–6' })}</span><br />{t('Closing checklist, loan documents and funding.')}</li>
          </ol>
          <p className="next-note">{t('Typical times from Invest Detroit’s lending guide. Every project is different. Please don’t start construction before your loan closes.')}</p>
        </section>
        {staffSummary && (
          <details className="staff-summary">
            <summary>{t('What Invest Detroit’s team receives')}</summary>
            <p className="staff-summary-note">{t('In the real form, this summary goes privately to Invest Detroit’s staff with your application, so they can see what the review found and your notes. It is written in English for staff.')}</p>
            <pre>{staffSummary}</pre>
          </details>
        )}
        <p className="modal-note">{t('Prototype only: nothing was actually sent or saved.')}</p>
        <div className="modal-actions">
          <button type="button" className="btn yellow" ref={closeRef} onClick={onClose}>{t('Close')}</button>
          <button type="button" className="btn outline" onClick={onReset}>{t('Start a new form')}</button>
        </div>
      </div>
    </div>
  )
}
