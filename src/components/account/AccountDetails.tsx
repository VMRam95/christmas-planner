'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { PasswordFields } from './PasswordFields'
import { passwordError } from '@/lib/validation'
import type { User } from '@/types'
export function AccountDetails({ user, refresh }: { user: User; refresh: () => Promise<void> }) {
  const [name, setName] = useState(user.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  useEffect(() => { setName(user.name) }, [user.name])
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProfile(true)
    try {
      const result = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then(r => r.json())
      if (!result.success) throw new Error(result.error)
      await refresh(); showToast('Perfil actualizado', 'success')
    } catch (e) { showToast(e instanceof Error ? e.message : 'No se pudo guardar el perfil', 'error') }
    finally { setSavingProfile(false) }
  }
  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (passwordError(password)) { setError(passwordError(password)!); return }
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setSavingPassword(true)
    try {
      const result = await fetch('/api/auth/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, password }) }).then(r => r.json())
      if (!result.success) throw new Error(result.error)
      setPassword(''); setConfirmation(''); setCurrentPassword(''); showToast('Contraseña actualizada', 'success')
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña') }
    finally { setSavingPassword(false) }
  }
  return <div className="space-y-6 mb-6">
    <Card><CardHeader><CardTitle>Tu perfil</CardTitle><p className="text-sm text-muted mt-1">Así te verá tu familia.</p></CardHeader><CardContent><form onSubmit={saveProfile} className="space-y-4"><Input label="Nombre" required maxLength={80} value={name} onChange={e => setName(e.target.value)} disabled={savingProfile} /><Input label="Email de acceso" value={user.email} disabled /><p className="text-xs text-muted">Para cambiar el email, contacta con quien administra tu familia. Tu cuenta y tu carta seguirán vinculadas.</p><Button type="submit" isLoading={savingProfile} disabled={!name.trim() || name.trim() === user.name}>Guardar perfil</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle>Acceso y seguridad</CardTitle></CardHeader><CardContent><p className="text-sm text-muted mb-4">Cambia tu contraseña introduciendo la actual y eligiendo una nueva.</p><form onSubmit={savePassword} className="space-y-4"><Input label="Contraseña actual" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={savingPassword} /><PasswordFields password={password} confirmation={confirmation} onPasswordChange={value => { setPassword(value); setError('') }} onConfirmationChange={value => { setConfirmation(value); setError('') }} disabled={savingPassword} />{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" isLoading={savingPassword} disabled={!currentPassword || !!passwordError(password) || password !== confirmation}>Actualizar contraseña</Button></form></CardContent></Card>
  </div>
}
