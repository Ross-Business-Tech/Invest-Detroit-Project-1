import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReviewSession } from '../src/copilot/reviewSession.js'
import { REVIEW_CHECKS } from '../src/copilot/review.js'

function fakeTimers() {
  let fn = null
  return {
    setTimer: (f) => { fn = f; return 1 },
    clearTimer: () => { fn = null },
    tick: () => fn && fn(),
    get active() { return fn !== null },
  }
}

test('steps through every check, then finishes', () => {
  const timers = fakeTimers()
  const events = []
  const session = createReviewSession({ getSnapshot: () => ({}), onEvent: (e) => events.push(e.type), ...timers })
  session.run()
  assert.equal(session.getState().status, 'running')
  for (let i = 1; i < REVIEW_CHECKS.length; i++) {
    timers.tick()
    assert.equal(session.getState().step, i)
  }
  timers.tick()
  const s = session.getState()
  assert.equal(s.status, 'done')
  assert.equal(s.canSubmit, false)
  assert.ok(s.issues.length > 0)
  assert.equal(timers.active, false)
  assert.deepEqual(events, ['review_started', 'review_completed'])
})

test('changing an answer after a review locks submit and marks it stale', () => {
  const session = createReviewSession({ getSnapshot: () => ({}), stepMs: 0 })
  session.run()
  assert.equal(session.getState().status, 'done')
  session.invalidate()
  assert.deepEqual({ status: session.getState().status, stale: session.getState().stale, canSubmit: session.getState().canSubmit }, { status: 'idle', stale: true, canSubmit: false })
})

test('invalidate on an untouched session does nothing', () => {
  const seen = []
  const session = createReviewSession({ getSnapshot: () => ({}), stepMs: 0 })
  session.subscribe((s) => seen.push(s))
  session.invalidate()
  assert.equal(seen.length, 0)
  assert.equal(session.getState().stale, false)
})

test('subscribers are notified and can unsubscribe', () => {
  const seen = []
  const session = createReviewSession({ getSnapshot: () => ({}), stepMs: 0 })
  const off = session.subscribe((s) => seen.push(s.status))
  session.run()
  off()
  session.reset()
  assert.deepEqual(seen, ['done'])
})
