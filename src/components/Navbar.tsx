'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import { Avatar } from '@/components/Avatar'
import { LogoIcon } from '@/components/Logo'

type Profiel = {
  id: string
  naam: string
  rol: string
  bedrijf_id: string | null
  avatar_url: string | null
}

type SimRol = 'hr' | 'medewerker'
const BEKIJK_ALS_KEY = 'mentaforce_admin_view_as'

const ACCENT: Record<string, string> = {
  admin:      '#8B5CF6',
  hr:         '#185FA5',
  medewerker: '#1D9E75',
}

/* Page titles shown in the top bar */
const PAGE_TITLES: Record<string, string> = {
  '/home':         'Home',
  '/portaal':      'Mijn portaal',
  '/checkin':      'Check-in',
  '/coach':        'AI Coach',
  '/chat':         'Berichten',
  '/journal':      'Journal',
  '/burnout':      'Burn-out scan',
  '/surveys':      'Surveys',
  '/focus':        'Focus & Herstel',
  '/mijn-rapport': 'Mijn rapport',
  '/doelen':       'Doelen',
  '/uitdagingen':  'Uitdagingen',
  '/dashboard':    'HR Dashboard',
  '/team':         'Team',
  '/rapport':      'Rapporten',
  '/admin':        'Admin',
  '/instellingen': 'Instellingen',
  '/koppelingen':  'Koppelingen',
}

function UserMenu({ profiel, onUitloggen, accent }: { profiel: Profiel; onUitloggen: () => void; accent: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex-shrink-0 hover:opacity-80 transition">
        <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={34} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl py-1.5 z-50 min-w-[180px]"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{profiel.naam}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: accent }}>
              {profiel.rol === 'admin' ? 'Administrator' : profiel.rol === 'hr' ? 'HR Manager' : 'Medewerker'}
            </p>
          </div>
          <Link href="/instellingen" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            ⚙️ <span>Instellingen</span>
          </Link>
          <div className="mx-3 my-1 border-t border-gray-100" />
          <button onClick={() => { setOpen(false); onUitloggen() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
            🚪 <span>Uitloggen</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Tab bar (bottom on mobile, bottom on desktop too for consistency) ── */
type Tab = { href: string; emoji: string; label: string; badge?: number }

function TabBar({ tabs, pad, accent }: { tabs: Tab[]; pad: string; accent: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.06)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = pad === tab.href || (tab.href !== '/home' && pad.startsWith(tab.href + '/'))
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-opacity active:opacity-60"
              style={{ minHeight: 58 }}>
              {/* active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 32, height: 3, background: accent }} />
              )}
              {/* unread badge */}
              {(tab.badge ?? 0) > 0 && (
                <span className="absolute top-2 right-[calc(50%-20px)] min-w-[16px] h-4 px-1 rounded-full text-white flex items-center justify-center font-bold z-10"
                  style={{ background: '#E24B4A', fontSize: 9 }}>
                  {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                </span>
              )}
              <span className="text-2xl leading-none"
                style={{ opacity: isActive ? 1 : 0.4, transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s' }}>
                {tab.emoji}
              </span>
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: isActive ? accent : '#9ca3af' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* iOS home indicator safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'white' }} />
    </nav>
  )
}

export default function Navbar() {
  const router = useRouter()
  const pad = usePathname()
  const [profiel, setProfiel] = useState<Profiel | null>(null)
  const [ongelezen, setOngelezen] = useState(0)
  const [bekijkAls, setBekijkAls] = useState<SimRol | null>(null)

  useEffect(() => {
    setBekijkAls(localStorage.getItem(BEKIJK_ALS_KEY) as SimRol | null)
  }, [pad])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles')
        .select('naam, rol, bedrijf_id, avatar_url').eq('id', user.id).single()
      if (data) setProfiel({ id: user.id, ...data })
    }
    laad()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(e => {
      if (e === 'SIGNED_OUT') router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!profiel?.bedrijf_id || !profiel?.id) return
    const bid = profiel.bedrijf_id
    const mijnId = profiel.id
    if (pad === '/chat') {
      localStorage.setItem(`MentaForce_chat_seen_${bid}`, new Date().toISOString())
      setOngelezen(0); return
    }
    let actief = true
    supabase.from('berichten')
      .select('id', { count: 'exact', head: true })
      .eq('bedrijf_id', bid).neq('user_id', mijnId)
      .gt('aangemaakt_op', localStorage.getItem(`MentaForce_chat_seen_${bid}`) ?? '1970-01-01')
      .then(({ count }) => { if (actief) setOngelezen(count ?? 0) })
      .catch(() => {})
    const ch = supabase.channel(`nav-${bid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'berichten', filter: `bedrijf_id=eq.${bid}` },
        (p) => { if ((p.new as { user_id: string }).user_id !== mijnId && actief) setOngelezen(n => n + 1) })
      .subscribe()
    return () => { actief = false; supabase.removeChannel(ch) }
  }, [profiel, pad])

  async function uitloggen() {
    localStorage.removeItem(BEKIJK_ALS_KEY)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const echteRol = profiel?.rol ?? 'medewerker'
  const isAdmin = echteRol === 'admin'
  const rol = isAdmin && bekijkAls ? bekijkAls : echteRol
  const accent = ACCENT[rol] ?? ACCENT.medewerker
  const isInPreview = isAdmin && !!bekijkAls

  /* Per-role tab definitions */
  const tabs: Tab[] =
    rol === 'admin' ? [
      { href: '/admin',     emoji: '🛡️', label: 'Admin' },
      { href: '/dashboard', emoji: '📊', label: 'Dashboard' },
      { href: '/team',      emoji: '👥', label: 'Team' },
      { href: '/chat',      emoji: '💬', label: 'Chat', badge: ongelezen },
    ] : rol === 'hr' ? [
      { href: '/dashboard', emoji: '📊', label: 'Dashboard' },
      { href: '/team',      emoji: '👥', label: 'Team' },
      { href: '/rapport',   emoji: '📈', label: 'Rapporten' },
      { href: '/chat',      emoji: '💬', label: 'Chat', badge: ongelezen },
    ] : [
      { href: '/home',    emoji: '🏠', label: 'Home' },
      { href: '/checkin', emoji: '📋', label: 'Check-in' },
      { href: '/coach',   emoji: '🧠', label: 'Coach' },
      { href: '/chat',    emoji: '💬', label: 'Chat', badge: ongelezen },
    ]

  const paginaTitel = PAGE_TITLES[pad] ?? 'MentaForce'

  return (
    <>
      {/* Admin preview banner */}
      {isInPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2"
          style={{ background: '#1e1340', borderBottom: '1px solid #2d1f60' }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#8B5CF6', color: 'white' }}>PREVIEW</span>
            <span className="text-xs text-gray-300 truncate">
              Als <strong className="text-white">{bekijkAls === 'hr' ? 'HR' : 'Medewerker'}</strong>
            </span>
          </div>
          <button onClick={() => { localStorage.removeItem(BEKIJK_ALS_KEY); setBekijkAls(null); router.push('/admin') }}
            className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            ← Admin
          </button>
        </div>
      )}

      {/* ── Top bar: branding only ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100"
        style={{ borderTop: `3px solid ${accent}`, marginTop: isInPreview ? 36 : 0 }}>
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Logo mark */}
          <Link href={rol === 'medewerker' ? '/home' : rol === 'hr' ? '/dashboard' : '/admin'}
            className="flex-shrink-0">
            <LogoIcon size={34} />
          </Link>

          {/* Page title */}
          <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{paginaTitel}</h1>

          {/* Avatar / user menu */}
          {profiel ? (
            <UserMenu profiel={profiel} onUitloggen={uitloggen} accent={accent} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          )}
        </div>
      </header>

      {/* ── Bottom tab bar ── */}
      <TabBar tabs={tabs} pad={pad} accent={accent} />

      {/* Spacer so page content isn't hidden behind the tab bar */}
      <div style={{ height: 72 }} className="pointer-events-none" />
    </>
  )
}
