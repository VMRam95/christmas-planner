import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (url !== 'http://127.0.0.1:56491') throw new Error('Database tests require the isolated local Supabase stack.')
const options = { db: { schema: 'christmas_planner' }, auth: { persistSession: false } }
test('anonymous and authenticated direct access cannot bypass gift privacy', async () => {
  const privileged = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options)
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
  const control = await privileged.from('wishes').select('id').limit(1)
  assert.equal(control.error, null)
  assert.ok(control.data.length)
  for (const table of ['users', 'wishes', 'assignments', 'surprise_gifts', 'notifications', 'user_preferences']) {
    const direct = await anon.from(table).select('*').limit(1)
    assert.equal(direct.error?.code, '42501', table + ' must deny anonymous access')
  }
  const { error } = await anon.auth.signInWithPassword({ email: 'alice@example.test', password: 'Local-test-password-2026!' })
  assert.equal(error, null)
  assert.equal((await anon.from('assignments').select('*')).error?.code, '42501')
  assert.equal((await anon.from('surprise_gifts').select('*')).error?.code, '42501')
  const upload = await anon.storage.from('christmas-avatars').upload('unowned.png', Buffer.from([137,80,78,71,13,10,26,10]), { contentType: 'image/png' })
  assert.ok(upload.error, 'direct writes to avatar storage must be denied')
})
test('closed local signup cannot claim an unprovisioned family identity', async () => {
  const auth = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
  const result = await auth.auth.signUp({ email: 'signup@example.test', password: 'Do-not-create-local-2026!' })
  assert.ok(result.error)
  assert.equal(result.error.code, 'signup_disabled')
})


test('access email limits are durable and private to server requests', async () => {
  const privileged = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options)
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
  const key = 'database-test-' + Date.now()
  const args = { request_key: key, max_requests: 1, window_seconds: 60 }
  assert.equal((await privileged.rpc('claim_auth_email_request', args)).data, true)
  assert.equal((await privileged.rpc('claim_auth_email_request', args)).data, false)
  assert.equal((await anon.rpc('claim_auth_email_request', args)).error?.code, '42501')
  const { error } = await anon.auth.signInWithPassword({ email: 'alice@example.test', password: 'Local-test-password-2026!' })
  assert.equal(error, null)
  assert.equal((await anon.rpc('claim_auth_email_request', args)).error?.code, '42501')
  await privileged.from('auth_email_limits').delete().eq('request_key', key)
})


test('an unconfirmed invitation can safely recover after a failed first delivery', async () => {
  const privileged = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options)
  const publicAuth = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
  const email = 'retry-' + Date.now() + '@example.test'
  const invitation = await privileged.auth.admin.generateLink({ type: 'invite', email })
  assert.equal(invitation.error, null)
  const id = invitation.data.user.id
  try {
    assert.equal(invitation.data.user.email_confirmed_at, undefined)
    const recovery = await privileged.auth.admin.generateLink({ type: 'recovery', email })
    assert.equal(recovery.error, null)
    const verified = await publicAuth.auth.verifyOtp({ token_hash: recovery.data.properties.hashed_token, type: 'recovery' })
    assert.equal(verified.error, null)
    assert.ok(verified.data.user.email_confirmed_at)
  } finally { const { error } = await privileged.auth.admin.deleteUser(id); assert.equal(error, null) }
})
