import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
test('email gate and mixed batch outcomes preserve recipient attribution', async () => {
  let requests = 0
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk
    requests++
    const success = JSON.parse(body).to === 'good@example.test'
    res.writeHead(success ? 200 : 500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(success ? { success: true, messageId: 'local-only' } : { success: false, error: 'simulated failure' }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  process.env.EMAIL_SERVICE_URL = 'http://127.0.0.1:' + server.address().port
  process.env.EMAIL_SERVICE_API_KEY = 'synthetic-test-key'
  process.env.EMAIL_DELIVERY_ENABLED = 'false'
  try {
    const { sendEmail, sendEmailBatch } = await import('../src/lib/email/client.ts')
    assert.equal((await sendEmail({ to: 'good@example.test', template: 'test', data: {} })).success, false)
    assert.equal(requests, 0)
    process.env.EMAIL_DELIVERY_ENABLED = 'true'
    const result = await sendEmailBatch([{ email: 'bad@example.test', data: {} }, { email: 'good@example.test', data: {} }], 'test')
    assert.equal(result.success, false)
    assert.equal(result.sent, 1); assert.equal(result.failed, 1)
    assert.deepEqual(result.sentTo, ['good@example.test'])
    assert.equal(result.errors.length, 1); assert.match(result.errors[0], /bad@example.test/)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
