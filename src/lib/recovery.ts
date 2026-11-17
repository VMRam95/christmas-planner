import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const cookieName = 'christmas-password-recovery'
const sign = (value: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(value).digest('hex')
export async function grantPasswordRecovery(userId: string) {
  const value = userId + '.' + (Date.now() + 10 * 60 * 1000)
  ;(await cookies()).set(cookieName, value + '.' + sign(value), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
  })
}
export async function hasPasswordRecovery(userId: string) {
  const value = (await cookies()).get(cookieName)?.value
  if (!value) return false
  const [id, expiry, signature] = value.split('.')
  if (id !== userId || !expiry || Number(expiry) < Date.now() || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(id + '.' + expiry), 'hex'))
}
export async function clearPasswordRecovery() { (await cookies()).delete(cookieName) }
