// "Review My Application" panel: progress bar, result and grouped issues.
// It only displays a review session's state, so it works the same on the prototype form
// or mounted next to Invest Detroit's real form.

import { REVIEW_CHECKS } from '../copilot/review.js'
import { FIELDS_BY_ID } from '../copilot/formDefinition.js'

const GROUPS = [
  { key: 'blocker', title: 'Must fix before submitting', icon: '!' },
  { key: 'warning', title: 'Please double-check', icon: '?' },
  { key: 'info', title: 'Good to know', icon: 'i' },
]

/**
 * @param {{ state: object, onRun: () => void, onGoToField: (fieldId: string) => void }} props
 *   state is a review session state (see copilot/reviewSession.js)
 */
export default function ReviewPanel({ state, onRun, onGoToField }) {
  const { status, step, issues, stale, canSubmit } = state
  const blockers = issues.filter((i) => i.blocking)
  const pct = status === 'running' ? Math.round((step / REVIEW_CHECKS.length) * 100) : status === 'done' ? 100 : 0

  return (
    <div className="review" id="review">
      {status === 'running' && (
        <div className="review-progress" aria-live="polite">
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Review progress">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <ol className="review-steps">
            {REVIEW_CHECKS.map(({ id, label }, i) => (
              <li key={id} className={i < step ? 'done' : i === step ? 'current' : ''}>
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

      {status === 'done' && canSubmit && (
        <p className="review-success" role="status"><span aria-hidden="true">✓</span> Review successful</p>
      )}

      {status === 'done' && !canSubmit && (
        <p className="review-failed" role="status">
          Review found {blockers.length} {blockers.length === 1 ? 'item' : 'items'} to fix before you can submit.
        </p>
      )}

      {status === 'done' && issues.length > 0 && (
        <div className="issue-groups">
          {GROUPS.map(({ key, title, icon }) => {
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
                        {FIELDS_BY_ID[i.field_id]?.sectionTitle && <span className="issue-section">{FIELDS_BY_ID[i.field_id].sectionTitle}</span>}
                      </div>
                      <button type="button" className="go-btn" onClick={() => onGoToField(i.field_id)}>Go to field</button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="btn review-btn" onClick={onRun} disabled={status === 'running'}>
        {status === 'running' ? 'Reviewing…' : status === 'done' ? 'Review again' : 'Review My Application'}
      </button>
    </div>
  )
}
