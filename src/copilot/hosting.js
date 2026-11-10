// Where is the site running? Decides which optional services exist:
//   our server (Render / Vercel): Claude chat, ratings and usage counts through /api/*
//   here.now: ratings through here.now Site Data; no server code
//   anywhere else (e.g. the add-on on Invest Detroit's page): none of these unless configured
import { ASSISTANT, FEEDBACK } from './config.js'

const currentHost = () => (typeof location !== 'undefined' ? location.hostname : '')
const matches = (hosts, hostname) => !!hostname && (hosts || []).some((h) => hostname === h.replace(/^\./, '') || hostname.endsWith(h))

export const onServerHost = (hostname = currentHost()) => matches(ASSISTANT.server_hosts, hostname)
export const onHereNow = (hostname = currentHost()) => matches(FEEDBACK.hosts, hostname)
export { matches as hostMatches }
