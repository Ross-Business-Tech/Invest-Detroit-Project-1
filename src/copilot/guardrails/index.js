// Guardrails: decides whether a chat message may be answered, BEFORE any answer is produced.
//
// Kept separate from the answering logic (assistant.js, guideTransport.js, a future AI model).
// The same function runs in the browser (prototype) and in the server request handler
// (server/assistantHandler.js), which is where it is enforced for real: the browser check is
// a convenience; the server check is the one a direct API request cannot skip.
//
// Order of checks (first match wins):
//   1. protected  - asks for hidden prompts, keys, configuration or other applicants' data -> reject
//   2. integrity  - asks for help leaving out, changing or making up information          -> integrity
//   3. injection  - tries to change the assistant's rules or role (ignore instructions,
//                   pretend, roleplay, "I'm the developer"). The injected part is ignored;
//                   if nothing on-topic remains                                          -> reject
//   4. off-topic task - jokes, essays, trivia, programming, general chatbot use           -> reject
//   5. on-topic   - application or business-finance terms, or "explain this question"   -> allow
//   6. follow-up  - short follow-up to an on-topic conversation, or about the open question -> allow
//   7. repeated   - several off-topic or unclear messages in a row                       -> reject
//   8. unclear    - otherwise ask a short clarifying question (never reject when unsure),
//                   or reject when it is clearly unrelated
// An optional model-based classifier can settle step 8 cases only (evaluateWithClassifier).

import { normalize, fold, sentences } from './normalize.js'
import {
  INJECTION_PATTERNS, PROTECTED_PATTERNS, INTEGRITY_PATTERNS, OUT_OF_SCOPE_TASKS, APPLICATION_ARTIFACTS,
  IN_SCOPE_STRONG, IN_SCOPE_WEAK, HELP_PHRASES, GREETING_OR_GENERIC,
} from './lexicon.js'
import { OUT_OF_SCOPE_MESSAGE, INTEGRITY_MESSAGE, CLARIFY_MESSAGE, GUARDRAIL_VERSION } from './messages.js'

export { OUT_OF_SCOPE_MESSAGE, INTEGRITY_MESSAGE, CLARIFY_MESSAGE, GUARDRAIL_VERSION }

const LATIN = /^[\p{Script=Latin}\d\s%&'".,!?;:()\-/$]*$/u
const anyMatch = (patterns, text) => patterns.some((re) => re.test(text))

function hasTerm(term, text) {
  if (!LATIN.test(term)) return text.includes(term)
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\d])${esc}($|[^\\p{L}\\d])`, 'u').test(text)
}

/** How strongly the text is about the application or business finance. */
export function scopeScore(text) {
  const t = normalize(text)
  let strong = 0
  let weak = 0
  for (const term of IN_SCOPE_STRONG) if (hasTerm(term, t)) strong += 1
  for (const term of IN_SCOPE_WEAK) if (hasTerm(term, t)) weak += 1
  const help = HELP_PHRASES.test(t)
  return { strong, weak, help, score: strong * 2 + weak + (help ? 2 : 0) }
}

export function offTopicTask(text) {
  const t = fold(text)
  if (APPLICATION_ARTIFACTS.test(t)) return null // e.g. "help me write my executive summary"
  return OUT_OF_SCOPE_TASKS.find((c) => c.re.test(t))?.category || null
}

const isInjection = (s) => anyMatch(INJECTION_PATTERNS, fold(s))

function decide(action, category, extra = {}) {
  return { action, category, version: GUARDRAIL_VERSION, ...extra }
}

/** Recent turns, newest last: did the applicant already ask something on-topic? */
const GUARDRAIL_TEXTS = new Set([OUT_OF_SCOPE_MESSAGE, CLARIFY_MESSAGE, INTEGRITY_MESSAGE])

function recentContext(history = []) {
  const recent = history.slice(-6)
  // A user turn counts as on-topic context only if it was on-topic AND actually answered
  // (not refused), so a refused request can't make the next vague message look like a follow-up.
  const answeredUserTurns = recent
    .map((h, i) => ({ h, next: recent[i + 1] }))
    .filter(({ h, next }) => h.role === 'user' && !(next && next.role === 'assistant' && GUARDRAIL_TEXTS.has(next.text)))
    .map(({ h }) => h)
    .slice(-2)
  const onTopicBefore = answeredUserTurns.some((h) => {
    const s = scopeScore(h.text)
    return (s.strong > 0 || s.help) && !offTopicTask(h.text) && !isInjection(h.text)
      && !INTEGRITY_PATTERNS.some((re) => re.test(normalize(h.text))) && !PROTECTED_PATTERNS.some((re) => re.test(fold(h.text)))
  })
  const assistantTurns = recent.filter((h) => h.role === 'assistant').slice(-3)
  const redirects = assistantTurns.filter((h) => h.text === OUT_OF_SCOPE_MESSAGE || h.text === CLARIFY_MESSAGE).length
  const lastWasRedirect = assistantTurns.length > 0 && [OUT_OF_SCOPE_MESSAGE, CLARIFY_MESSAGE].includes(assistantTurns.at(-1).text)
  return { onTopicBefore, redirects, lastWasRedirect }
}

const wordCount = (t) => normalize(t).split(' ').filter(Boolean).length

/**
 * @param {{ message: string, history?: {role: string, text: string}[], fieldId?: string|null, intent?: string|null, lenient?: boolean }} req
 *   lenient: an AI model that can judge scope will answer (Claude on the server). Unclear or
 *   unrecognized questions are then passed to it instead of getting the clarifying question;
 *   protected, falsifying, injection and clearly off-topic requests are still refused here.
 * @returns {{ action: 'allow'|'reject'|'clarify'|'integrity', category: string, version: string,
 *             message_for_answer?: string, injection_ignored?: boolean }}
 *   message_for_answer is the text the answering step should use (injected parts removed).
 */
export function evaluateRequest({ message, history = [], fieldId = null, intent = null, lenient = false }) {
  const raw = String(message ?? '')
  const t = normalize(raw)
  const f = fold(raw)
  if (!t) return decide('clarify', 'empty')

  // 1. Never reveal internal prompts, keys, configuration or anyone else's data.
  if (anyMatch(PROTECTED_PATTERNS, f) || anyMatch(PROTECTED_PATTERNS, t)) return decide('reject', 'protected')

  // 2. Help to deceive is refused even though it is about the application.
  if (anyMatch(INTEGRITY_PATTERNS, t) || anyMatch(INTEGRITY_PATTERNS, f)) return decide('integrity', 'falsification')

  // 3. Instructions aimed at the assistant are ignored; only the rest of the message is considered.
  let working = raw
  let injectionIgnored = false
  if (isInjection(raw)) {
    const kept = sentences(raw).filter((s) => !isInjection(s)).join(' ')
    injectionIgnored = true
    // Roleplay or rule changes wrapped around an on-topic question: answer only the question.
    if (!kept || offTopicTask(kept) || scopeScore(kept).strong === 0) return decide('reject', 'injection')
    working = kept
  }
  const flags = injectionIgnored ? { injection_ignored: true } : {}

  // The ? button: a known question on the form, explained from the field guide.
  if (intent === 'explain_field' && fieldId && !injectionIgnored) return decide('allow', 'explain_field', { message_for_answer: working })

  // 4. Clearly unrelated tasks.
  const task = offTopicTask(working)
  if (task) return decide('reject', task, flags)

  // 5. On-topic.
  const s = scopeScore(working)
  if (s.strong > 0 || s.help || s.weak >= 2) return decide('allow', s.help ? 'form_help' : 'application', { message_for_answer: working, ...flags })

  // Greetings and "can you help me?" always get the clarifying question.
  if (GREETING_OR_GENERIC.test(t)) return decide('clarify', 'ambiguous', flags)

  // 6. Follow-ups ("what about the second one?", "why?") to an on-topic conversation,
  //    or a vague question while a form question is open.
  const ctx = recentContext(history)
  const short = wordCount(working) <= 12
  if (short && (ctx.onTopicBefore || (fieldId && /\b(this|it|that|mean|explain|example|why|how)\b/.test(t)))) {
    return decide('allow', 'follow_up', { message_for_answer: working, ...flags })
  }

  // 7. Repeatedly steering away from the application.
  if (ctx.redirects >= 2) return decide('reject', 'repeated_off_topic', flags)

  // With a model that judges scope itself, let it decide the unclear cases (it can still decline).
  if (lenient) return decide('allow', 'model_judged', { message_for_answer: working, ...flags })

  // 8. Unclear: ask, unless it is plainly unrelated (several words, none about the application).
  const nonLatin = !LATIN.test(t)
  if (GREETING_OR_GENERIC.test(t) || s.weak === 1 || nonLatin || wordCount(working) <= 3 || ctx.lastWasRedirect) {
    return decide('clarify', 'ambiguous', flags)
  }
  return decide('reject', 'unrelated', flags)
}

/**
 * Same as evaluateRequest, but lets an optional semantic classifier (e.g. a small, cheap model
 * call on the server) settle only the unclear cases. It can never override protected,
 * integrity or injection decisions, so a classifier mistake can't open those doors.
 * @param {(input: {message: string, history: object[]}) => Promise<'in_scope'|'out_of_scope'|'unsure'>} classifier
 */
export async function evaluateWithClassifier(req, classifier) {
  const local = evaluateRequest(req)
  if (!classifier || local.action !== 'clarify' || local.category !== 'ambiguous') return local
  try {
    const verdict = await classifier({ message: String(req.message || ''), history: (req.history || []).slice(-4) })
    if (verdict === 'in_scope') return decide('allow', 'classifier', { message_for_answer: String(req.message), classified: true })
    if (verdict === 'out_of_scope') return decide('reject', 'classifier', { classified: true })
  } catch { /* classifier down: keep the safe local answer */ }
  return local
}

/** The structured reply for anything other than "allow". Same shape as an assistant reply. */
export function guardrailReply(decision) {
  const text = decision.action === 'integrity' ? INTEGRITY_MESSAGE : decision.action === 'clarify' ? CLARIFY_MESSAGE : OUT_OF_SCOPE_MESSAGE
  const kind = decision.action === 'integrity' ? 'integrity' : decision.action === 'clarify' ? 'clarify' : 'out_of_scope'
  return {
    kind,
    text,
    sources: [],
    needs_staff: false,
    english_only: false,
    guardrail: { action: decision.action, category: decision.category, version: decision.version },
  }
}
