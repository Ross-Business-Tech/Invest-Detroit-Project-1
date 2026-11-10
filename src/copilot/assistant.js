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
import { guideTransport } from './guideTransport.js'
import { evaluateRequest, guardrailReply } from './guardrails/index.js'

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
export function buildRequest({ message, activeFieldId = null, history = [], locale = null, intent = null, historyWindow = ASSISTANT.history_window }) {
  return {
    ...PROGRAM,
    ...(intent ? { intent } : {}), // 'explain_field' when the applicant pressed a question's ? button
    ...(locale ? { locale } : {}), // the applicant's chosen language, so answers come back in it
    field: activeFieldId ? fieldContext(activeFieldId) : null,
    message: redactSensitive(message).text,
    history: history.slice(-historyWindow).map((t) => ({ role: t.role, text: redactSensitive(t.text).text })),
  }
}

// Reply kinds the server may send. Anything but 'answer' is fixed text the chat translates.
const KINDS = new Set(['answer', 'no_answer', 'out_of_scope', 'clarify', 'integrity', 'privacy_warning'])

/**
 * Keep only citations we know about, so the model can't invent links. Accepts our server's
 * `{ reply: {...} }` (api/assistant.js) or a plain `{ text, source_ids }` from another endpoint.
 */
function normalizeReply(raw) {
  const r = raw?.reply && typeof raw.reply === 'object' ? raw.reply : raw
  const ids = Array.isArray(r?.source_ids) ? r.source_ids : Array.isArray(r?.sources) ? r.sources.map((s) => s?.id) : []
  return {
    kind: KINDS.has(r?.kind) ? r.kind : 'answer',
    text: typeof r?.text === 'string' && r.text.trim() ? r.text : CANNED_REPLIES.noAnswer,
    sources: [...new Set(ids)].filter((id) => SOURCES[id]).map((id) => ({ id, title: SOURCES[id].title, url: SOURCES[id].url })),
    needs_staff: !!r?.needs_staff,
    english_only: !!r?.english_only,
    from: typeof r?.from === 'string' ? r.from : 'server',
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
      // A static host answers unknown paths with the web page itself: treat that as unavailable.
      const body = await res.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Assistant endpoint did not return JSON')
      return normalizeReply(body)
    },
  }
}

/** Tries `primary`; if it fails (offline, server error, no server), answers with `fallback`. */
export function withFallback(primary, fallback, onFallback = () => {}) {
  return {
    async send(request) {
      try {
        return await primary.send(request)
      } catch (err) {
        onFallback(err)
        return fallback.send(request)
      }
    },
  }
}

const onServerHost = (hosts, hostname = typeof location !== 'undefined' ? location.hostname : '') =>
  !!hostname && (hosts || []).some((h) => hostname === h.replace(/^\./, '') || hostname.endsWith(h))

export function transportFromConfig(config = ASSISTANT, { hostname } = {}) {
  if (config.mode === 'auto') {
    return onServerHost(config.server_hosts, hostname) ? withFallback(httpTransport(config.endpoint), guideTransport) : guideTransport
  }
  if (config.mode === 'http') return httpTransport(config.endpoint)
  if (config.mode === 'guide') return guideTransport
  return placeholderTransport
}

// ---- Client --------------------------------------------------------------------------------

export function createAssistant({ transport = transportFromConfig(), onEvent = () => {} } = {}) {
  return {
    /**
     * @param {{ message: string, activeFieldId?: string | null, history?: ChatTurn[], locale?: string, intent?: string }} input
     * @returns {Promise<{ shownMessage: string, reply: AssistantReply }>}
     *   shownMessage is the applicant's message as it should appear in the chat (redacted).
     */
    async ask({ message, activeFieldId = null, history = [], locale = null, intent = null }) {
      const { text: shownMessage, found } = redactSensitive(message)
      if (found.length) {
        onEvent({ type: 'assistant_privacy_block', kinds: found })
        return { shownMessage, reply: { kind: 'privacy_warning', text: PRIVACY_WARNING, sources: [], needs_staff: false } }
      }
      // Guardrails run before any answer is produced. In 'http' mode the server runs them again
      // (server/assistantHandler.js), so skipping this browser check gains nothing.
      const decision = evaluateRequest({ message, history, fieldId: activeFieldId, intent })
      if (decision.action !== 'allow') {
        onEvent({ type: 'assistant_guardrail', action: decision.action, category: decision.category })
        return { shownMessage, reply: guardrailReply(decision) }
      }
      onEvent({ type: 'assistant_question', field_id: activeFieldId })
      try {
        const reply = await transport.send(buildRequest({ message: decision.message_for_answer ?? message, activeFieldId, history, locale, intent }))
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
