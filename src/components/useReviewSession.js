import { useEffect, useState } from 'react'
import { createReviewSession } from '../copilot/reviewSession.js'
import { track } from '../copilot/events.js'

/**
 * React wrapper around the framework-free review session.
 * @param {() => Record<string, unknown>} getSnapshot  returns the current answers. Must be stable
 *   (read from a ref or an adapter), because the session keeps the first one it is given.
 * @returns {[object, ReturnType<typeof createReviewSession>]} current state and the session
 */
export function useReviewSession(getSnapshot) {
  const [session] = useState(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return createReviewSession({ getSnapshot, stepMs: reduce ? 120 : 650, onEvent: track })
  })
  const [state, setState] = useState(session.getState())

  useEffect(() => {
    const unsubscribe = session.subscribe(setState)
    return () => {
      unsubscribe()
      session.dispose()
    }
  }, [session])

  return [state, session]
}
