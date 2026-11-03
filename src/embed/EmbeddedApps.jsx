// The add-on's screens: the shared review panel and chat window, wired to a form adapter
// instead of the prototype's React state.
import { Component, useEffect, useState } from 'react'
import ReviewPanel from '../components/ReviewPanel.jsx'
import ChatAssistant from '../components/ChatAssistant.jsx'

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
