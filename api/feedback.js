// Vercel function: POST /api/feedback (Render serves the same handler from server/webServer.js).
import { feedbackHandler } from '../server/insights.js'
import { getStore } from '../server/store.js'

export default function handler(req, res) {
  return feedbackHandler(req, res, getStore())
}
