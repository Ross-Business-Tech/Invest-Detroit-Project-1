// "Review My Application" panel: progress bar, result and grouped issues.
// It only displays a review session's state, so it works the same on the prototype form
// or mounted next to Invest Detroit's real form.

import { REVIEW_CHECKS, REVIEW_GROUPS as GROUPS } from '../copilot/review.js'
import { FIELDS_BY_ID } from '../copilot/formDefinition.js'
import { useI18n } from './i18nContext.js'


/**
 * @param {{ state: object, onRun: () => void, onGoToField: (fieldId: string) => void }} props
 *   state is a review session state (see copilot/reviewSession.js)
 */
export default function ReviewPanel({ state, onRun, onGoToField }) {
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
                <h4><span className="badge" aria-hidden="true">{icon}</span>{t(title)} ({list.length})</h4>
                <ul>
                  {list.map((i) => (
                    <li key={i.id}>
                      <div className="issue-text">
                        <strong>{t(i.title_template, i.params)}</strong>
                        <span>{t(i.message_template, i.params)}</span>
                        {FIELDS_BY_ID[i.field_id]?.sectionTitle && <span className="issue-section">{t(FIELDS_BY_ID[i.field_id].sectionTitle)}</span>}
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
