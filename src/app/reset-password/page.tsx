'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PasswordFields } from '@/components/account/PasswordFields'
import { passwordError } from '@/lib/validation'
import { Button } from '@/components/ui/button'
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  return <main className="min-h-svh flex items-center justify-center px-6 py-12"><div className="w-full max-w-md"><Link href="/" className="brand text-christmas-green mb-10"><span className="brand-mark">✦</span>Christmas Planner</Link><p className="eyebrow text-christmas-green">UN NUEVO COMIENZO</p><h1 className="text-3xl font-semibold tracking-tight mt-3 mb-4">Elige tu contraseña.</h1><p className="text-sm text-muted mb-6">Elige una contraseña única para tu cuenta. El enlace de recuperación debe estar verificado y tiene una duración limitada.</p><form className="space-y-5" onSubmit={async e => { e.preventDefault(); setError(''); if (passwordError(password)) { setError(passwordError(password)!); return } if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return } setBusy(true); try { const data = await fetch('/api/auth/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).then(r => r.json()); if (!data.success) throw new Error(data.error); router.replace('/dashboard') } catch(e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.') } finally { setBusy(false) } }}><PasswordFields password={password} confirmation={confirmation} onPasswordChange={value => { setPassword(value); setError('') }} onConfirmationChange={value => { setConfirmation(value); setError('') }} disabled={busy}/>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button className="w-full" isLoading={busy} disabled={!!passwordError(password) || password !== confirmation}>Guardar contraseña</Button></form><Link href="/forgot-password" className="help-link mt-6">Solicitar otro enlace</Link></div></main>
}
