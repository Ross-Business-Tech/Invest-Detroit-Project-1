// Add-on script for Invest Detroit's live "Need Support?" page (WordPress + FormAssembly).
//
// Built to dist/embed/copilot.js by `npm run build`, and served by our server at
// https://<server>/embed/copilot.js. Add ONE tag to the page that shows the FormAssembly form
// (in WordPress, or in the form's own custom-code area):
//
//   <script src="https://<server>/embed/copilot.js" defer
//           data-summary-field="tfa_1234"                (recommended: hidden field for the staff summary)
//           data-launcher-bottom="84px"                  (optional: lift the chat button)
//           data-progress-top="80px"                     (optional: room for a sticky site header)
//           data-fill-helpers="true"                     (optional: "same as home address" box, state from ZIP)
//           data-intro="true"                            (optional: "How it works" + "Before you start" above the form)
//           data-theme="copilot"                         (optional: restyle the form to look like the demo site)
//           data-drafts="true"                           (optional: save & resume on this device)
//           data-save-resume="true"                      (optional: say "you can save and finish later", when
//                                                         FormAssembly's own Save & Resume is on)
//           data-load-font="true"                        (optional: load the demo's fonts (Lato, plus Arabic and
//                                                         Bengali) from Google Fonts, if the site doesn't already)
//           data-locale="es"                             (optional: otherwise follows <html lang>)
//           data-server="https://…"                      (optional: our server, if the script is hosted elsewhere;
//                                                         "none" = no server: built-in answers, no ratings or counts)
//           data-assistant-endpoint / data-feedback-endpoint   (optional: override single endpoints)
//   ></script>
//
// What it does:
//   1. Waits for FormAssembly form 4907942 to appear on the page.
//   2. Adds the "Review My Application" panel just above the form's own Submit button, and
//      locks Submit until a review passes.
//   3. Adds the "Need help?" chat in the corner (answers from our server: AI + guardrails, or the
//      built-in knowledge base if the server can't be reached), a ? button next to each question,
//      notes under questions as they're answered, upload tips, file checks and a progress bar.
//   4. Sends anonymous counts (never answers or messages) to our server (/api/events) and chat
//      star ratings to /api/feedback, for Invest Detroit's own data pipeline (docs/DATA-PIPELINE.md).
//      data-events-endpoint="none" stops sending counts to our server.
//   5. Announces the same counts on the page itself, as a browser event named
//      "investdetroit:copilot" (detail: { type, key }), so a site's own analytics or tag manager
//      can collect them directly.
// It reads the form and never submits it. It changes answers only with data-fill-helpers, and
// then only to copy the home address or fill in a state. With data-summary-field, at Submit it
// writes the review summary (for Invest Detroit's staff) into that hidden field.
//
// Fail-safe: if anything goes wrong (form not found, a bug, a changed form), the add-on removes
// itself and unlocks Submit, so the official form always keeps working on its own.
//
// Its screens live inside shadow roots, so its styles and the page's styles can't affect each other.

import { createRoot } from 'react-dom/client'
import baseCss from '../components/copilot.css?inline'
import extrasCss from './extras.css?inline'
import introCss from './intro.css?inline'
import themeCss from './theme.css?inline'
import { clearDraft } from '../prototype/draft.js'
import { FailSafe, EmbeddedApp, PageLanguage } from './EmbeddedApps.jsx'
import { localeFromLang } from '../copilot/i18n/index.js'
import { createFormAssemblyAdapter } from '../copilot/adapters/formAssemblyAdapter.js'
import { FORM_ASSEMBLY_FORM_ID, FORM_ASSEMBLY_SUBMIT_ID, FORM_ASSEMBLY_MAP } from '../copilot/adapters/formAssemblyMap.js'
import { createReviewSession } from '../copilot/reviewSession.js'
import { createAssistant, httpTransport, withFallback } from '../copilot/assistant.js'
import { guideTransport } from '../copilot/guideTransport.js'
import { startMetrics, toCounted } from '../copilot/metrics.js'
import { formProgress } from '../copilot/formHelpers.js'
import { FIELDS_BY_ID } from '../copilot/formDefinition.js'
import { createFeedbackClient } from '../copilot/feedback.js'
import { buildStaffSummary } from '../copilot/staffSummary.js'
import { track, onTrack } from '../copilot/events.js'
import { PROGRAM } from '../copilot/config.js'

export const VERSION = '0.2.0'

// Settings from the <script> tag. document.currentScript only exists while this file first runs.
const scriptTag = typeof document !== 'undefined' ? document.currentScript : null
const data = scriptTag?.dataset || {}
const scriptOrigin = (() => { try { return new URL(scriptTag.src).origin } catch { return null } })()
// Our server (chat, ratings, counts): where this script came from, unless data-server says otherwise.
const server = data.server === 'none' ? null : (data.server || scriptOrigin || '').replace(/\/$/, '') || null
const endpoint = (attr, path) => (attr === 'none' ? null : attr || (server ? server + path : null))
const SETTINGS = {
  autoMount: data.autoMount !== 'false',
  launcherBottom: data.launcherBottom || null,
  progressTop: data.progressTop || '0px',
  assistantEndpoint: endpoint(data.assistantEndpoint, '/api/assistant'),
  feedbackEndpoint: endpoint(data.feedbackEndpoint, '/api/feedback'),
  eventsEndpoint: endpoint(data.eventsEndpoint, '/api/events'),
  waitMs: Number(data.waitMs) || 15000,
  locale: data.locale ? localeFromLang(data.locale) : null, // default: follow the page
  summaryField: data.summaryField || null,
  fillHelpers: data.fillHelpers === 'true',
  intro: data.intro === 'true',
  theme: data.theme || null,
  drafts: data.drafts === 'true',
  saveResume: data.saveResume === 'true',
  loadFont: data.loadFont === 'true',
}
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;700;900&family=Noto+Sans+Bengali:wght@400;700;900&display=swap'

// One copy of the styles, shared by every shadow root (falls back to a <style> per root).
const CSS = baseCss + '\n' + extrasCss + '\n' + introCss
let sharedSheet = null
try { sharedSheet = new CSSStyleSheet(); sharedSheet.replaceSync(CSS) } catch { sharedSheet = null }

function makeHost(className, { inline = false } = {}) {
  const host = document.createElement(inline ? 'span' : 'div')
  host.className = className
  host.setAttribute('data-invest-detroit-copilot', VERSION)
  if (inline) host.style.display = 'inline-block'
  const shadow = host.attachShadow({ mode: 'open' })
  if (sharedSheet && 'adoptedStyleSheets' in shadow) shadow.adoptedStyleSheets = [sharedSheet]
  else { const style = document.createElement('style'); style.textContent = CSS; shadow.append(style) }
  const mountPoint = document.createElement(inline ? 'span' : 'div')
  shadow.append(mountPoint)
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

const cssEscape = (v) => (window.CSS?.escape ? window.CSS.escape(v) : String(v).replace(/[^\w-]/g, '\\$&'))

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
    // The chat asks our server (AI with guardrails); if it can't be reached, the built-in guide answers.
    const transport = opts.assistantEndpoint
      ? Object.assign(withFallback(httpTransport(opts.assistantEndpoint), guideTransport), { lenientScope: true })
      : guideTransport
    const assistant = createAssistant({ transport, onEvent: track })
    const place = (host, insert) => { insert(host.host); cleanups.push(() => host.host.remove()); return host.mountPoint }

    const hosts = { fields: {} }
    // Review panel, just above the form's Submit button.
    const submit = form.querySelector(`#${FORM_ASSEMBLY_SUBMIT_ID}`)
    const anchor = document.getElementById(`${form.id}-A`) || submit
    if (!anchor) throw new Error('Submit button not found')
    hosts.review = place(makeHost('idc-review-host'), (h) => anchor.parentNode.insertBefore(h, anchor))

    // "Submit unlocks after a successful review." just under the form's Submit button.
    hosts.submit = place(makeHost('idc-submit-host'), (h) => anchor.after(h))
    // On translated pages, a short notice above the form that our screens were translated with AI.
    hosts.notice = place(makeHost('idc-notice-host'), (h) => form.insertBefore(h, form.firstChild))

    // Chat button in the corner.
    const chat = makeHost('idc-chat-host')
    if (opts.launcherBottom) {
      chat.host.style.setProperty('--cp-launcher-bottom', opts.launcherBottom)
      chat.host.style.setProperty('--cp-launcher-bottom-phone', opts.launcherBottom)
    }
    hosts.chat = place(chat, (h) => document.body.append(h))

    // Progress bar, stuck to the top of the screen while the form scrolls by.
    const progress = makeHost('idc-progress-host')
    Object.assign(progress.host.style, { position: 'sticky', top: opts.progressTop, zIndex: '50' })
    hosts.progress = place(progress, (h) => form.insertBefore(h, form.firstChild))

    // Per question: ? button inside the label, upload tip before the input, notes at the end.
    for (const [fieldId, entry] of Object.entries(FORM_ASSEMBLY_MAP)) {
      const { container, label } = adapter.elementsFor(fieldId)
      if (!container) continue
      const h = {}
      if (label && entry.kind !== 'checkbox') h.help = place(makeHost('idc-help-host', { inline: true }), (el) => label.append(el))
      if (entry.kind === 'file') {
        const input = container.querySelector('.inputWrapper') || container.querySelector('input[type="file"]')
        if (input) h.tips = place(makeHost('idc-tips-host'), (el) => input.parentNode.insertBefore(el, input))
      }
      h.notes = place(makeHost('idc-notes-host'), (el) => container.append(el))
      hosts.fields[fieldId] = h
    }
    // Opt-in: "How it works" and "Before you start" above the form; save & resume bar at its top.
    if (opts.intro) {
      const container = form.closest('.wFormContainer') || form
      hosts.intro = place(makeHost('idc-intro-host'), (el) => container.parentNode.insertBefore(el, container))
    }
    if (opts.drafts) hosts.draft = place(makeHost('idc-draft-host'), (el) => progress.host.after(el))
    // Opt-in: the demo's fonts. Fonts must be loaded by the page itself; shadow roots then use them.
    if (opts.loadFont && !document.querySelector(`link[href="${FONT_URL}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = FONT_URL
      document.head.append(link)
      cleanups.push(() => link.remove())
    }
    // Opt-in: restyle the FormAssembly form to look like the demo site (page styles, scoped to this form).
    if (opts.theme === 'copilot') {
      const style = document.createElement('style')
      style.id = 'idc-theme'
      style.textContent = themeCss
      document.head.append(style)
      form.classList.add('idc-theme')
      // "$" in front of money answers, as on the demo (display only: the answer stays a plain number).
      const money = Object.keys(FORM_ASSEMBLY_MAP).filter((id) => FIELDS_BY_ID[id]?.type === 'money').map((id) => adapter.elementsFor(id).container).filter(Boolean)
      money.forEach((c) => c.classList.add('idc-money'))
      cleanups.push(() => style.remove(), () => form.classList.remove('idc-theme'), () => money.forEach((c) => c.classList.remove('idc-money')),
        () => form.querySelectorAll('.idc-invalid').forEach((c) => c.classList.remove('idc-invalid')))
    }
    // Opt-in: "same as home address" box just above the business address.
    const bizAddress = adapter.elementsFor('business_address').container
    if (opts.fillHelpers && bizAddress) hosts.same = place(makeHost('idc-same-host'), (el) => bizAddress.parentNode.insertBefore(el, bizAddress))

    const notesRef = { current: {} }
    const feedbackClient = createFeedbackClient({ endpoint: opts.feedbackEndpoint, onEvent: track })
    const appHost = makeHost('idc-app-host')
    appHost.host.hidden = true
    const root = createRoot(place(appHost, (h) => document.body.append(h)))
    root.render(
      <FailSafe onError={failOpen}><PageLanguage fixed={opts.locale}>
        <EmbeddedApp adapter={adapter} session={session} assistant={assistant} hosts={hosts} notesRef={notesRef}
          feedbackClient={feedbackClient} waitForReply={!!opts.assistantEndpoint} fillHelpers={opts.fillHelpers}
          drafts={opts.drafts} canSave={opts.drafts || opts.saveResume}
          onStartForm={() => (hosts.draft ? document.querySelector('.idc-draft-host') : progress.host).scrollIntoView({ behavior: 'smooth', block: 'start' })}
          onError={failOpen} />
      </PageLanguage></FailSafe>,
    )
    cleanups.unshift(() => root.unmount())

    // The same anonymous counts as browser events on the page, for the site's own analytics.
    cleanups.push(onTrack((e) => {
      for (const c of toCounted(e)) window.dispatchEvent(new CustomEvent('investdetroit:copilot', { detail: { ...c } }))
    }))
    // Anonymous counts to our server, for Invest Detroit's data pipeline (never answers, messages or notes).
    if (opts.eventsEndpoint) {
      const send = (payload) => fetch(opts.eventsEndpoint, { method: 'POST', mode: 'cors', keepalive: true, headers: { 'content-type': 'application/json' }, body: payload }).catch(() => {})
      cleanups.push(startMetrics({ endpoint: opts.eventsEndpoint, enabled: true, send }))
    }
    let submitted = false
    const onLeave = () => {
      if (submitted) return
      const section = formProgress(adapter.getSnapshot()).sections.find((s) => s.done < s.total)?.id
      if (section) track({ type: 'form_left', section })
    }
    addEventListener('pagehide', onLeave)
    cleanups.push(() => removeEventListener('pagehide', onLeave))

    // Lock Submit until a review passes, and re-lock when an answer changes.
    cleanups.push(session.subscribe((s) => adapter.setSubmitEnabled(s.canSubmit)))
    cleanups.push(adapter.subscribe(() => session.invalidate()))
    adapter.setSubmitEnabled(false)

    // Backup lock: some form scripts re-enable their button, so also stop the submit itself.
    const guard = (e) => {
      if (!guardOn || e.target !== form) return
      if (session.getState().canSubmit) {
        // Staff summary goes inside the application, to Invest Detroit's own system only.
        const target = opts.summaryField && (form.querySelector(`#${cssEscape(opts.summaryField)}`) || form.querySelector(`[name="${cssEscape(opts.summaryField)}"]`))
        if (target) target.value = buildStaffSummary({ issues: session.getState().issues, notes: notesRef.current, locale: document.documentElement.lang || 'en' })
        submitted = true
        if (opts.drafts) clearDraft() // the draft is no longer needed once the application is sent
        track({ type: 'form_submitted' })
        return
      }
      e.preventDefault()
      e.stopImmediatePropagation()
      document.querySelector('.idc-review-host')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
