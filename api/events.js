// Vercel function: POST /api/events (Render serves the same handler from server/webServer.js).
import { eventsHandler } from '../server/usage.js'
import { getStore } from '../server/store.js'

export default function handler(req, res) {
  return eventsHandler(req, res, getStore())
}
