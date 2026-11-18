// Vercel function: GET /api/usage, the counts by day for Invest Detroit's data pipeline
// (Render serves the same handler from server/webServer.js). Needs USAGE_EXPORT_TOKEN.
import { usageHandler } from '../server/usage.js'
import { getStore } from '../server/store.js'

export default function handler(req, res) {
  return usageHandler(req, res, getStore())
}
