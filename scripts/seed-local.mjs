import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (url !== 'http://127.0.0.1:56491') throw new Error('Seeding is restricted to the isolated Christmas Planner local stack.')
const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { db: { schema: 'christmas_planner' }, auth: { persistSession: false } })
const { data: { users } } = await client.auth.admin.listUsers()
for (const [email, name] of [['alice@example.test', 'Alicia'], ['bruno@example.test', 'Bruno'], ['clara@example.test', 'Clara'], ['victor.95.manuel@gmail.com', 'Administrador local'], ['outsider@example.test', 'Sin acceso']]) {
  if (!users.some(u => u.email === email)) {
    const { error } = await client.auth.admin.createUser({ email, password: 'Local-test-password-2026!', email_confirm: true })
    if (error) throw error
  }
  if (email !== 'outsider@example.test') {
    const { error } = await client.from('users').upsert({ email, name }, { onConflict: 'email' })
    if (error) throw error
  }
}
const { data: buckets } = await client.storage.listBuckets()
if (!buckets.some(b => b.id === 'christmas-avatars')) {
  const { error } = await client.storage.createBucket('christmas-avatars', { public: true, fileSizeLimit: 2097152, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] })
  if (error) throw error
}
console.log('Synthetic local family and Auth users ready; no emails sent.')
for (const [email, title, description, priority] of [
  ['alice@example.test', 'Un libro para las tardes de invierno', 'Una novela, una manta y un rato sin prisas.', 3],
  ['bruno@example.test', 'Jersey de lana', 'Talla M, en verde oscuro o azul.', 2],
  ['clara@example.test', 'Una vela con aroma a bosque', 'Prefiero aromas suaves, sin vainilla.', 1],
]) {
  const { data: member } = await client.from('users').select('id').eq('email', email).single()
  const { data: existing } = await client.from('wishes').select('id').eq('user_id', member.id).eq('title', title).maybeSingle()
  if (!existing) {
    const { error } = await client.from('wishes').insert({ user_id: member.id, title, description, priority })
    if (error) throw error
  }
}

// Exercise first access against an existing legacy profile and wish, without an Auth identity.
const pending = users.find(u => u.email === 'new-member@example.test')
if (pending) { const { error } = await client.auth.admin.deleteUser(pending.id); if (error) throw error }
const { error: pendingError } = await client.from('users').upsert({ email: 'new-member@example.test', name: 'Nuevo familiar' }, { onConflict: 'email' })
if (pendingError) throw pendingError
const { data: pendingProfile } = await client.from('users').select('id').eq('email', 'new-member@example.test').single()
const { data: pendingWish } = await client.from('wishes').select('id').eq('user_id', pendingProfile.id).eq('title', 'Mi carta de antes').maybeSingle()
if (!pendingWish) { const { error } = await client.from('wishes').insert({ user_id: pendingProfile.id, title: 'Mi carta de antes', priority: 2 }); if (error) throw error }
const { error: limitsError } = await client.from('auth_email_limits').delete().neq('request_key', '')
if (limitsError) throw limitsError
