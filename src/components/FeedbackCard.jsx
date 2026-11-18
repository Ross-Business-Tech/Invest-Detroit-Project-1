// "How was your AI assistant experience?" rating card, attached below the chat window.
// The chat decides when to show it; this component only handles stars, saving and the
// thank-you state. It hides itself (via onDone) about 2 seconds after a successful save.

import { useEffect, useState } from 'react'
import { useI18n } from './i18nContext.js'

const STARS = [1, 2, 3, 4, 5]
const HIDE_AFTER_MS = 2000 // hide the thank-you about 2 seconds after saving

/**
 * @param {{ onSubmit: (rating: number) => Promise<unknown>, onDismiss: () => void, onDone: () => void, alreadySent?: boolean }} props
 */
export default function FeedbackCard({ onSubmit, onDismiss, onDone, alreadySent = false }) {
  const { t } = useI18n()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState(alreadySent ? 'done' : 'idle') // idle | saving | error | done

  useEffect(() => {
    if (status !== 'done') return undefined
    const timer = setTimeout(onDone, HIDE_AFTER_MS)
    return () => clearTimeout(timer)
  }, [status, onDone])

  const submit = async () => {
    if (!rating || status === 'saving' || status === 'done') return
    setStatus('saving')
    try {
      await onSubmit(rating)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="chat-feedback is-done" role="status">
        <span className="feedback-check" aria-hidden="true">✓</span>
        <span>{t('Thank you for your feedback!')}</span>
      </div>
    )
  }

  const shown = hover || rating
  return (
    <div className="chat-feedback" role="group" aria-labelledby="feedback-question">
      <div className="feedback-top">
        <p id="feedback-question" className="feedback-question">{t('How was your AI assistant experience?')}</p>
        <button type="button" className="feedback-close" aria-label={t('Dismiss feedback')} onClick={onDismiss}>×</button>
      </div>
      <div className="feedback-row">
        <div className="feedback-stars" role="radiogroup" aria-labelledby="feedback-question" onMouseLeave={() => setHover(0)}>
          {STARS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t('{count} out of 5 stars', { count: n })}
              className={`feedback-star${n <= shown ? ' is-on' : ''}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => { setRating(n); if (status === 'error') setStatus('idle') }}
              disabled={status === 'saving'}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
              </svg>
            </button>
          ))}
        </div>
        <button type="button" className="feedback-submit" onClick={submit} disabled={!rating || status === 'saving'}>
          {status === 'saving' ? t('Saving…') : t('Submit rating')}
        </button>
      </div>
      {status === 'error' && <p className="feedback-error" role="alert">{t('Couldn’t save your rating. Please try again.')}</p>}
    </div>
  )
}
