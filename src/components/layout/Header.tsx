'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
const links = [{ href: '/dashboard', label: 'Familia', icon: '⌂' }, { href: '/my-wishes', label: 'Mi carta', icon: '✎' }, { href: '/settings', label: 'Mi cuenta', icon: '○' }, { href: '/help', label: 'Ayuda', icon: '?' }]
export function Header() {
  const path = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const active = (href: string) => path === href || (href === '/dashboard' && path.startsWith('/family/'))
  return <>
    <a href="#main-content" className="skip-link">Saltar al contenido</a>
    <header className="app-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-20">
        <Link href={isAuthenticated ? '/dashboard' : '/'} className="brand text-christmas-green"><span className="brand-mark">✦</span><span>Christmas<span className="hidden sm:inline"> Planner</span></span></Link>
        <nav aria-label="Principal" className="hidden lg:flex gap-1">{links.map(link => <Link key={link.href} href={link.href} aria-current={active(link.href) ? 'page' : undefined} className={`nav-link ${active(link.href) ? 'nav-active' : ''}`}>{link.label}</Link>)}{user?.email === 'victor.95.manuel@gmail.com' && <Link href="/admin" className="nav-link">Administrar</Link>}</nav>
        <div className="flex items-center gap-2">{isAuthenticated ? <><NotificationBell /><Link href="/settings" aria-label="Mi cuenta" className="user-chip"><span className="user-initial">{user?.name?.charAt(0).toUpperCase()}</span><span className="hidden lg:inline max-w-28 truncate">{user?.name}</span></Link><button onClick={logout} className="text-sm text-muted min-h-11 px-2">Salir</button></> : <Link href="/" className="nav-link">Acceder</Link>}</div>
      </div>
    </header>
    {isAuthenticated && <nav aria-label="Navegación móvil" className="mobile-nav">{links.map(link => <Link key={link.href} href={link.href} aria-current={active(link.href) ? 'page' : undefined} className={active(link.href) ? 'nav-active' : ''}><span aria-hidden="true">{link.icon}</span>{link.label}</Link>)}{user?.email === 'victor.95.manuel@gmail.com' && <Link href="/admin" aria-current={path === '/admin' ? 'page' : undefined}><span aria-hidden="true">♧</span>Admin</Link>}</nav>}
  </>
}
