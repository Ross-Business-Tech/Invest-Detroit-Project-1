import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createWebServer } from '../server/webServer.js'

// Needs a build (npm run build); skipped when dist/ isn't there.
const built = fs.existsSync(new URL('../dist/index.html', import.meta.url))

test('the Render web server serves the site, the chat endpoint and nothing outside dist/', { skip: !built && 'run npm run build first' }, async () => {
  const saved = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  const server = createWebServer().listen(0)
  const base = `http://localhost:${server.address().port}`
  try {
    const home = await fetch(base + '/')
    assert.equal(home.status, 200)
    assert.match(await home.text(), /<div id="root">/)
    assert.equal((await fetch(base + '/healthz')).status, 200)
    assert.equal((await fetch(base + '/assets/does-not-exist.js')).status, 404)
    assert.equal((await fetch(base + '/..%2F..%2Fpackage.json')).status, 403)
    const chat = await fetch(base + '/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'What does AMI mean?' }) })
    const out = await chat.json()
    assert.equal(chat.status, 200)
    assert.equal(out.reply.from, 'field_guide')
    assert.match(out.reply.text, /Area Median Income/)
  } finally {
    server.close()
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved
  }
})

test('text files are sent compressed when the browser accepts it', { skip: !built && 'run npm run build first' }, async () => {
  const server = createWebServer().listen(0)
  const base = `http://localhost:${server.address().port}`
  try {
    const html = await (await fetch(base + '/')).text()
    const script = html.match(/src="(\/assets\/[^"]+\.js)"/)[1]
    const { default: http } = await import('node:http')
    const head = (enc) => new Promise((resolve) => http.get(base + script, { headers: { 'accept-encoding': enc } }, (r) => { r.resume(); resolve(r.headers) }))
    assert.equal((await head('br, gzip')) ['content-encoding'], 'br')
    assert.equal((await head('gzip'))['content-encoding'], 'gzip')
    assert.equal((await head('identity'))['content-encoding'], undefined)
  } finally { server.close() }
})

test('Invest Detroit\'s website may call the API; other websites may not', async () => {
  const saved = { ...process.env }
  delete process.env.OPENAI_API_KEY; delete process.env.ANTHROPIC_API_KEY
  const server = createWebServer({ origins: ['https://www.investdetroit.com'] }).listen(0)
  const base = `http://localhost:${server.address().port}`
  const ask = (origin, method = 'POST') => fetch(base + '/api/assistant', { method, headers: { 'content-type': 'application/json', origin }, body: method === 'POST' ? JSON.stringify({ message: 'What does AMI mean?' }) : undefined })
  try {
    const pre = await ask('https://www.investdetroit.com', 'OPTIONS')
    assert.equal(pre.status, 204)
    assert.equal(pre.headers.get('access-control-allow-origin'), 'https://www.investdetroit.com')
    assert.match(pre.headers.get('access-control-allow-headers'), /content-type/)
    const ok = await ask('https://www.investdetroit.com')
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://www.investdetroit.com')
    assert.equal((await ask('https://evil.example')).status, 403)
    assert.equal((await ask(base)).status, 200) // the site's own pages, as before
  } finally {
    server.close()
    process.env = saved
  }
})

test('ALLOWED_ORIGINS sets the list; the default is investdetroit.com', async () => {
  const { allowedOrigins, DEFAULT_ALLOWED_ORIGINS } = await import('../server/webServer.js')
  assert.deepEqual(allowedOrigins({}), DEFAULT_ALLOWED_ORIGINS)
  assert.deepEqual(allowedOrigins({ ALLOWED_ORIGINS: 'https://a.org/, https://b.org' }), ['https://a.org', 'https://b.org'])
})
