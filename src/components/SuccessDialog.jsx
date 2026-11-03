import { useEffect, useRef } from 'react'

export default function SuccessDialog({ name, onClose, onReset }) {
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
