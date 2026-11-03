// The add-on's screens: the shared review panel and chat window, wired to a form adapter
// instead of the prototype's React state.
import { Component, useEffect, useState } from 'react'
import ReviewPanel from '../components/ReviewPanel.jsx'
import ChatAssistant from '../components/ChatAssistant.jsx'
import I18nProvider from '../components/I18nProvider.jsx'
import { localeFromLang } from '../copilot/i18n/index.js'

/** Hides the add-on and reports the error (so it can unlock Submit) if a screen crashes. */
export class FailSafe extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { this.props.onError(error) }
  render() { return this.state.failed ? null : this.props.children }
}

export function EmbeddedReview({ session, adapter, onError }) {
  const [state, setState] = useState(session.getState())
  useEffect(() => session.subscribe(setState), [session])
  const run = () => {
    try { session.run() } catch (e) { onError(e) }
  }
  return <ReviewPanel state={state} onRun={run} onGoToField={(id) => adapter.focusField(id)} />
}

export function EmbeddedChat({ assistant, adapter, subtitle }) {
  const [activeFieldId, setActiveFieldId] = useState(null)
  useEffect(() => adapter.onActiveFieldChange(setActiveFieldId), [adapter])
  return <ChatAssistant assistant={assistant} activeFieldId={activeFieldId} subtitle={subtitle} />
}

/** Uses the host page's language (<html lang="es">) and follows it if the page changes it. */
export function PageLanguage({ fixed, children }) {
  const read = () => fixed || localeFromLang(document.documentElement.lang)
  const [locale, setLocale] = useState(read)
  useEffect(() => {
    if (fixed) return undefined
    const observer = new MutationObserver(() => setLocale(localeFromLang(document.documentElement.lang)))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [fixed])
  return <I18nProvider locale={locale}>{children}</I18nProvider>
}
