'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import { Avatar } from '@/components/Avatar'

type Profiel = {
  id: string
  naam: string
  rol: string
  bedrijf_id: string | null
  avatar_url: string | null
}

type SimRol = 'hr' | 'medewerker'

const BEKIJK_ALS_KEY = 'mentaforce_admin_view_as'

const ROL_CONFIG = {
  admin: {
    label: 'Admin',
    accent: '#8B5CF6',
    accentLight: '#EEEDFE',
    badge: { bg: '#EEEDFE', color: '#3C3489' },
  },
  hr: {
    label: 'HR',
    accent: '#185FA5',
    accentLight: '#E6F1FB',
    badge: { bg: '#E6F1FB', color: '#185FA5' },
  },
  medewerker: {
    label: 'Medewerker',
    accent: 'var(--mentaforce-primary)',
    accentLight: 'var(--mentaforce-primary-light)',
    badge: { bg: '#E1F5EE', color: '#0F6E56' },
  },
}

function getRolConfig(rol: string) {
  return ROL_CONFIG[rol as keyof typeof ROL_CONFIG] ?? ROL_CONFIG.medewerker
}

function NavDropdown({
  label, items, currentPath, accentColor,
}: {
  label: string
  items: { href: string; label: string; emoji?: string; badge?: number }[]
  currentPath: string
  accentColor: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = items.some(i => i.href === currentPath)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition select-none"
        style={{
          color: isActive ? accentColor : '#6b7280',
          background: isActive ? `${accentColor}15` : 'transparent',
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl py-1.5 z-50 min-w-[200px]"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          {items.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-gray-50"
              style={{
                color: currentPath === item.href ? accentColor : '#374151',
                fontWeight: currentPath === item.href ? 500 : 400,
                background: currentPath === item.href ? `${accentColor}10` : undefined,
              }}>
              {item.emoji && <span className="w-5 text-center text-base">{item.emoji}</span>}
              <span className="flex-1">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center font-medium"
                  style={{ background: '#E24B4A', fontSize: 10 }}>
                  {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function UserMenu({ profiel, onUitloggen, accentColor }: { profiel: Profiel; onUitloggen: () => void; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cfg = getRolConfig(profiel.rol)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 hover:opacity-80 transition">
        <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={32} />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-gray-800">{profiel.naam || 'Gebruiker'}</span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: cfg.badge.bg, color: cfg.badge.color }}>{cfg.label}</span>
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl py-1.5 z-50 min-w-[170px]"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <Link href="/instellingen" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <span>⚙️</span> Instellingen
          </Link>
          <div className="mx-3 my-1 border-t border-gray-100" />
          <button onClick={() => { setOpen(false); onUitloggen() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
            <span>→</span> Uitloggen
          </button>
        </div>
      )}
    </div>
  )
}

function NavLink({ href, label, badge, currentPath, accentColor }: {
  href: string; label: string; badge?: number; currentPath: string; accentColor: string
}) {
  const active = currentPath === href
  return (
    <Link href={href}
      className="relative px-3 py-1.5 rounded-lg text-sm transition"
      style={{ color: active ? accentColor : '#6b7280', background: active ? `${accentColor}15` : 'transparent', fontWeight: active ? 500 : 400 }}>
      {label}
      {(badge ?? 0) > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-white flex items-center justify-center font-medium"
          style={{ background: '#E24B4A', fontSize: 10 }}>
          {(badge ?? 0) > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

/* ── Bottom tab bar (mobile only) ──────────────────────────────── */
function BottomNav({ rol, pad, ongelezen, accent }: {
  rol: string; pad: string; ongelezen: number; accent: string
}) {
  const medewerkerTabs = [
    { href: '/home',    emoji: '🏠', label: 'Home' },
    { href: '/checkin', emoji: '📋', label: 'Check-in' },
    { href: '/chat',    emoji: '💬', label: 'Chat',    badge: ongelezen },
    { href: '/coach',   emoji: '🧠', label: 'Coach' },
    { href: '/portaal', emoji: '👤', label: 'Portaal' },
  ]
  const hrTabs = [
    { href: '/home',      emoji: '🏠', label: 'Home' },
    { href: '/dashboard', emoji: '📊', label: 'Dashboard' },
    { href: '/team',      emoji: '👥', label: 'Team' },
    { href: '/chat',      emoji: '💬', label: 'Chat', badge: ongelezen },
    { href: '/instellingen', emoji: '⚙️', label: 'Instellingen' },
  ]
  const adminTabs = [
    { href: '/home',      emoji: '🏠', label: 'Home' },
    { href: '/admin',     emoji: '🛡️', label: 'Admin' },
    { href: '/dashboard', emoji: '📊', label: 'HR' },
    { href: '/chat',      emoji: '💬', label: 'Chat', badge: ongelezen },
    { href: '/instellingen', emoji: '⚙️', label: 'Instellingen' },
  ]

  const tabs = rol === 'admin' ? adminTabs : rol === 'hr' ? hrTabs : medewerkerTabs

  return (
    <>
      {/* Fixed tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div className="flex items-stretch">
          {tabs.map(tab => {
            const isActive = pad === tab.href || (tab.href !== '/home' && pad.startsWith(tab.href))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-opacity active:opacity-70"
                style={{ minHeight: 56 }}
              >
                {/* badge */}
                {(tab.badge ?? 0) > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-14px)] min-w-[16px] h-4 px-0.5 rounded-full text-white flex items-center justify-center font-medium z-10"
                    style={{ background: '#E24B4A', fontSize: 9 }}>
                    {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                  </span>
                )}
                <span className="text-xl leading-none" style={{ filter: isActive ? 'none' : 'grayscale(0.6) opacity(0.55)' }}>
                  {tab.emoji}
                </span>
                <span className="text-[10px] font-medium leading-none"
                  style={{ color: isActive ? accent : '#9ca3af' }}>
                  {tab.label}
                </span>
                {/* active dot */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: accent }} />
                )}
              </Link>
            )
          })}
        </div>
        {/* safe-area spacer for iOS */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
      {/* Spacer so page content isn't hidden behind the tab bar */}
      <div className="sm:hidden" style={{ height: 72 }} />
    </>
  )
}

export default function Navbar() {
  const router = useRouter()
  const pad = usePathname()
  const [profiel, setProfiel] = useState<Profiel | null>(null)
  const [profielLaden, setProfielLaden] = useState(true)
  const [ongelezen, setOngelezen] = useState(0)
  const [bekijkAls, setBekijkAls] = useState<SimRol | null>(null)

  useEffect(() => {
    const opgeslagen = localStorage.getItem(BEKIJK_ALS_KEY) as SimRol | null
    setBekijkAls(opgeslagen)
  }, [pad])

  useEffect(() => {
    async function laadProfiel() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('naam, rol, bedrijf_id, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) setProfiel({ id: user.id, ...data })
      setProfielLaden(false)
    }
    laadProfiel()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!profiel?.bedrijf_id || !profiel?.id) return
    const bid = profiel.bedrijf_id
    const mijnId = profiel.id
    if (pad === '/chat') {
      localStorage.setItem(`MentaForce_chat_seen_${bid}`, new Date().toISOString())
      setOngelezen(0)
      return
    }
    let actief = true
    async function haalOngelezenOp() {
      const lastSeen = localStorage.getItem(`MentaForce_chat_seen_${bid}`) ?? '1970-01-01'
      try {
        const { count } = await supabase
          .from('berichten')
          .select('id', { count: 'exact', head: true })
          .eq('bedrijf_id', bid).neq('user_id', mijnId).gt('aangemaakt_op', lastSeen)
        if (actief) setOngelezen(count ?? 0)
      } catch { /* berichten table may not exist yet */ }
    }
    haalOngelezenOp()
    const channel = supabase.channel(`nav-chat-${bid}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'berichten', filter: `bedrijf_id=eq.${bid}` },
        (payload) => {
          const nieuw = payload.new as { user_id: string }
          if (nieuw.user_id !== mijnId && actief) setOngelezen(prev => prev + 1)
        })
      .subscribe()
    return () => { actief = false; supabase.removeChannel(channel) }
  }, [profiel, pad])

  async function uitloggen() {
    localStorage.removeItem(BEKIJK_ALS_KEY)
    await supabase.auth.signOut()
    router.push('/login')
  }

  function stopPreview() {
    localStorage.removeItem(BEKIJK_ALS_KEY)
    setBekijkAls(null)
    router.push('/admin')
  }

  const echteRol = profiel?.rol ?? 'medewerker'
  const isAdmin = echteRol === 'admin'
  const rol = (isAdmin && bekijkAls) ? bekijkAls : echteRol
  const cfg = getRolConfig(rol)
  const accent = profielLaden ? 'transparent' : cfg.accent
  const isInPreview = isAdmin && !!bekijkAls

  const medewerkerLinks = [
    { href: '/home',    label: 'Home' },
    { href: '/checkin', label: 'Check-in' },
    { href: '/portaal', label: 'Mijn portaal' },
    { href: '/coach',   label: 'Coach' },
    { href: '/chat',    label: 'Chat', badge: ongelezen },
  ]
  const medewerkerTools = [
    { href: '/surveys', label: 'Surveys', emoji: '📋' },
    { href: '/focus',   label: 'Focus & Herstel', emoji: '🫁' },
    { href: '/journal', label: 'Journal', emoji: '📓' },
    { href: '/burnout', label: 'Burn-out scan', emoji: '🔥' },
  ]
  const hrLinks = [
    { href: '/home',      label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/team',      label: 'Team' },
    { href: '/rapport',   label: 'Rapporten' },
    { href: '/chat',      label: 'Chat', badge: ongelezen },
  ]
  const adminLinks = [
    { href: '/home',      label: 'Home' },
    { href: '/admin',     label: 'Admin' },
    { href: '/dashboard', label: 'HR-dashboard' },
    { href: '/chat',      label: 'Chat', badge: ongelezen },
  ]
  const adminTools = [
    { href: '/team',    label: 'Team',      emoji: '👥' },
    { href: '/rapport', label: 'Rapporten', emoji: '📈' },
  ]

  const primaryLinks =
    rol === 'admin' ? adminLinks :
    rol === 'hr'    ? hrLinks    :
    medewerkerLinks

  const homeHref =
    rol === 'admin' ? '/admin' :
    rol === 'hr'    ? '/dashboard' :
    '/home'

  return (
    <>
      {/* Admin preview banner */}
      {isInPreview && (
        <div className="w-full sticky top-0 z-50 flex items-center justify-between px-4 py-2 gap-3"
          style={{ background: '#1e1340', borderBottom: '1px solid #2d1f60' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#8B5CF6', color: 'white' }}>ADMIN PREVIEW</span>
            <span className="text-xs text-gray-300 truncate">
              Je bekijkt als <strong className="text-white">{bekijkAls === 'hr' ? 'HR-manager' : 'Medewerker'}</strong>
            </span>
          </div>
          <button onClick={stopPreview}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.25)', color: '#c4b5fd' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Terug naar Admin
          </button>
        </div>
      )}

      {/* ── Top bar ── */}
      <nav className="w-full bg-white border-b border-gray-100 sticky z-40 top-0"
        style={{ borderTop: `3px solid ${accent}` }}>
        <div className="px-4 sm:px-8 py-3 flex items-center gap-1">

          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2 flex-shrink-0 mr-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent }}>
              <span className="text-white text-xs font-semibold">M</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm hidden sm:block">MentaForce</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-0.5 flex-1">
            {profielLaden ? (
              [80, 96, 60, 52].map(w => (
                <div key={w} className="h-7 rounded-lg bg-gray-100 animate-pulse" style={{ width: w }} />
              ))
            ) : (
              <>
                {primaryLinks.map(l => (
                  <NavLink key={l.href} href={l.href} label={l.label} badge={l.badge} currentPath={pad} accentColor={accent} />
                ))}
                {rol === 'medewerker' && (
                  <NavDropdown label="Meer" items={medewerkerTools} currentPath={pad} accentColor={accent} />
                )}
                {rol === 'admin' && (
                  <NavDropdown label="Meer" items={adminTools} currentPath={pad} accentColor={accent} />
                )}
              </>
            )}
          </div>

          {/* Mobile: page title in centre */}
          <div className="flex-1 sm:hidden flex justify-center">
            <span className="text-sm font-semibold text-gray-800">MentaForce</span>
          </div>

          {/* Right: user avatar (desktop full menu, mobile avatar only) */}
          {profiel ? (
            <>
              {/* Desktop */}
              <div className="hidden sm:block ml-2">
                <UserMenu profiel={profiel} onUitloggen={uitloggen} accentColor={accent} />
              </div>
              {/* Mobile: avatar → instellingen */}
              <Link href="/instellingen" className="sm:hidden flex-shrink-0">
                <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={32} />
              </Link>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          )}
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <BottomNav rol={rol} pad={pad} ongelezen={ongelezen} accent={accent} />
    </>
  )
}
