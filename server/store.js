// Daily counters for usage counts, star ratings and spending limits. Counts only: never
// messages, answers, notes, names or raw IP addresses.
//
// For Invest Detroit's data pipeline (docs/DATA-PIPELINE.md):
//   - the table copilot_counts (day, key, count) can be read directly;
//   - daily(days) feeds GET /api/usage (server/usage.js);
//   - with USAGE_WEBHOOK_URL set, each new count is also sent to that address in small JSON
//     batches, signed with USAGE_WEBHOOK_SECRET when set (header X-Copilot-Signature).
//
// With DATABASE_URL set (for example a Render Postgres database), counts survive restarts.
// Without it they live in memory and reset whenever the server restarts or sleeps; fine for
// testing, not for a pilot.

import crypto from 'node:crypto'
import pg from 'pg'

const today = (d = new Date()) => d.toISOString().slice(0, 10)

/** Internal counters that are not usage data (spending limits by hashed visitor, the daily AI total). */
export const isInternalKey = (key) => key.startsWith('visitor:') || key === 'ai:daily' || key === 'claude:daily'
const KEY = /^[a-z0-9_:.-]{1,80}$/

function memoryStore() {
  const days = new Map() // 'YYYY-MM-DD' -> Map(key -> count)
  return {
    kind: 'memory',
    async incr(key, by = 1, day = today()) {
      if (!KEY.test(key)) return 0
      if (!days.has(day)) days.set(day, new Map())
      const m = days.get(day)
      m.set(key, (m.get(key) || 0) + by)
      for (const d of days.keys()) if (d < today(new Date(Date.now() - 400 * 864e5))) days.delete(d)
      return m.get(key)
    },
    async get(key, day = today()) {
      return days.get(day)?.get(key) || 0
    },
    /** Totals per key over the last `sinceDays` days (today included). */
    async totals(sinceDays = 30) {
      const from = today(new Date(Date.now() - (sinceDays - 1) * 864e5))
      const out = {}
      for (const [d, m] of days) if (d >= from) for (const [k, v] of m) out[k] = (out[k] || 0) + v
      return out
    },
    /** Every count by day over the last `sinceDays` days: [{ day, key, count }]. */
    async daily(sinceDays = 30) {
      const from = today(new Date(Date.now() - (sinceDays - 1) * 864e5))
      const rows = []
      for (const [d, m] of days) if (d >= from) for (const [key, count] of m) rows.push({ day: d, key, count })
      return rows.sort((a, b) => a.day.localeCompare(b.day) || a.key.localeCompare(b.key))
    },
  }
}

function postgresStore(url) {
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
  // Render's internal hostnames have no dots and need no TLS; external ones do.
  const pool = new pg.Pool({ connectionString: url, max: 3, ssl: host.includes('.') && host !== 'localhost' ? { rejectUnauthorized: false } : false })
  let ready = null
  const init = () => (ready ??= pool.query(`CREATE TABLE IF NOT EXISTS copilot_counts (
      day date NOT NULL, key text NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (day, key))`)
    .then(() => pool.query("DELETE FROM copilot_counts WHERE day < CURRENT_DATE - INTERVAL '400 days'")))
  return {
    kind: 'postgres',
    async incr(key, by = 1, day = today()) {
      if (!KEY.test(key)) return 0
      await init()
      const r = await pool.query(
        `INSERT INTO copilot_counts (day, key, count) VALUES ($1, $2, $3)
         ON CONFLICT (day, key) DO UPDATE SET count = copilot_counts.count + EXCLUDED.count RETURNING count`, [day, key, by])
      return r.rows[0].count
    },
    async get(key, day = today()) {
      await init()
      const r = await pool.query('SELECT count FROM copilot_counts WHERE day = $1 AND key = $2', [day, key])
      return r.rows[0]?.count || 0
    },
    async totals(sinceDays = 30) {
      await init()
      const r = await pool.query(
        `SELECT key, SUM(count)::int AS count FROM copilot_counts WHERE day >= CURRENT_DATE - ($1::int - 1) GROUP BY key`, [sinceDays])
      return Object.fromEntries(r.rows.map((row) => [row.key, row.count]))
    },
    async daily(sinceDays = 30) {
      await init()
      const r = await pool.query(
        `SELECT to_char(day, 'YYYY-MM-DD') AS day, key, count FROM copilot_counts WHERE day >= CURRENT_DATE - ($1::int - 1) ORDER BY day, key`, [sinceDays])
      return r.rows
    },
  }
}

/**
 * Sends each new count to Invest Detroit's own system (USAGE_WEBHOOK_URL), in batches every few
 * seconds: { source, sent_at, events: [{ day, category, item, added }] }. Fire-and-forget: if their
 * system is down, the counts are still in the database and in GET /api/usage.
 */
export function createWebhookForwarder({ url, secret, fetchImpl = (...a) => fetch(...a), intervalMs = 5000 } = {}) {
  const queue = []
  const flush = async () => {
    if (!queue.length) return
    const body = JSON.stringify({ source: 'invest-detroit-copilot', sent_at: new Date().toISOString(), events: queue.splice(0, 200) })
    const headers = { 'content-type': 'application/json' }
    if (secret) headers['x-copilot-signature'] = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
    try {
      const r = await fetchImpl(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) })
      if (!r.ok) console.error(JSON.stringify({ at: 'usage_webhook', status: r.status }))
    } catch (err) { console.error(JSON.stringify({ at: 'usage_webhook', error: err?.name || 'error' })) }
  }
  const timer = setInterval(flush, intervalMs)
  timer.unref?.()
  return {
    add(key, by, day) {
      if (isInternalKey(key)) return
      const i = key.indexOf(':')
      queue.push({ day, category: key.slice(0, i), item: key.slice(i + 1), added: by })
      if (queue.length >= 200) flush()
    },
    flush,
    stop() { clearInterval(timer) },
  }
}

/** A store that never throws: if the database is down, counting is skipped, not the request. */
function safe(store, forwarder = null) {
  const guard = (fn, fallback) => async (...args) => { try { return await fn(...args) } catch (err) { console.error(JSON.stringify({ at: 'store', error: err?.code || err?.name || 'error' })); return fallback } }
  const incr = guard(store.incr, 0)
  return {
    kind: store.kind,
    async incr(key, by = 1, day = today()) { const n = await incr(key, by, day); if (forwarder && n) forwarder.add(key, by, day); return n },
    get: guard(store.get, 0), totals: guard(store.totals, {}), daily: guard(store.daily, []),
  }
}

let shared = null
export function getStore() {
  if (!shared) {
    const hook = process.env.USAGE_WEBHOOK_URL ? createWebhookForwarder({ url: process.env.USAGE_WEBHOOK_URL, secret: process.env.USAGE_WEBHOOK_SECRET }) : null
    shared = safe(process.env.DATABASE_URL ? postgresStore(process.env.DATABASE_URL) : memoryStore(), hook)
  }
  return shared
}

export const createMemoryStore = (forwarder = null) => safe(memoryStore(), forwarder)
