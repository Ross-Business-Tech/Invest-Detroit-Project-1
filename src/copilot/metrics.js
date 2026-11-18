// Sends privacy-safe usage counts to our server (/api/events), only on hosts that run it.
// Each event is a type and a key such as { type: 'review_issue', key: 'loan_gt_budget' }:
// never an answer, a message, a note or a file. See server/usage.js for what is accepted.
import { onTrack } from './events.js'
import { onServerHost } from './hosting.js'

/** Our app events -> the server's counted events. Anything else is not sent. */
export function toCounted(e) {
  switch (e?.type) {
    case 'review_completed': return [
      { type: 'review_result', key: e.can_submit ? 'passed' : 'blocked' },
      ...(e.issue_ids || []).slice(0, 25).map((id) => ({ type: 'review_issue', key: String(id) })),
    ]
    case 'form_started': return [{ type: 'form', key: 'start' }]
    case 'form_submitted': return [{ type: 'form', key: 'submit' }]
    case 'form_left': return e.section ? [{ type: 'form_exit', key: e.section }] : []
    case 'field_help': return e.field_id ? [{ type: 'field_help', key: e.field_id }] : []
    default: return []
  }
}

/**
 * Starts sending counts in small batches. Returns a stop function. Does nothing off our server,
 * unless `enabled` is true (the add-on on Invest Detroit's page, which sends to our server).
 */
export function startMetrics({ endpoint = '/api/events', hostname, send, enabled } = {}) {
  if (!(enabled ?? onServerHost(hostname))) return () => {}
  const queue = []
  const post = send || ((payload) => {
    const blob = new Blob([payload], { type: 'application/json' })
    if (!(navigator.sendBeacon && navigator.sendBeacon(endpoint, blob))) {
      fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
    }
  })
  const flush = () => { if (queue.length) post(JSON.stringify({ events: queue.splice(0, 40) })) }
  const off = onTrack((e) => { queue.push(...toCounted(e)); if (queue.length >= 20) flush() })
  const timer = setInterval(flush, 5000)
  const onHide = () => { if (document.visibilityState === 'hidden') flush() }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onHide)
    addEventListener('pagehide', flush)
  }
  return () => { off(); clearInterval(timer); flush(); if (typeof document !== 'undefined') { document.removeEventListener('visibilitychange', onHide); removeEventListener('pagehide', flush) } }
}
