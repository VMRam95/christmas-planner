'use client'
import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { passwordError } from '@/lib/validation'

export function PasswordFields({ password, confirmation, onPasswordChange, onConfirmationChange, disabled }: {
  password: string; confirmation: string; onPasswordChange: (value: string) => void; onConfirmationChange: (value: string) => void; disabled?: boolean
}) {
  const id = useId()
  const lengthError = passwordError(password)
  const mismatch = confirmation !== password
  return <div className="space-y-4">
    <Input id={`${id}-password`} label="Nueva contraseña" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e => onPasswordChange(e.target.value)} disabled={disabled} aria-describedby={`${id}-guidance ${id}-length`} error={password && lengthError ? lengthError : undefined} />
    <div id={`${id}-guidance`} className="rounded-xl border border-border bg-christmas-green/5 p-4 text-sm">
      <p className="font-medium mb-2">Una contraseña que puedas recordar</p>
      <ul className="list-disc pl-5 space-y-1 text-muted"><li>Entre 12 y 128 caracteres.</li><li>Prueba una frase larga con varias palabras.</li><li>Evita tu nombre, fechas personales y contraseñas que ya uses.</li></ul>
    </div>
    <p id={`${id}-length`} className={`text-sm ${password && !lengthError ? 'text-christmas-green' : 'text-muted'}`}>{password && !lengthError ? '✓ Longitud válida' : '○ Mínimo 12 caracteres'} · {password.length}/128 caracteres</p>
    <Input id={`${id}-confirmation`} label="Repetir nueva contraseña" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={e => onConfirmationChange(e.target.value)} disabled={disabled} aria-describedby={`${id}-match`} error={confirmation && mismatch ? 'Las contraseñas no coinciden.' : undefined} />
    <p id={`${id}-match`} role="status" className={`text-sm ${confirmation && !mismatch ? 'text-christmas-green' : 'text-muted'}`}>{confirmation && !mismatch ? '✓ Las contraseñas coinciden.' : 'Repite la contraseña para comprobar que coincide.'}</p>
  </div>
}
