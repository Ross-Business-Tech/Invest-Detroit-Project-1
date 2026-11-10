// One Node server for hosts that run a long-lived process (Render "Web Service"): serves the
// built website from dist/ and the chat endpoint POST /api/assistant (the same function Vercel
// runs, so guardrails, Claude and the field-guide fallback behave identically).
//
//   npm run build && npm start        # http://localhost:3000 (Render sets PORT itself)
//
// The API key is read from the ANTHROPIC_API_KEY environment variable by api/assistant.js.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assistant from '../api/assistant.js'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const MAX_BODY = 64 * 1024
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
}

/** Adapts Node's request/response to the small Vercel-style API the function expects. */
async function runAssistant(req, res) {
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
  return assistant({ method: req.method, headers: req.headers, body }, out)
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
  res.writeHead(200, {
    'content-type': TYPES[ext] || 'application/octet-stream',
    // Built assets have content hashes in their names, so they can be cached for a long time.
    'cache-control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  })
  if (req.method === 'HEAD') return res.end()
  fs.createReadStream(file).pipe(res)
}

export function createWebServer() {
  return http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://x').pathname
    if (pathname === '/api/assistant') return runAssistant(req, res).catch(() => { if (!res.headersSent) { res.writeHead(500); res.end() } })
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
  createWebServer().listen(port, () => console.log(`Site and assistant on port ${port}${process.env.ANTHROPIC_API_KEY ? ' (Claude on)' : ' (no API key: field-guide answers)'}`))
}
