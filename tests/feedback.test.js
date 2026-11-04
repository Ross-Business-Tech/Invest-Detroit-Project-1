import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildFeedbackRecord, createFeedbackClient, hasMeaningfulInteraction, newFeedbackId } from '../src/copilot/feedback.js'

test('a rating record holds only the rating, an id and the time', () => {
  const r = buildFeedbackRecord(4, { id: 'fb_x', now: new Date('2026-11-04T12:00:00Z') })
  assert.deepEqual(r, { feedback_id: 'fb_x', rating: 4, submitted_at: '2026-11-04T12:00:00.000Z' })
})

test('ratings outside 1–5 are refused', () => {
  for (const bad of [0, 6, 2.5, '3', null]) assert.throws(() => buildFeedbackRecord(bad))
})

test('feedback ids are unique', () => {
  const ids = new Set(Array.from({ length: 50 }, newFeedbackId))
  assert.equal(ids.size, 50)
  for (const id of ids) assert.match(id, /^fb_/)
})

test('saving posts exactly the three fields as JSON', async () => {
  let sent
  const client = createFeedbackClient({
    endpoint: '/save',
    fetchImpl: async (url, init) => { sent = { url, init }; return { ok: true, json: async () => ({ record: { id: 'rec_1' } }) } },
  })
  await client.submit(5)
  assert.equal(sent.url, '/save')
  assert.equal(sent.init.method, 'POST')
  assert.deepEqual(Object.keys(JSON.parse(sent.init.body)).sort(), ['feedback_id', 'rating', 'submitted_at'])
})

test('a failed or odd response throws so the card can offer a retry', async () => {
  const failing = createFeedbackClient({ endpoint: '/save', fetchImpl: async () => ({ ok: false, status: 403 }) })
  await assert.rejects(failing.submit(3))
  const htmlPage = createFeedbackClient({ endpoint: '/save', fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('not json') } }) })
  await assert.rejects(htmlPage.submit(3))
  const offline = createFeedbackClient({ endpoint: '/save', fetchImpl: async () => { throw new Error('offline') } })
  await assert.rejects(offline.submit(3))
})

test('no endpoint means no feedback card', () => {
  assert.equal(createFeedbackClient({ endpoint: null }), null)
})

test('the card waits for two real answers', () => {
  const user = { role: 'user', text: 'q' }
  const answer = { role: 'assistant', kind: 'answer' }
  assert.equal(hasMeaningfulInteraction([{ role: 'assistant', kind: 'welcome' }, user, answer]), false)
  assert.equal(hasMeaningfulInteraction([user, answer, user, { role: 'assistant', kind: 'privacy_warning' }]), false)
  assert.equal(hasMeaningfulInteraction([user, answer, user, { role: 'assistant', kind: 'no_answer' }]), true)
})

test('the Site Data manifest stores only the three fields, and visitors cannot read them', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/.herenow/data.json', import.meta.url)))
  const c = manifest.collections.assistant_feedback
  assert.deepEqual(Object.keys(c.fields).sort(), ['feedback_id', 'rating', 'submitted_at'])
  assert.equal(c.access.read, 'owner')
  assert.equal(c.access.insert, 'public')
  assert.equal(c.fields.rating.minimum, 1)
  assert.equal(c.fields.rating.maximum, 5)
})
