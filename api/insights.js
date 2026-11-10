// Vercel function: GET /api/insights, the team's dashboard (Render serves it at /insights).
import { insightsHandler } from '../server/insights.js'
import { getStore } from '../server/store.js'

export default function handler(req, res) {
  return insightsHandler(req, res, getStore())
}
