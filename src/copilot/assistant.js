// AI assistant client. UI-free: the chat window calls ask() and renders whatever comes back.
//
// What is sent (the brief's "context the chatbot can receive"): program + form ids, metadata for
// the question the applicant is on, their message, and a short recent-history window.
// Never sent: other answers on the form, SSNs or account numbers (redacted, and the message is
// not sent at all when one is found).
//
// Transports decide where the request goes. Swap the transport, not this file, to connect a
// real model (here.now proxy route today, an Invest Detroit backend later).

import { PROGRAM, SOURCES, ASSISTANT } from './config.js'
import { fieldContext } from './formDefinition.js'
import { redactSensitive } from './privacy.js'

/**
 * @typedef {{ role: 'user' | 'assistant', text: string }} ChatTurn
 * @typedef {{
 *   kind: 'answer' | 'placeholder' | 'privacy_warning' | 'error',
 *   text: string,
 *   sources: { id: string, title: string, url: string }[],
 *   needs_staff: boolean,
 * }} AssistantReply
 */

export const CANNED_REPLIES = {
  placeholder: 'The AI assistant isn’t connected yet. In the finished version, I’ll answer here with a plain-language explanation and a link to the official source.',
  error: 'Sorry, I couldn’t reach the assistant right now. Please try again, or contact the Invest Detroit team.',
  noAnswer: 'Sorry, I don’t have an answer for that. You can ask the Invest Detroit team directly.',
}

export const PRIVACY_WARNING =
  'That looks like a Social Security Number or account number. Please don’t share it in chat. I’ve hidden it. Sensitive details should only go in the secure form field.'

/** Build the request body. Exported so tests can prove what leaves the browser. */
export function buildRequest({ message, activeFieldId = null, history = [], locale = null, historyWindow = ASSISTANT.history_window }) {
  return {
    ...PROGRAM,
    ...(locale ? { locale } : {}), // the applicant's chosen language, so answers come back in it
    field: activeFieldId ? fieldContext(activeFieldId) : null,
    message: redactSensitive(message).text,
    history: history.slice(-historyWindow).map((t) => ({ role: t.role, text: redactSensitive(t.text).text })),
  }
}

/** Keep only citations we know about, so the model can't invent links. */
function normalizeReply(raw) {
  const ids = Array.isArray(raw?.source_ids) ? raw.source_ids : []
  return {
    kind: 'answer',
    text: typeof raw?.text === 'string' && raw.text.trim() ? raw.text : CANNED_REPLIES.noAnswer,
    sources: ids.filter((id) => SOURCES[id]).map((id) => ({ id, title: SOURCES[id].title, url: SOURCES[id].url })),
    needs_staff: !!raw?.needs_staff,
  }
}

// ---- Transports ----------------------------------------------------------------------------

export const placeholderTransport = {
  async send() {
    return {
      kind: 'placeholder',
      text: CANNED_REPLIES.placeholder,
      sources: [],
      needs_staff: false,
    }
  },
}

/**
 * POSTs the request to `endpoint` and expects { text, source_ids?, needs_staff? } back.
 * The endpoint holds any API key (here.now proxy route or a server); the browser never does.
 */
export function httpTransport(endpoint, fetchImpl = (...a) => fetch(...a)) {
  return {
    async send(request) {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!res.ok) throw new Error(`Assistant request failed (${res.status})`)
      return normalizeReply(await res.json())
    },
  }
}

export function transportFromConfig(config = ASSISTANT) {
  return config.mode === 'http' ? httpTransport(config.endpoint) : placeholderTransport
}

// ---- Client --------------------------------------------------------------------------------

export function createAssistant({ transport = transportFromConfig(), onEvent = () => {} } = {}) {
  return {
    /**
     * @param {{ message: string, activeFieldId?: string | null, history?: ChatTurn[], locale?: string }} input
     * @returns {Promise<{ shownMessage: string, reply: AssistantReply }>}
     *   shownMessage is the applicant's message as it should appear in the chat (redacted).
     */
    async ask({ message, activeFieldId = null, history = [], locale = null }) {
      const { text: shownMessage, found } = redactSensitive(message)
      if (found.length) {
        onEvent({ type: 'assistant_privacy_block', kinds: found })
        return { shownMessage, reply: { kind: 'privacy_warning', text: PRIVACY_WARNING, sources: [], needs_staff: false } }
      }
      onEvent({ type: 'assistant_question', field_id: activeFieldId })
      try {
        const reply = await transport.send(buildRequest({ message, activeFieldId, history, locale }))
        return { shownMessage, reply }
      } catch {
        onEvent({ type: 'assistant_error', field_id: activeFieldId })
        return {
          shownMessage,
          reply: { kind: 'error', text: CANNED_REPLIES.error, sources: [], needs_staff: true },
        }
      }
    },
  }
}
