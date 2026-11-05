// Mock-up of the brief's later-phase feature: suggesting a form answer from an uploaded document.
// It never opens or reads the file. The suggested number is a fixed, made-up example, and the
// applicant must choose Accept, Edit or Leave blank (brief: no silent autofill).
import { useState } from 'react'
import { useI18n } from '../components/i18nContext.js'

const DEMO_AMOUNT = '1450000'

export default function DocSuggestionDemo({ fileName, onAccept, onEdit }) {
  const { t } = useI18n()
  const [state, setState] = useState('open')
  if (state === 'dismissed') return null
  return (
    <div className="doc-demo" role="region" aria-label={t('Preview of a future feature')}>
      <span className="doc-demo-badge">{t('Preview of a future feature')}</span>
      <p>
        <strong>{t('Suggested from {file}, page 2: total budget {amount}', { file: fileName, amount: '$1,450,000' })}</strong>
      </p>
      <p className="doc-demo-note">{t('Demo only: your file was not opened or read. The suggested number is a made-up example.')}</p>
      {state === 'accepted' ? (
        <p className="doc-demo-done">{t('Filled in. Please check it against your own budget.')}</p>
      ) : (
        <div className="doc-demo-actions">
          <button type="button" className="btn small" onClick={() => { onAccept(DEMO_AMOUNT); setState('accepted') }}>{t('Accept suggestion')}</button>
          <button type="button" className="btn small outline" onClick={onEdit}>{t('Edit')}</button>
          <button type="button" className="btn small outline" onClick={() => setState('dismissed')}>{t('Leave blank')}</button>
        </div>
      )}
    </div>
  )
}
