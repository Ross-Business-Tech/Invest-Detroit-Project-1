// Minimal HTTP wrapper around the guarded handler (Node built-ins only), for local testing and
// as a reference for Invest Detroit's backend. Not deployed on here.now, which hosts static files.
//
//   node server/httpServer.js            # POST http://localhost:8787/api/assistant
//
// Accepts JSON only, caps body size, allows only listed origins, and keeps a small per-IP rate
// limit in memory (counts only; no request content is kept).

import http from 'node:http'
import { handleAssistantRequest } from './assistantHandler.js'

export function createAssistantServer({ allowedOrigins = [], rateLimitPerMinute = 30, deps = {} } = {}) {
  const hits = new Map()
  return http.createServer(async (req, res) => {
    const send = (status, body, extra = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra })
      res.end(JSON.stringify(body))
    }
    const origin = req.headers.origin
    const cors = origin && allowedOrigins.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}
    if (req.method === 'OPTIONS') return send(204, {}, { ...cors, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' })
    if (req.url !== '/api/assistant' || req.method !== 'POST') return send(404, { error: { code: 'not_found' } })
    if (origin && !cors['access-control-allow-origin']) return send(403, { error: { code: 'origin_not_allowed' } })
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(415, { error: { code: 'json_required' } })

    const ip = req.socket.remoteAddress || 'unknown'
    const minute = Math.floor(Date.now() / 60000)
    const key = `${ip}:${minute}`
    hits.set(key, (hits.get(key) || 0) + 1)
    for (const k of hits.keys()) if (!k.endsWith(`:${minute}`)) hits.delete(k)
    if (hits.get(key) > rateLimitPerMinute) return send(429, { error: { code: 'rate_limited' } }, cors)

    let size = 0
    const chunks = []
    for await (const chunk of req) {
      size += chunk.length
      if (size > 64 * 1024) return send(413, { error: { code: 'body_too_large' } }, cors)
      chunks.push(chunk)
    }
    let body
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return send(400, { error: { code: 'invalid_json' } }, cors) }
    const { status, body: out } = await handleAssistantRequest(body, deps)
    send(status, out, cors)
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 8787
  createAssistantServer({ allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean) })
    .listen(port, () => console.log(`Assistant API on http://localhost:${port}/api/assistant`))
}
