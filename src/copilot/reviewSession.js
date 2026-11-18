// Review state machine, independent of React or any page layout.
//
//   idle ──run()──▶ running (steps through REVIEW_CHECKS) ──▶ done
//    ▲                                                          │
//    └────────────── invalidate() when an answer changes ───────┘   (stale: true)
//
// The prototype drives it from React (useReviewSession). On Invest Detroit's site an embed
// script would drive it from the form adapter's change events instead.

import { REVIEW_CHECKS, runReview, canSubmitWith, summarizeIssues } from './review.js'

const IDLE = Object.freeze({ status: 'idle', step: 0, issues: [], stale: false, canSubmit: false })

/**
 * @param {object} opts
 * @param {() => Record<string, unknown>} opts.getSnapshot  current answers keyed by field id
 * @param {(state: object) => void} [opts.onChange]         called on every state change (or use subscribe())
 * @param {(event: object) => void} [opts.onEvent]          privacy-safe analytics hook (counts only)
 * @param {number} [opts.stepMs]                            time per progress step (0 = instant)
 * @param {(fn: () => void, ms: number) => unknown} [opts.setTimer]  injectable for tests
 * @param {(handle: unknown) => void} [opts.clearTimer]
 */
export function createReviewSession({
  getSnapshot,
  onChange = () => {},
  onEvent = () => {},
  stepMs = 650,
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (h) => clearInterval(h),
}) {
  let state = IDLE
  let timer = null
  const listeners = new Set([onChange])

  const set = (next) => {
    state = Object.freeze({ ...state, ...next })
    for (const fn of listeners) fn(state)
  }
  const stop = () => {
    if (timer !== null) clearTimer(timer)
    timer = null
  }
  const finish = (issues) => {
    stop()
    const canSubmit = canSubmitWith(issues)
    set({ status: 'done', step: REVIEW_CHECKS.length, issues, stale: false, canSubmit })
    // Issue ids only (e.g. loan_gt_budget): never the answers themselves.
    onEvent({ type: 'review_completed', can_submit: canSubmit, ...summarizeIssues(issues), issue_ids: issues.map((i) => i.id) })
  }

  return {
    getState: () => state,

    /** Listen for state changes; returns an unsubscribe function. */
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },

    /** Run every check now; the progress steps are only for the applicant's benefit. */
    run() {
      stop()
      const issues = runReview(getSnapshot())
      onEvent({ type: 'review_started' })
      if (!stepMs) return finish(issues)
      set({ status: 'running', step: 0, issues: [], stale: false, canSubmit: false })
      let step = 0
      timer = setTimer(() => {
        step += 1
        if (step >= REVIEW_CHECKS.length) finish(issues)
        else set({ step })
      }, stepMs)
    },

    /** Call whenever an answer changes. A finished review becomes stale and Submit locks again. */
    invalidate() {
      if (state.status === 'idle') return
      stop()
      set({ ...IDLE, stale: true })
    },

    reset() {
      stop()
      set(IDLE)
    },

    dispose: stop,
  }
}
