// Test-only email-service protocol adapter; captures exclusively in isolated Mailpit.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
const template = readFileSync('supabase/templates/access.html', 'utf8')
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST' || request.url !== '/api/send' || request.headers['x-api-key'] !== 'synthetic-mailpit-only') { response.writeHead(401); response.end('{}'); return }
  try {
    let raw = ''; for await (const chunk of request) raw += chunk
    const body = JSON.parse(raw)
    if (body.template !== 'christmas-planner/password-recovery' || !body.to.endsWith('@example.test')) throw Error('Only synthetic access emails are allowed')
    if (body.to === 'mail-failure@example.test') { response.writeHead(502); response.end(JSON.stringify({ success: false, error: 'Simulated mail failure' })); return }
    const r = await fetch('http://127.0.0.1:56494/api/v1/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ From: { Email: 'local@example.test', Name: 'Christmas Planner' }, To: [{ Email: body.to }], Subject: 'Recupera tu acceso a Christmas Planner', HTML: template.replace('{{recoveryUrl}}', escape(body.data.recoveryUrl)) }) })
    if (!r.ok) throw Error('Mailpit rejected synthetic email: ' + r.status)
    response.end(JSON.stringify({ success: true, messageId: 'local-mailpit-only' }))
  } catch { response.writeHead(502); response.end(JSON.stringify({ success: false, error: 'Local email test failed' })) }
})
server.listen(56496, '127.0.0.1')
