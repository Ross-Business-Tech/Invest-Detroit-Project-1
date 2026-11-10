// Daily counters for usage insights, star ratings and spending limits. Counts only: never
// messages, answers, notes, names or raw IP addresses.
//
// With DATABASE_URL set (for example a Render Postgres database), counts survive restarts.
// Without it they live in memory and reset whenever the server restarts or sleeps; fine for
// testing, not for a pilot.

import pg from 'pg'

const today = (d = new Date()) => d.toISOString().slice(0, 10)
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
  }
}

/** A store that never throws: if the database is down, counting is skipped, not the request. */
function safe(store) {
  const guard = (fn, fallback) => async (...args) => { try { return await fn(...args) } catch (err) { console.error(JSON.stringify({ at: 'store', error: err?.code || err?.name || 'error' })); return fallback } }
  return { kind: store.kind, incr: guard(store.incr, 0), get: guard(store.get, 0), totals: guard(store.totals, {}) }
}

let shared = null
export function getStore() {
  shared ??= safe(process.env.DATABASE_URL ? postgresStore(process.env.DATABASE_URL) : memoryStore())
  return shared
}

export const createMemoryStore = () => safe(memoryStore())
