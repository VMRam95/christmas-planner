import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { isEmail } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!isEmail(body?.email)) return NextResponse.json({ success: false, error: 'Introduce un email válido.' }, { status: 400 })
  if (process.env.AUTH_EMAIL_DELIVERY_ENABLED !== 'true') return NextResponse.json({ success: false, error: 'No podemos preparar el correo de acceso en este momento. Inténtalo más tarde.' }, { status: 503 })
  const email = body.email.trim().toLowerCase()
  const client = createServerClient()
  const digest = (value: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(value).digest('hex')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim().slice(0, 80) || 'local'
  const response = () => NextResponse.json({ success: true, data: null })
  // Same body/headers and limits for family and unknown emails; no Auth cookies here.
  for (const [key, max, seconds] of [['ip:' + ip, 20, 3600], ['email:' + email, 1, 60], ['email-hour:' + email, 5, 3600]] as const) {
    const { data, error } = await client.rpc('claim_auth_email_request', { request_key: digest(key), max_requests: max, window_seconds: seconds })
    if (error) return NextResponse.json({ success: false, error: 'No podemos preparar el correo de acceso en este momento. Inténtalo más tarde.' }, { status: 503 })
    if (!data) return response()
  }
  const { data: member, error: memberError } = await client.from('users').select('id').eq('email', email).maybeSingle()
  if (memberError) return NextResponse.json({ success: false, error: 'No podemos preparar el correo de acceso en este momento. Inténtalo más tarde.' }, { status: 503 })
  if (!member) return response()
  let link = await client.auth.admin.generateLink({ type: 'recovery', email })
  if (link.error?.code === 'user_not_found') link = await client.auth.admin.generateLink({ type: 'invite', email })
  if (link.error || !link.data.properties?.hashed_token) {
    console.error('Could not generate family access email', link.error?.code)
    return response()
  }
  const recoveryUrl = new URL('/auth/recovery', process.env.NEXT_PUBLIC_APP_URL!)
  recoveryUrl.searchParams.set('token_hash', link.data.properties.hashed_token)
  recoveryUrl.searchParams.set('type', link.data.properties.verification_type)
  const result = await sendEmail({ to: email, template: 'christmas-planner/password-recovery', data: { recoveryUrl: recoveryUrl.toString() } })
  if (!result.success) console.error('Family access email delivery failed')
  return response()
}
