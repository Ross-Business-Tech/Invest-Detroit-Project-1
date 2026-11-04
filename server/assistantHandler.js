// Server-side request handler for the chat assistant: the layer that enforces guardrails.
//
// Invest Detroit's backend (or any server in front of a real AI model) should route every chat
// request through handleAssistantRequest(). The browser runs the same guardrails first, but
// this is the copy a direct API request cannot skip:
//
//   1. Validate: rebuild the request from known fields only, with size limits. Field context
//      comes from our field definition by id, never from text the caller sends.
//   2. Redact SSNs and account numbers (a message containing one is not answered at all).
//   3. Guardrails decide allow / reject / clarify / integrity BEFORE any model call.
//   4. Answer (field guide today, a model later) with fixed system instructions; documents are
//      screened and wrapped as untrusted data.
//   5. Check the answer on the way out (leaked instructions or keys are replaced).
// Nothing is stored: no message, answer or document text is written anywhere.

import { evaluateWithClassifier, guardrailReply, OUT_OF_SCOPE_MESSAGE } from '../src/copilot/guardrails/index.js'
import { screenDocument, wrapUntrustedDocument } from '../src/copilot/guardrails/documents.js'
import { redactSensitive } from '../src/copilot/privacy.js'
import { fieldContext, FIELDS_BY_ID } from '../src/copilot/formDefinition.js'
import { PROGRAM, ASSISTANT } from '../src/copilot/config.js'
import { PRIVACY_WARNING } from '../src/copilot/assistant.js'
import { answerFromGuide } from '../src/copilot/guideTransport.js'
import { SYSTEM_PROMPT, PROMPT_CANARY } from './systemPrompt.js'

export const LIMITS = { message: 2000, historyItems: 20, historyText: 4000, documents: 3, documentChars: 20000, answer: 6000 }
const LOCALES = new Set(['en-US', 'es-US', 'ar', 'bn', 'zh-Hans'])
const INTENTS = new Set(['explain_field'])
const SECRET_LIKE = /\b(sk|pk|hnk|rk)[-_][A-Za-z0-9_-]{16,}\b|\bBearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/

const fail = (status, code, message) => ({ status, body: { error: { code, message } } })

/** Rebuilds a safe request from an untrusted body, or explains why it is invalid. */
export function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: fail(400, 'invalid_body', 'Expected a JSON object.') }
  const { message } = body
  if (typeof message !== 'string' || !message.trim()) return { error: fail(400, 'invalid_message', 'message must be a non-empty string.') }
  if (message.length > LIMITS.message) return { error: fail(413, 'message_too_long', `message is limited to ${LIMITS.message} characters.`) }

  const rawHistory = Array.isArray(body.history) ? body.history.slice(-LIMITS.historyItems) : []
  const history = rawHistory
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string')
    .slice(-ASSISTANT.history_window)
    .map((h) => ({ role: h.role, text: redactSensitive(h.text.slice(0, LIMITS.historyText)).text }))

  // Only a known field id is accepted; its label and help come from our own definition.
  const fieldId = typeof body.field?.field_id === 'string' && FIELDS_BY_ID[body.field.field_id] ? body.field.field_id : null
  const locale = LOCALES.has(body.locale) ? body.locale : PROGRAM.locale
  const intent = INTENTS.has(body.intent) ? body.intent : null

  const documents = (Array.isArray(body.documents) ? body.documents : []).slice(0, LIMITS.documents)
    .filter((d) => d && typeof d.text === 'string')
    .map((d) => ({ name: typeof d.name === 'string' ? d.name.slice(0, 120) : 'document', ...screenDocument(d.text.slice(0, LIMITS.documentChars)) }))

  return { request: { message, history, fieldId, field: fieldId ? fieldContext(fieldId) : null, locale, intent, documents } }
}

/** What a model would receive: fixed instructions first, untrusted material clearly marked as data. */
export function buildModelInput(request, messageForAnswer) {
  const docs = request.documents.map((d) => wrapUntrustedDocument(d.name, d.text)).join('\n\n')
  const field = request.field ? `The applicant is on this question: ${JSON.stringify({ id: request.field.field_id, label: request.field.field_label, help: request.field.help_text })}` : ''
  return {
    system: SYSTEM_PROMPT,
    messages: [
      ...request.history.map((h) => ({ role: h.role, content: h.text })),
      { role: 'user', content: [field, docs, `Applicant's question (untrusted input): ${messageForAnswer}`].filter(Boolean).join('\n\n') },
    ],
    locale: request.locale,
  }
}

/** Replaces an answer that leaks instructions or secrets, or is unreasonably long. */
export function checkOutput(reply) {
  const text = typeof reply?.text === 'string' ? reply.text : ''
  const leaked = text.includes(PROMPT_CANARY) || text.includes(SYSTEM_PROMPT.slice(0, 80)) || SECRET_LIKE.test(text)
  if (leaked || text.length > LIMITS.answer) {
    return { kind: 'out_of_scope', text: OUT_OF_SCOPE_MESSAGE, sources: [], needs_staff: false, english_only: false, guardrail: { action: 'reject', category: 'output_blocked' } }
  }
  return { ...reply, text: redactSensitive(text).text }
}

/** Default answerer: the field guide, using the same request contract as the browser. */
export const guideAnswerer = async ({ request, messageForAnswer }) =>
  answerFromGuide({ ...PROGRAM, locale: request.locale, intent: request.intent, field: request.field, message: messageForAnswer, history: request.history })

/**
 * @param {unknown} body  parsed JSON from the client (untrusted)
 * @param {{ answer?: Function, classifier?: Function, onEvent?: Function }} [deps]
 *   answer({ request, messageForAnswer, modelInput }) -> reply; classifier is optional (see guardrails)
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function handleAssistantRequest(body, { answer = guideAnswerer, classifier = null, onEvent = () => {} } = {}) {
  const { request, error } = validateRequest(body)
  if (error) return error

  if (redactSensitive(request.message).found.length) {
    onEvent({ type: 'server_privacy_block' })
    return { status: 200, body: { reply: { kind: 'privacy_warning', text: PRIVACY_WARNING, sources: [], needs_staff: false } } }
  }

  // Documents never influence this decision: only the applicant's message and recent turns do.
  const decision = await evaluateWithClassifier({ message: request.message, history: request.history, fieldId: request.fieldId, intent: request.intent }, classifier)
  onEvent({ type: 'server_guardrail', action: decision.action, category: decision.category })
  if (decision.action !== 'allow') return { status: 200, body: { reply: guardrailReply(decision) } }

  const messageForAnswer = decision.message_for_answer ?? request.message
  try {
    const raw = await answer({ request, messageForAnswer, modelInput: buildModelInput(request, messageForAnswer) })
    return { status: 200, body: { reply: checkOutput(raw) } }
  } catch {
    return fail(502, 'answer_failed', 'The assistant could not answer right now.')
  }
}
