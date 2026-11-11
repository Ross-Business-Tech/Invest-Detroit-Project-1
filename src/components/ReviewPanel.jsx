// "Review My Application" panel: progress bar, result and grouped issues.
// It only displays a review session's state, so it works the same on the prototype form
// or mounted next to Invest Detroit's real form.

import { useState } from 'react'
import { REVIEW_CHECKS, REVIEW_GROUPS as GROUPS } from '../copilot/review.js'
import { FIELDS_BY_ID } from '../copilot/formDefinition.js'
import { useI18n } from './i18nContext.js'


export const NOTE_MAX = 300

/**
 * "This is correct because…": lets the applicant explain a "Please double-check" item instead of
 * changing an answer that is right. The note travels with the application.
 */
function ExplainNote({ issueId, note = '', onNote }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(!!note)
  const boxId = `note-${issueId}`
  if (!open) {
    return <button type="button" className="explain-btn" onClick={() => setOpen(true)}>{t('My answer is correct: explain why')}</button>
  }
  return (
    <div className="explain">
      <label htmlFor={boxId}>{t('This is correct because…')}</label>
      <textarea id={boxId} rows={2} maxLength={NOTE_MAX} value={note} onChange={(e) => onNote(issueId, e.target.value)} />
      <span className="explain-help">{note.trim() ? <><span aria-hidden="true">✓ </span>{t('Your note will be sent with your application.')}</> : t('Add a short note. It will be sent with your application.')}</span>
    </div>
  )
}

/**
 * @param {{ state: object, onRun: () => void, onGoToField: (fieldId: string) => void,
 *   notes?: Record<string, string>, onNote?: (issueId: string, text: string) => void }} props
 *   state is a review session state (see copilot/reviewSession.js). Without onNote, no notes.
 */
export default function ReviewPanel({ state, onRun, onGoToField, notes = {}, onNote }) {
  const { t } = useI18n()
  const { status, step, issues, stale, canSubmit } = state
  const blockers = issues.filter((i) => i.blocking)
  const pct = status === 'running' ? Math.round((step / REVIEW_CHECKS.length) * 100) : status === 'done' ? 100 : 0

  return (
    <div className="review" id="review">
      {status === 'running' && (
        <div className="review-progress" aria-live="polite">
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('Review progress')}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <ol className="review-steps">
            {REVIEW_CHECKS.map(({ id, label }, i) => (
              <li key={id} className={i < step ? 'done' : i === step ? 'current' : ''}>
                <span className="dot" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
                <span>{t(label)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {status === 'idle' && (
        <p className="review-hint" aria-live="polite">
          {stale ? t('You changed an answer after your review. Please review again before submitting.') : t('Before you submit, review your application to catch missing or mistyped answers.')}
        </p>
      )}

      {status === 'done' && canSubmit && (
        <p className="review-success" role="status"><span aria-hidden="true">✓</span> {t('Review successful')}</p>
      )}

      {status === 'done' && !canSubmit && (
        <p className="review-failed" role="status">
          {blockers.length === 1 ? t('Review found 1 item to fix before you can submit.') : t('Review found {count} items to fix before you can submit.', { count: blockers.length })}
        </p>
      )}

      {status === 'done' && issues.length > 0 && (
        <div className="issue-groups">
          {GROUPS.map(({ key, title, icon }) => {
            const list = issues.filter((i) => i.level === key)
            if (!list.length) return null
            return (
              <div key={key} className={`issue-group ${key}`}>
                <h3><span className="badge" aria-hidden="true">{icon}</span>{t(title)} ({list.length})</h3>
                <ul>
                  {list.map((i) => (
                    <li key={i.id} className={notes[i.id]?.trim() ? 'explained' : undefined}>
                      <div className="issue-text">
                        <strong>{t(i.title_template, i.params)}</strong>
                        <span>{t(i.message_template, i.params)}</span>
                        {FIELDS_BY_ID[i.field_id]?.sectionTitle && <span className="issue-section">{t(FIELDS_BY_ID[i.field_id].sectionTitle)}</span>}
                        {onNote && key === 'warning' && <ExplainNote issueId={i.id} note={notes[i.id]} onNote={onNote} />}
                      </div>
                      <button type="button" className="go-btn" onClick={() => onGoToField(i.field_id)}>{t('Go to field')}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="review-btn" onClick={onRun} disabled={status === 'running'}>
        {status === 'running' ? t('Reviewing…') : status === 'done' ? t('Review again') : t('Review My Application')}
      </button>
    </div>
  )
}
