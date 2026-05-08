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
  '/verlof':       'Verlof',
  '/uren':         'Urenregistratie',
  '/declaraties':  'Declaraties',
  '/loonstroken':  'Loonstroken',
  '/nieuws':       'Bedrijfsnieuws',
  '/directory':    'Medewerkersgids',
}

/* ── User menu ────────────────────────────────────────────── */
function UserMenu({ profiel, onUitloggen, accent }: { profiel: Profiel; onUitloggen: () => void; accent: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const rolLabel = profiel.rol === 'admin' ? 'Administrator' : profiel.rol === 'hr' ? 'HR Manager' : 'Medewerker'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex-shrink-0 transition-opacity hover:opacity-80 active:opacity-60"
        aria-label="Gebruikersmenu"
        aria-expanded={open}
      >
        <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={34} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 rounded-2xl py-1.5 z-50"
          style={{
            background: 'var(--bg-card, white)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 200,
            animation: 'mf-scale-in 0.18s cubic-bezier(0.16,1,0.3,1)',
            transformOrigin: 'top right',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{profiel.naam}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: accent }}>{rolLabel}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/instellingen"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg mx-1.5"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-base">⚙️</span>
              <span>Instellingen</span>
            </Link>
            <Link
              href="/portaal"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg mx-1.5"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-base">📊</span>
              <span>Mijn portaal</span>
            </Link>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} />

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onUitloggen() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg mx-1.5 text-left"
              style={{ color: '#E24B4A', width: 'calc(100% - 12px)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-base">🚪</span>
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tab bar ──────────────────────────────────────────────── */
type Tab = { href: string; emoji: string; label: string; badge?: number }

function TabBar({ tabs, pad, accent }: { tabs: Tab[]; pad: string; accent: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--bg-card, white)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = pad === tab.href || (tab.href !== '/home' && pad.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-all active:opacity-60"
              style={{ minHeight: 58 }}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 28, height: 3, background: accent, borderRadius: '0 0 3px 3px' }}
                />
              )}

              {/* Unread badge */}
              {(tab.badge ?? 0) > 0 && (
                <span
                  className="absolute top-2.5 right-[calc(50%-18px)] min-w-[15px] h-[15px] px-1 rounded-full text-white flex items-center justify-center font-bold z-10"
                  style={{ background: '#E24B4A', fontSize: 9 }}
                >
                  {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                </span>
              )}

              <span
                className="text-2xl leading-none"
                style={{
                  opacity: isActive ? 1 : 0.35,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {tab.emoji}
              </span>
              <span
                className="text-[10px] font-semibold leading-none tracking-tight"
                style={{ color: isActive ? accent : 'var(--text-4, #9CA3AF)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'var(--bg-card, white)' }} />
    </nav>
  )
}

/* ── Main Navbar ──────────────────────────────────────────── */
export default function Navbar() {
  const router   = useRouter()
  const pad      = usePathname()
  const [profiel, setProfiel]     = useState<Profiel | null>(null)
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
    const bid    = profiel.bedrijf_id
    const mijnId = profiel.id
    if (pad === '/chat') {
      localStorage.setItem(`MentaForce_chat_seen_${bid}`, new Date().toISOString())
      setOngelezen(0); return
    }
    let actief = true
    ;(async () => {
      try {
        const { count } = await supabase.from('berichten')
          .select('id', { count: 'exact', head: true })
          .eq('bedrijf_id', bid).neq('user_id', mijnId)
          .gt('aangemaakt_op', localStorage.getItem(`MentaForce_chat_seen_${bid}`) ?? '1970-01-01')
        if (actief) setOngelezen(count ?? 0)
      } catch { /* table may not exist yet */ }
    })()
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

  const echteRol    = profiel?.rol ?? 'medewerker'
  const isAdmin     = echteRol === 'admin'
  const rol         = isAdmin && bekijkAls ? bekijkAls : echteRol
  const accent      = ACCENT[rol] ?? ACCENT.medewerker
  const isInPreview = isAdmin && !!bekijkAls

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
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2"
          style={{ background: '#1e1340', borderBottom: '1px solid #2d1f60' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 tracking-wide uppercase"
              style={{ background: '#8B5CF6', color: 'white' }}
            >
              Preview
            </span>
            <span className="text-xs text-gray-300 truncate">
              Als <strong className="text-white">{bekijkAls === 'hr' ? 'HR' : 'Medewerker'}</strong>
            </span>
          </div>
          <button
            onClick={() => { localStorage.removeItem(BEKIJK_ALS_KEY); setBekijkAls(null); router.push('/admin') }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition"
            style={{ background: 'rgba(139,92,246,0.25)', color: '#c4b5fd' }}
          >
            ← Terug naar Admin
          </button>
        </div>
      )}

      {/* Top bar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'var(--bg-card, white)',
          borderBottom: '1px solid var(--border)',
          borderTop: `3px solid ${accent}`,
          marginTop: isInPreview ? 36 : 0,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div className="flex items-center px-4 py-3 gap-3 max-w-lg mx-auto">
          {/* Logo */}
          <Link
            href={rol === 'medewerker' ? '/home' : rol === 'hr' ? '/dashboard' : '/admin'}
            className="flex-shrink-0 transition-opacity hover:opacity-75"
            aria-label="MentaForce home"
          >
            <LogoIcon size={32} />
          </Link>

          {/* Page title */}
          <h1
            className="flex-1 text-[15px] font-semibold truncate"
            style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}
          >
            {paginaTitel}
          </h1>

          {/* User menu */}
          {profiel ? (
            <UserMenu profiel={profiel} onUitloggen={uitloggen} accent={accent} />
          ) : (
            <div className="w-[34px] h-[34px] rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          )}
        </div>
      </header>

      {/* Bottom tab bar */}
      <TabBar tabs={tabs} pad={pad} accent={accent} />

      {/* Content spacer */}
      <div style={{ height: 'calc(72px + env(safe-area-inset-bottom, 0px))' }} className="pointer-events-none" />
    </>
  )
}
