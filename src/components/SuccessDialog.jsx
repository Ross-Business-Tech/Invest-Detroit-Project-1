import { useEffect, useRef } from 'react'
import { useI18n } from './i18nContext.js'

export default function SuccessDialog({ name, onClose, onReset }) {
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
        <p className="modal-note">{t('Prototype only: nothing was actually sent or saved.')}</p>
        <div className="modal-actions">
          <button type="button" className="btn yellow" ref={closeRef} onClick={onClose}>{t('Close')}</button>
          <button type="button" className="btn outline" onClick={onReset}>{t('Start a new form')}</button>
        </div>
      </div>
    </div>
  )
}
