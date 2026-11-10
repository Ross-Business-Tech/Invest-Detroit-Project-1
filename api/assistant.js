// Vercel serverless function: POST /api/assistant
//
// Every chat question goes through handleAssistantRequest() (validation, privacy, guardrails,
// output check). With ANTHROPIC_API_KEY set in Vercel's environment variables, allowed questions
// are answered by Claude; without it, or if Claude can't be reached, by the built-in field guide.
// Nothing is stored. Logs record only counts and outcomes, never what applicants typed.

import { handleAssistantRequest, guideAnswerer } from '../server/assistantHandler.js'
import { createClaudeAnswerer } from '../server/claudeAnswerer.js'

const MAX_BODY = 64 * 1024
const PER_MINUTE = Number(process.env.ASSISTANT_RATE_LIMIT) || 20
const hits = new Map() // per-IP counts for this server instance only (a basic brake, not a guarantee)

let claude = null
const log = (event) => console.log(JSON.stringify({ at: 'assistant', ...event }))

/** Claude when the key is set, the field guide otherwise or if Claude fails. */
async function answer(input) {
  if (!process.env.ANTHROPIC_API_KEY) return { ...(await guideAnswerer(input)), from: 'field_guide' }
  claude ??= createClaudeAnswerer({ onEvent: log })
  try {
    return await claude(input)
  } catch (err) {
    log({ type: 'claude_error', status: err?.status ?? null, name: err?.name ?? 'Error' })
    return { ...(await guideAnswerer(input)), from: 'field_guide_fallback' }
  }
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: { code: 'method_not_allowed' } })
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: { code: 'json_required' } })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const minute = Math.floor(Date.now() / 60000)
  const key = `${ip}:${minute}`
  hits.set(key, (hits.get(key) || 0) + 1)
  for (const k of hits.keys()) if (!k.endsWith(`:${minute}`)) hits.delete(k)
  if (hits.get(key) > PER_MINUTE) return res.status(429).json({ error: { code: 'rate_limited' } })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { return res.status(400).json({ error: { code: 'invalid_json' } }) } }
  if (JSON.stringify(body ?? null).length > MAX_BODY) return res.status(413).json({ error: { code: 'body_too_large' } })

  const { status, body: out } = await handleAssistantRequest(body, { answer })
  log({ type: 'request', status, kind: out?.reply?.kind ?? null, from: out?.reply?.from ?? null })
  return res.status(status).json(out)
}
