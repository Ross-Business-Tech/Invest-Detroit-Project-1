// Floating "Need help?" chat window. It only displays the conversation: what gets sent, privacy
// redaction and where answers come from are handled by copilot/assistant.js.

import { useCallback, useEffect, useRef, useState } from 'react'
import { fieldContext } from '../copilot/formDefinition.js'
import { useI18n } from './i18nContext.js'
import { SUGGESTIONS, WELCOME_TEXT, DEFAULT_SUBTITLE } from './chatText.js'
import FeedbackCard from './FeedbackCard.jsx'
import { hasMeaningfulInteraction } from '../copilot/feedback.js'

const WELCOME = { role: 'assistant', kind: 'welcome', text: WELCOME_TEXT, sources: [] }

/**
 * @param {{ assistant: { ask: Function }, activeFieldId: string | null, subtitle?: string,
 *           helpRequest?: { fieldId: string, n: number } | null, feedbackClient?: { submit: Function } | null }} props
 *   assistant comes from createAssistant(); activeFieldId from the form adapter;
 *   helpRequest changes when the applicant presses a question's ? button;
 *   feedbackClient (copilot/feedback.js) turns on the rating card below the chat.
 */
export default function ChatAssistant({ assistant, activeFieldId, subtitle = DEFAULT_SUBTITLE, helpRequest = null, feedbackClient = null }) {
  const { t, info } = useI18n()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const active = activeFieldId ? fieldContext(activeFieldId) : null
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, waiting])

  const send = async (text, { fieldId = activeFieldId, intent = null } = {}) => {
    if (!text.trim() || waiting) return
    setDraft('')
    setWaiting(true)
    // Recent turns (English text) for follow-ups and repeated off-topic attempts. Fixed guardrail replies are included.
    const history = messages.filter((m) => m.role === 'user' || ['answer', 'no_answer', 'out_of_scope', 'clarify', 'integrity'].includes(m.kind)).map(({ role, text: t }) => ({ role, text: t }))
    const { shownMessage, reply } = await assistant.ask({ message: text.trim(), activeFieldId: fieldId, history, locale: info.bcp47, intent })
    setMessages((m) => [...m, { role: 'user', text: shownMessage, sources: [] }, { role: 'assistant', ...reply }])
    setWaiting(false)
  }

  // The ? button next to a question: open the chat and explain that question.
  const lastHelp = useRef(null)
  useEffect(() => {
    if (!helpRequest || lastHelp.current === helpRequest.n) return
    lastHelp.current = helpRequest.n
    setOpen(true)
    const label = fieldContext(helpRequest.fieldId)?.field_label || ''
    send(t('Explain: {question}', { question: label }), { fieldId: helpRequest.fieldId, intent: 'explain_field' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpRequest])

  // Rating card: asked once per chat session, only after the assistant has really helped.
  // waiting -> shown -> sent (saved; thank-you showing) -> finished. Dismissing also finishes.
  // Once sent or finished it never asks again this session, even if the chat is closed and reopened.
  const [feedback, setFeedback] = useState('waiting')
  if (feedbackClient && feedback === 'waiting' && hasMeaningfulInteraction(messages)) setFeedback('shown')
  const finishFeedback = useCallback(() => setFeedback('finished'), [])
  const submitFeedback = useCallback(async (rating) => {
    await feedbackClient.submit(rating)
    setFeedback('sent')
  }, [feedbackClient])


  return (
    <>
      {open && (
        <div className="chat-dock">
        <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
          <header className="chat-header">
            <div className="chat-avatar" aria-hidden="true">ID</div>
            <div className="chat-heading">
              <h2 id="chat-title">{t('Application Assistant')}</h2>
              <p>{t(subtitle)}</p>
            </div>
            <button type="button" className="chat-close" aria-label={t('Close assistant')} onClick={() => { setOpen(false); buttonRef.current?.focus() }}>×</button>
          </header>

          {active && (
            <div className="chat-context">
              <span>{t('Asking about:')}</span> <strong title={t(active.field_label)}>{t(active.field_label)}</strong>
            </div>
          )}

          <ol className="chat-messages" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <li key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'} ${m.kind || ''}`}>
                {m.english_only && <span className="msg-note">{t('This answer is only available in English for now.')}</span>}
                {/* Fixed messages are translated here; user messages and answers are shown as they are. */}
                {m.role === 'user' || m.kind === 'answer' ? m.text : t(m.text)}
                {m.sources?.length > 0 && (
                  <span className="msg-sources">
                    {t('Source:')}{' '}
                    {m.sources.map((s, j) => (
                      <span key={s.id}>{j > 0 && ', '}{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</span>
                    ))}
                  </span>
                )}
              </li>
            ))}
            {waiting && <li className="msg bot typing" aria-label={t('Assistant is typing')}>…</li>}
          </ol>

          {messages.length === 1 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => send(t(s))}>{t(s)}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
            <label htmlFor="chat-draft" className="sr-only">{t('Type your question')}</label>
            <input
              id="chat-draft"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('Ask about any question on the form…')}
              autoComplete="off"
            />
            <button type="submit" aria-label={t('Send')} disabled={!draft.trim() || waiting}>➤</button>
          </form>
          <p className="chat-footnote">{t('Don’t share Social Security or bank account numbers in chat.')}</p>
        </section>
        {(feedback === 'shown' || feedback === 'sent') && (
          <FeedbackCard alreadySent={feedback === 'sent'} onSubmit={submitFeedback} onDismiss={finishFeedback} onDone={finishFeedback} />
        )}
        </div>
      )}

      <button
        type="button"
        ref={buttonRef}
        className={`chat-launcher${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? t('Close application assistant') : t('Open application assistant')}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <span aria-hidden="true" className="launcher-x">×</span>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
            <path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.2 1.1 4.2 3 5.6V21l4.1-2.3c.9.2 1.9.3 2.9.3 5.5 0 10-3.6 10-8s-4.5-8-10-8Zm-4 9.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" />
          </svg>
        )}
        {!open && <span className="launcher-label">{t('Need help?')}</span>}
      </button>
    </>
  )
}
