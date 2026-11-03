// Add-on script for Invest Detroit's live "Need Support?" page.
//
// Built to dist/embed/copilot.js by `npm run build`. Load it on the page that hosts the
// FormAssembly intake form:
//
//   <script src="https://…/embed/copilot.js" defer
//           data-launcher-bottom="84px"                 (optional: lift the chat button)
//           data-assistant-endpoint="https://…"           (optional: connect a real AI)
//           data-locale="es"></script>                   (optional: otherwise follows <html lang>)
//
// What it does:
//   1. Waits for FormAssembly form 4907942 to appear on the page.
//   2. Adds the "Review My Application" panel just above the form's own Submit button, and
//      locks Submit until a review passes.
//   3. Adds the "Need help?" chat button in the corner.
// It only reads the form. It never fills in, changes or submits answers.
//
// Fail-safe: if anything goes wrong (form not found, a bug, a changed form), the add-on removes
// itself and unlocks Submit, so the official form always keeps working on its own.
//
// Its screens live inside shadow roots, so its styles and the page's styles can't affect each other.

import { createRoot } from 'react-dom/client'
import css from '../components/copilot.css?inline'
import { FailSafe, EmbeddedReview, EmbeddedChat, PageLanguage } from './EmbeddedApps.jsx'
import { localeFromLang } from '../copilot/i18n/index.js'
import { createFormAssemblyAdapter } from '../copilot/adapters/formAssemblyAdapter.js'
import { FORM_ASSEMBLY_FORM_ID, FORM_ASSEMBLY_SUBMIT_ID } from '../copilot/adapters/formAssemblyMap.js'
import { createReviewSession } from '../copilot/reviewSession.js'
import { createAssistant, httpTransport, transportFromConfig } from '../copilot/assistant.js'
import { track } from '../copilot/events.js'
import { PROGRAM } from '../copilot/config.js'
import { CONNECTED_SUBTITLE } from '../components/chatText.js'

export const VERSION = '0.1.0'

// Settings from the <script> tag. document.currentScript only exists while this file first runs.
const scriptTag = typeof document !== 'undefined' ? document.currentScript : null
const SETTINGS = {
  autoMount: scriptTag?.dataset.autoMount !== 'false',
  launcherBottom: scriptTag?.dataset.launcherBottom || null,
  assistantEndpoint: scriptTag?.dataset.assistantEndpoint || null,
  waitMs: Number(scriptTag?.dataset.waitMs) || 15000,
  locale: scriptTag?.dataset.locale ? localeFromLang(scriptTag.dataset.locale) : null, // default: follow the page
}

function makeHost(className) {
  const host = document.createElement('div')
  host.className = className
  host.setAttribute('data-invest-detroit-copilot', VERSION)
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
  const mountPoint = document.createElement('div')
  shadow.append(style, mountPoint)
  return { host, mountPoint }
}

function waitForForm(formId, timeoutMs) {
  const find = () => document.getElementById(formId)
  if (find()) return Promise.resolve(find())
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (find()) { observer.disconnect(); clearTimeout(timer); resolve(find()) }
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
    const timer = setTimeout(() => { observer.disconnect(); resolve(null) }, timeoutMs)
  })
}

let mounted = null

/** Attach the copilot to the form. Safe to call more than once. */
export async function mount(options = {}) {
  if (mounted) return mounted
  const opts = { ...SETTINGS, ...options }
  const form = await waitForForm(options.formId || FORM_ASSEMBLY_FORM_ID, opts.waitMs)
  if (!form) {
    track({ type: 'embed_form_not_found' })
    return null
  }

  const cleanups = []
  let guardOn = true
  const failOpen = (error) => {
    guardOn = false
    for (const fn of cleanups.splice(0)) { try { fn() } catch { /* keep cleaning up */ } }
    const submit = form.querySelector(`#${FORM_ASSEMBLY_SUBMIT_ID}`)
    if (submit) submit.disabled = false
    mounted = null
    track({ type: 'embed_failed_open' })
    if (error) console.warn('[Invest Detroit copilot] Turned off; the form works as normal.', error)
  }

  try {
    const adapter = createFormAssemblyAdapter({ root: form })
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const session = createReviewSession({ getSnapshot: adapter.getSnapshot, stepMs: reduce ? 120 : 650, onEvent: track })
    const assistant = createAssistant({
      transport: opts.assistantEndpoint ? httpTransport(opts.assistantEndpoint) : transportFromConfig(),
      onEvent: track,
    })

    // Review panel, just above the form's Submit button.
    const submit = form.querySelector(`#${FORM_ASSEMBLY_SUBMIT_ID}`)
    const anchor = document.getElementById(`${form.id}-A`) || submit
    if (!anchor) throw new Error('Submit button not found')
    const review = makeHost('idc-review-host')
    anchor.parentNode.insertBefore(review.host, anchor)
    const reviewRoot = createRoot(review.mountPoint)
    reviewRoot.render(<FailSafe onError={failOpen}><PageLanguage fixed={opts.locale}><EmbeddedReview session={session} adapter={adapter} onError={failOpen} /></PageLanguage></FailSafe>)
    cleanups.push(() => reviewRoot.unmount(), () => review.host.remove())

    // Chat button in the corner.
    const chat = makeHost('idc-chat-host')
    if (opts.launcherBottom) {
      chat.host.style.setProperty('--cp-launcher-bottom', opts.launcherBottom)
      chat.host.style.setProperty('--cp-launcher-bottom-phone', opts.launcherBottom)
    }
    document.body.append(chat.host)
    const chatRoot = createRoot(chat.mountPoint)
    const subtitle = opts.assistantEndpoint ? CONNECTED_SUBTITLE : undefined
    chatRoot.render(<FailSafe onError={failOpen}><PageLanguage fixed={opts.locale}><EmbeddedChat assistant={assistant} adapter={adapter} subtitle={subtitle} /></PageLanguage></FailSafe>)
    cleanups.push(() => chatRoot.unmount(), () => chat.host.remove())

    // Lock Submit until a review passes, and re-lock when an answer changes.
    cleanups.push(session.subscribe((s) => adapter.setSubmitEnabled(s.canSubmit)))
    cleanups.push(adapter.subscribe(() => session.invalidate()))
    adapter.setSubmitEnabled(false)

    // Backup lock: some form scripts re-enable their button, so also stop the submit itself.
    const guard = (e) => {
      if (!guardOn || e.target !== form || session.getState().canSubmit) return
      e.preventDefault()
      e.stopImmediatePropagation()
      review.host.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    document.addEventListener('submit', guard, true)
    cleanups.push(() => document.removeEventListener('submit', guard, true), () => session.dispose())

    track({ type: 'embed_mounted', version: VERSION, form_version: PROGRAM.form_version })
    mounted = { session, adapter, unmount: () => failOpen(null) }
    return mounted
  } catch (error) {
    failOpen(error)
    return null
  }
}

export function unmount() {
  mounted?.unmount()
}

if (typeof window !== 'undefined') {
  window.InvestDetroitCopilot = { mount, unmount, version: VERSION }
  if (SETTINGS.autoMount) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount())
    else mount()
  }
}
