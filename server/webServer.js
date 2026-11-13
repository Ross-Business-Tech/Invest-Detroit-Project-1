// One Node server for hosts that run a long-lived process (Render "Web Service"): serves the
// built website from dist/ and the chat endpoint POST /api/assistant (the same function Vercel
// runs, so guardrails, the AI service and the field-guide fallback behave identically).
//
//   npm run build && npm start        # http://localhost:3000 (Render sets PORT itself)
//
// The AI key is read from OPENAI_API_KEY (or ANTHROPIC_API_KEY) by api/assistant.js.
//
// Calls from Invest Detroit's own website: the add-on on investdetroit.com calls /api/* on this
// server from another web address, which browsers only allow when the server says so (CORS).
// ALLOWED_ORIGINS lists those addresses, comma-separated; the default allows investdetroit.com.

import { aiProvider, PROVIDER_NAME } from './aiProvider.js'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import assistant from '../api/assistant.js'
import { getStore } from './store.js'
import { eventsHandler, feedbackHandler, usageHandler } from './usage.js'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const MAX_BODY = 64 * 1024
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
}

/** Adapts Node's request/response to the small Vercel-style API the functions expect. */
async function runJson(req, res, fn) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) { res.writeHead(413, { 'content-type': 'application/json' }); return res.end('{"error":{"code":"body_too_large"}}') }
    chunks.push(chunk)
  }
  let body = Buffer.concat(chunks).toString('utf8')
  if (String(req.headers['content-type'] || '').startsWith('application/json')) {
    try { body = JSON.parse(body) } catch { res.writeHead(400, { 'content-type': 'application/json' }); return res.end('{"error":{"code":"invalid_json"}}') }
  }
  const out = {
    setHeader: (k, v) => res.setHeader(k, v),
    status: (code) => { res.statusCode = code; return out },
    json: (payload) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(payload)); return out },
  }
  return fn({ method: req.method, headers: req.headers, body }, out)
}

// Text files are compressed once (Brotli or gzip) and kept in memory: the app's main script
// shrinks from about 600 KB to under 200 KB, which matters most on phones.
const COMPRESSIBLE = /\.(html|js|css|json|svg|txt)$/
const compressed = new Map()
function encodedBody(file, acceptEncoding) {
  if (!COMPRESSIBLE.test(file)) return null
  const enc = /\bbr\b/.test(acceptEncoding) ? 'br' : /\bgzip\b/.test(acceptEncoding) ? 'gzip' : null
  if (!enc) return null
  const key = `${enc}:${file}`
  if (!compressed.has(key)) {
    const raw = fs.readFileSync(file)
    compressed.set(key, enc === 'br'
      ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
      : zlib.gzipSync(raw, { level: 9 }))
  }
  return { enc, body: compressed.get(key) }
}

/** Serves a file from dist/, or index.html for unknown paths (the app has one page). */
function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end() }
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = path.normalize(path.join(DIST, urlPath))
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end() } // no ../ escapes
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) {
    // A missing built file is a real 404; any other unknown path gets the app's page.
    if (urlPath.startsWith('/assets/') || path.extname(urlPath)) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found') }
    file = path.join(DIST, 'index.html')
  }
  const ext = path.extname(file).toLowerCase()
  const packed = encodedBody(file, String(req.headers['accept-encoding'] || ''))
  res.writeHead(200, {
    'content-type': TYPES[ext] || 'application/octet-stream',
    ...(packed ? { 'content-encoding': packed.enc, 'content-length': packed.body.length } : {}),
    vary: 'Accept-Encoding',
    // Built assets have content hashes in their names, so they can be cached for a long time.
    'cache-control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  })
  if (req.method === 'HEAD') return res.end()
  if (packed) return res.end(packed.body)
  fs.createReadStream(file).pipe(res)
}

export const DEFAULT_ALLOWED_ORIGINS = ['https://investdetroit.com', 'https://www.investdetroit.com']

export function allowedOrigins(env = process.env) {
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
  return list.length ? list : DEFAULT_ALLOWED_ORIGINS
}

/**
 * CORS for /api/*: same-site calls pass as before; calls from a listed website get the
 * headers browsers need; calls from any other website are refused. Returns true when handled.
 */
function corsFor(req, res, origins) {
  const origin = req.headers.origin
  if (!origin) return false
  const self = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`
  if (origin === self) return false
  if (!origins.includes(origin)) {
    res.writeHead(403, { 'content-type': 'application/json' })
    res.end('{"error":{"code":"origin_not_allowed"}}')
    return true
  }
  res.setHeader('access-control-allow-origin', origin)
  res.setHeader('vary', 'Origin')
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' })
    res.end()
    return true
  }
  return false
}

export function createWebServer({ origins = allowedOrigins() } = {}) {
  return http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://x').pathname
    const fail = () => { if (!res.headersSent) { res.writeHead(500); res.end() } }
    if (pathname.startsWith('/api/') && corsFor(req, res, origins)) return undefined
    if (pathname === '/api/assistant') return runJson(req, res, (rq, rs) => assistant(rq, rs)).catch(fail)
    if (pathname === '/api/events') return runJson(req, res, (rq, rs) => eventsHandler(rq, rs, getStore())).catch(fail)
    if (pathname === '/api/feedback') return runJson(req, res, (rq, rs) => feedbackHandler(rq, rs, getStore())).catch(fail)
    if (pathname === '/api/usage') return runJson(req, res, (rq, rs) => usageHandler({ ...rq, url: req.url }, rs, getStore())).catch(fail)
    if (pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok') }
    return serveStatic(req, res)
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/ is missing: run "npm run build" first.')
    process.exit(1)
  }
  const port = Number(process.env.PORT) || 3000
  const server = createWebServer().listen(port, () => console.log(`Site and assistant on port ${port}${aiProvider() ? ` (${PROVIDER_NAME[aiProvider()]} on)` : ' (no API key: field-guide answers)'}`))
  // Render stops the old server with SIGTERM when a new version goes live: finish open requests first.
  const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 10000).unref() }
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
}
