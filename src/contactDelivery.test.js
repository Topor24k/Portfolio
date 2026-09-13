import test from 'node:test'
import assert from 'node:assert/strict'
import { CONTACT_EMAIL, createInquiryPayload, deliverInquiry, inquiryEmailLink } from './contactDelivery.js'

const brief = {
  name: ' Test Visitor ', email: ' visitor@example.com ', business: ' Sample & Co. ',
  message: ' A sample business inquiry for automated checks. ',
  goals: ['Take bookings', 'Get more inquiries'], timeline: 'In 1–3 months', consent: true,
}

test('notification includes business details and the visitor’s reply address', () => {
  const payload = createInquiryPayload(brief)
  assert.equal(payload.email, 'visitor@example.com')
  assert.equal(payload.business, 'Sample & Co.')
  assert.equal(payload.website_goals, 'Take bookings, Get more inquiries')
  assert.equal(payload._subject, 'New website inquiry — Sample & Co.')
  assert.equal(payload._honey, '')
  assert.equal(createInquiryPayload({ ...brief, _honey: 'spam' })._honey, 'spam')
})

test('short form without optional goals still produces a complete notification', () => {
  const payload = createInquiryPayload({ ...brief, goals: undefined, timeline: undefined })
  assert.equal(payload.website_goals, 'To discuss together')
  assert.equal(payload.preferred_timeline, 'Flexible / let’s discuss')
})

test('fallback email safely encodes the brief and retains all selected goals', () => {
  const url = new URL(inquiryEmailLink(brief))
  assert.equal(url.pathname, CONTACT_EMAIL)
  assert.match(url.searchParams.get('subject'), /Sample & Co\./)
  assert.match(url.searchParams.get('body'), /Take bookings, Get more inquiries/)
  assert.match(url.searchParams.get('body'), /visitor@example.com/)
})

test('accepted notifications use the correct destination without sending a live email', async (t) => {
  const controller = new AbortController()
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `https://formsubmit.co/ajax/${CONTACT_EMAIL}`)
    assert.equal(options.method, 'POST')
    assert.equal(options.signal, controller.signal)
    assert.equal(JSON.parse(options.body).email, 'visitor@example.com')
    return { ok: true, json: async () => ({ success: 'true' }) }
  })
  assert.equal(await deliverInquiry(brief, controller.signal), 'success')
})

test('activation is distinguished from successful submission', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ success: 'true', message: 'Please activate this form.' }) }))
  assert.equal(await deliverInquiry(brief), 'activation')
})

test('HTTP failures and service rejections do not report success', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ({ ok: false, json: async () => ({ success: 'true' }) }))
  await assert.rejects(deliverInquiry(brief))
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ success: 'false' }) }))
  await assert.rejects(deliverInquiry(brief))
})

test('network failures and malformed responses reach the error handler', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network unavailable') })
  await assert.rejects(deliverInquiry(brief))
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON') } }))
  await assert.rejects(deliverInquiry(brief))
})

test('cancellation is forwarded to the delivery request', async (t) => {
  const controller = new AbortController()
  controller.abort()
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => {
    signal.throwIfAborted()
  })
  await assert.rejects(deliverInquiry(brief, controller.signal), { name: 'AbortError' })
})
