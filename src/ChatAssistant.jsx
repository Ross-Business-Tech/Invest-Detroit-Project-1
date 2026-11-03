import { useEffect, useRef, useState } from 'react'

// Floating AI assistant. Placeholder only: not connected to an AI model yet.
// It already tracks which question the applicant is on, so the real assistant can use it later.

const SUGGESTIONS = [
  'What does "total budget" include?',
  'What is the difference between gross and net square footage?',
  'What does AMI mean?',
  'Which documents do I need?',
]

const SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/

const WELCOME = {
  from: 'bot',
  text: 'Hi! I can explain any question on this form in plain language, point you to official Invest Detroit resources, or connect you with the team. I can’t approve loans or decide eligibility.',
}

function useActiveQuestion() {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const onFocus = (e) => {
      const field = e.target.closest?.('.intake .field')
      if (!field) return
      const label = field.querySelector('.field-label, .choice span')
      if (label) setActive(label.textContent.replace(/\s*\*\s*$/, '').trim())
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [])
  return active
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [draft, setDraft] = useState('')
  const active = useActiveQuestion()
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
  }, [messages, open])

  const send = (text) => {
    const clean = text.trim()
    if (!clean) return
    const looksLikeSSN = SSN_PATTERN.test(clean)
    setMessages((m) => [
      ...m,
      { from: 'user', text: looksLikeSSN ? clean.replace(SSN_PATTERN, '•••-••-••••') : clean },
      looksLikeSSN
        ? { from: 'bot', warn: true, text: 'That looks like a Social Security Number. Please don’t share it in chat. I’ve hidden it. Sensitive details should only go in the secure form field.' }
        : { from: 'bot', placeholder: true, text: 'The AI assistant isn’t connected yet. In the finished version, I’ll answer here with a plain-language explanation and a link to the official source.' },
    ])
    setDraft('')
  }

  return (
    <>
      {open && (
        <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
          <header className="chat-header">
            <div className="chat-avatar" aria-hidden="true">ID</div>
            <div className="chat-heading">
              <h2 id="chat-title">Application Assistant</h2>
              <p>AI helper · Preview, not connected yet</p>
            </div>
            <button type="button" className="chat-close" aria-label="Close assistant" onClick={() => { setOpen(false); buttonRef.current?.focus() }}>×</button>
          </header>

          {active && (
            <div className="chat-context">
              <span>Asking about:</span> <strong title={active}>{active}</strong>
            </div>
          )}

          <ol className="chat-messages" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <li key={i} className={`msg ${m.from}${m.warn ? ' warn' : ''}${m.placeholder ? ' placeholder' : ''}`}>
                {m.text}
              </li>
            ))}
          </ol>

          {messages.length === 1 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
            <label htmlFor="chat-draft" className="sr-only">Type your question</label>
            <input
              id="chat-draft"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about any question on the form…"
              autoComplete="off"
            />
            <button type="submit" aria-label="Send" disabled={!draft.trim()}>➤</button>
          </form>
          <p className="chat-footnote">Don’t share Social Security or bank account numbers in chat.</p>
        </section>
      )}

      <button
        type="button"
        ref={buttonRef}
        className={`chat-launcher${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Close application assistant' : 'Open application assistant'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <span aria-hidden="true" className="launcher-x">×</span>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
            <path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.2 1.1 4.2 3 5.6V21l4.1-2.3c.9.2 1.9.3 2.9.3 5.5 0 10-3.6 10-8s-4.5-8-10-8Zm-4 9.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" />
          </svg>
        )}
        {!open && <span className="launcher-label">Need help?</span>}
      </button>
    </>
  )
}
