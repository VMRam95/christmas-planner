'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  const router = useRouter()
  const { login, isLoading, error, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])
  return (
    <main className="login-layout">
      <section className="login-story" aria-label="Bienvenido a Christmas Planner">
        <Link href="/" className="brand"><span className="brand-mark">✦</span> Christmas Planner</Link>
        <div className="story-content">
          <p className="eyebrow">MENOS PRISAS. MÁS ILUSIÓN.</p>
          <h1>Los mejores regalos<br />empiezan con<br /><em>un poco de magia.</em></h1>
          <p>Una carta para cada persona. Un lugar para organizarlo todo. Y la sorpresa, siempre a salvo.</p>
          <div className="gift-scene" aria-hidden="true"><span className="scene-star">✦</span><div className="gift-box gift-small"><i /></div><div className="gift-box gift-large"><i /></div><span className="scene-spark">✧</span></div>
          <div className="story-steps"><span>01 · Escribe tu carta</span><span>02 · Elige sus regalos</span><span>03 · Guarda el secreto</span></div>
        </div>
        <p className="story-footer">Hecho para compartir la ilusión en familia.</p>
      </section>
      <section className="login-form-panel">
        <div className="w-full max-w-sm">
          <p className="eyebrow text-christmas-green">TU NAVIDAD, EN UN SOLO LUGAR</p>
          <h2 className="text-3xl sm:text-4xl font-semibold mt-3 mb-3 tracking-tight">Qué alegría verte.</h2>
          <p className="text-muted mb-8">Entra para preparar algo especial.</p>
          <form onSubmit={async (e) => { e.preventDefault(); await login(email.trim(), password) }} className="space-y-5">
            <Input label="Email" type="email" autoComplete="username" placeholder="tu@email.com" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            <div>
              <div className="relative"><Input label="Contraseña" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="pr-20" /><button type="button" className="absolute right-3 bottom-1 min-h-11 text-xs font-medium text-christmas-green" onClick={() => setVisible(!visible)} aria-pressed={visible}>{visible ? 'Ocultar' : 'Mostrar'}</button></div>
              <Link href="/forgot-password" className="block mt-3 text-sm text-christmas-green text-right">Crear o recuperar contraseña</Link>
            </div>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>Entrar en mi Navidad <span aria-hidden="true">→</span></Button>
          </form>
          <p className="text-sm text-muted text-center mt-7">Acceso privado para miembros de la familia.<br />Tu carta es tuya. Las sorpresas se quedan en secreto.</p>
          <div className="flex justify-center gap-5 mt-8 text-sm"><Link href="/help" className="text-christmas-green">Manual de usuario</Link><Link href="/help#novedades" className="text-christmas-green">Novedades</Link></div>
        </div>
      </section>
    </main>
  )
}
