// Chat endpoint: POST /api/assistant (Vercel runs this file; Render runs it via server/webServer.js)
//
// Every chat question goes through handleAssistantRequest() (validation, privacy, guardrails,
// output check). With OPENAI_API_KEY set, allowed questions are answered by OpenAI (or by Claude
// if only ANTHROPIC_API_KEY is set; see server/aiProvider.js). Without a key, if the AI service
// fails, or once a daily limit is reached, the built-in field guide answers.
// Nothing is stored except counts (see server/store.js). Logs record only outcomes.
//
// Limits (environment variables, optional):
//   ASSISTANT_RATE_LIMIT        questions per minute from one visitor (default 20)
//   ASSISTANT_VISITOR_DAILY     AI answers per visitor per day (default 60)
//   ASSISTANT_DAILY_LIMIT       AI answers per day for the whole site (default 500)
// Per-day limits survive restarts when DATABASE_URL is set. Set a monthly budget limit in the
// OpenAI dashboard as well: it is the cap that cannot be bypassed.

import crypto from 'node:crypto'
import { handleAssistantRequest, guideAnswerer } from '../server/assistantHandler.js'
import { aiProvider, createAnswerer } from '../server/aiProvider.js'
import { getStore } from '../server/store.js'
import { recordChat } from '../server/insights.js'

const MAX_BODY = 64 * 1024
const num = (name, fallback) => Number(process.env[name]) || fallback
const hits = new Map() // per-minute counts in memory (a short-term brake)

const answerers = {} // one per AI service, created on first use
const log = (event) => console.log(JSON.stringify({ at: 'assistant', ...event }))

// Visitors are counted by a one-way hash of their IP and the date, so no IP is ever stored and
// yesterday's counts can't be linked to today's.
const SALT = process.env.ASSISTANT_SALT || crypto.randomBytes(16).toString('hex')
const visitorKey = (ip) => 'visitor:' + crypto.createHash('sha256').update(`${SALT}|${new Date().toISOString().slice(0, 10)}|${ip}`).digest('hex').slice(0, 20)

/** An answer function for one request: the AI service within the limits, the field guide otherwise. */
function answerFor(ip, store) {
  return async (input) => {
    const provider = aiProvider()
    if (!provider) return { ...(await guideAnswerer(input)), from: 'field_guide' }
    const [mine, all] = await Promise.all([store.get(visitorKey(ip)), store.get('ai:daily')])
    if (mine >= num('ASSISTANT_VISITOR_DAILY', 60) || all >= num('ASSISTANT_DAILY_LIMIT', 500)) {
      await store.incr(mine >= num('ASSISTANT_VISITOR_DAILY', 60) ? 'limit:visitor_daily' : 'limit:site_daily')
      log({ type: 'limit_reached', scope: mine >= num('ASSISTANT_VISITOR_DAILY', 60) ? 'visitor' : 'site' })
      return { ...(await guideAnswerer(input)), from: 'field_guide_limit' }
    }
    answerers[provider] ??= createAnswerer(provider, { onEvent: log })
    try {
      const reply = await answerers[provider](input)
      await Promise.all([store.incr(visitorKey(ip)), store.incr('ai:daily')])
      return reply
    } catch (err) {
      // Only the status and error type are logged (e.g. 401 = wrong key, 404/403 = model not allowed).
      // For a rejected request (400) the service's short explanation is logged too; it describes the
      // request settings, not what the applicant typed.
      log({ type: 'ai_error', provider, status: err?.status ?? null, name: err?.name ?? 'Error', code: err?.code ?? null, ...(err?.status === 400 ? { detail: String(err?.error?.message || err?.message || '').slice(0, 200) } : {}) })
      await store.incr(`ai_error:${err?.status ?? 'network'}`)
      return { ...(await guideAnswerer(input)), from: 'field_guide_fallback' }
    }
  }
}

export default async function handler(req, res, { store = getStore() } = {}) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: { code: 'method_not_allowed' } })
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: { code: 'json_required' } })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const minute = Math.floor(Date.now() / 60000)
  const key = `${ip}:${minute}`
  hits.set(key, (hits.get(key) || 0) + 1)
  for (const k of hits.keys()) if (!k.endsWith(`:${minute}`)) hits.delete(k)
  if (hits.get(key) > num('ASSISTANT_RATE_LIMIT', 20)) return res.status(429).json({ error: { code: 'rate_limited' } })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { return res.status(400).json({ error: { code: 'invalid_json' } }) } }
  if (JSON.stringify(body ?? null).length > MAX_BODY) return res.status(413).json({ error: { code: 'body_too_large' } })

  // With an AI service connected, unclear questions go to it (it can still decline) instead of
  // getting the clarifying question. Clearly off-topic or unsafe requests are refused either way.
  const { status, body: out } = await handleAssistantRequest(body, { answer: answerFor(ip, store), lenientScope: !!aiProvider() })
  log({ type: 'request', status, kind: out?.reply?.kind ?? null, from: out?.reply?.from ?? null })
  await recordChat(store, { body, out })
  return res.status(status).json(out)
}
