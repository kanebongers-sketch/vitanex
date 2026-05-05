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

function rolLabel(rol: string) {
  if (rol === 'admin') return { label: 'Staff Vitanex', bg: '#EEEDFE', color: '#3C3489' }
  if (rol === 'hr') return { label: 'HR', bg: '#E1F5EE', color: '#0F6E56' }
  return { label: 'Werknemer', bg: '#E6F1FB', color: '#185FA5' }
}

function NavDropdown({
  label,
  items,
  currentPath,
}: {
  label: string
  items: { href: string; label: string; emoji?: string; badge?: number }[]
  currentPath: string
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
          color: isActive ? 'var(--vitanex-primary)' : '#6b7280',
          background: isActive ? 'var(--vitanex-primary-light)' : 'transparent',
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {label}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl py-1.5 z-50 min-w-[200px]"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
        >
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-gray-50"
              style={{
                color: currentPath === item.href ? 'var(--vitanex-primary)' : '#374151',
                fontWeight: currentPath === item.href ? 500 : 400,
                background: currentPath === item.href ? 'var(--vitanex-primary-light)' : undefined,
              }}
            >
              {item.emoji && <span className="w-5 text-center text-base">{item.emoji}</span>}
              <span className="flex-1">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center font-medium"
                  style={{ background: '#E24B4A', fontSize: 10 }}
                >
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

function UserMenu({ profiel, onUitloggen }: { profiel: Profiel; onUitloggen: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rolBadge = rolLabel(profiel.rol)

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
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={32} />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-gray-800">{profiel.naam || 'Gebruiker'}</span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: rolBadge.bg, color: rolBadge.color }}
          >
            {rolBadge.label}
          </span>
        </div>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl py-1.5 z-50 min-w-[170px]"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
        >
          <Link
            href="/instellingen"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span>⚙️</span> Instellingen
          </Link>
          <div className="mx-3 my-1 border-t border-gray-100" />
          <button
            onClick={() => { setOpen(false); onUitloggen() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
          >
            <span>→</span> Uitloggen
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const router = useRouter()
  const pad = usePathname()
  const [profiel, setProfiel] = useState<Profiel | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ongelezen, setOngelezen] = useState(0)

  useEffect(() => { setMobileOpen(false) }, [pad])

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
    }
    laadProfiel()

    // Luister naar sessiewijzigingen (uitloggen, token verlopen)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') router.push('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!profiel?.bedrijf_id || !profiel?.id) return
    const bid = profiel.bedrijf_id
    const mijnId = profiel.id

    if (pad === '/chat') {
      localStorage.setItem(`vitanex_chat_seen_${bid}`, new Date().toISOString())
      setOngelezen(0)
      return
    }

    let actief = true

    async function haalOngelezenOp() {
      const lastSeen = localStorage.getItem(`vitanex_chat_seen_${bid}`) ?? '1970-01-01'
      try {
        const { count } = await supabase
          .from('berichten')
          .select('id', { count: 'exact', head: true })
          .eq('bedrijf_id', bid)
          .neq('user_id', mijnId)
          .gt('aangemaakt_op', lastSeen)
        if (actief) setOngelezen(count ?? 0)
      } catch { /* berichten table may not exist yet */ }
    }
    haalOngelezenOp()

    const channel = supabase
      .channel(`nav-chat-${bid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'berichten', filter: `bedrijf_id=eq.${bid}` },
        (payload) => {
          const nieuw = payload.new as { user_id: string }
          if (nieuw.user_id !== mijnId && actief) setOngelezen(prev => prev + 1)
        }
      )
      .subscribe()

    return () => { actief = false; supabase.removeChannel(channel) }
  }, [profiel, pad])

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const rol = profiel?.rol ?? 'medewerker'
  const isHR = rol === 'hr' || rol === 'admin'
  const isAdmin = rol === 'admin'

  const mainLinks = [
    { href: '/checkin', label: 'Check-in' },
    { href: '/portaal', label: 'Portaal' },
    { href: '/coach', label: 'Coach' },
    { href: '/chat', label: 'Chat', badge: ongelezen },
  ]

  const toolsLinks = [
    { href: '/surveys', label: 'Surveys', emoji: '📋' },
    { href: '/focus', label: 'Focus & Herstel', emoji: '🫁' },
    { href: '/journal', label: 'Journal', emoji: '📓' },
    { href: '/burnout', label: 'Burn-out scan', emoji: '🔥' },
  ]

  const hrLinks = [
    { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { href: '/team', label: 'Team', emoji: '👥' },
    { href: '/rapport', label: 'Rapport', emoji: '📈' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', emoji: '⚙️' }] : []),
  ]

  const allMobileToolsLinks = toolsLinks
  const chatBadge = ongelezen

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="px-4 sm:px-8 py-3 flex items-center gap-1">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--vitanex-primary)' }}
          >
            <span className="text-white text-xs font-semibold">V</span>
          </div>
          <span className="font-semibold text-gray-900 text-base">Vitanex</span>
        </Link>

        {/* Desktop main links */}
        <div className="hidden sm:flex items-center gap-0.5 flex-1">
          {mainLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="relative px-3 py-1.5 rounded-lg text-sm transition"
              style={{
                color: pad === l.href ? 'var(--vitanex-primary)' : '#6b7280',
                background: pad === l.href ? 'var(--vitanex-primary-light)' : 'transparent',
                fontWeight: pad === l.href ? 500 : 400,
              }}
            >
              {l.label}
              {(l.badge ?? 0) > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-white flex items-center justify-center font-medium"
                  style={{ background: '#E24B4A', fontSize: 10 }}
                >
                  {(l.badge ?? 0) > 9 ? '9+' : l.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Tools dropdown */}
          <NavDropdown label="Meer" items={toolsLinks} currentPath={pad} />

          {/* HR dropdown */}
          {isHR && (
            <NavDropdown label="HR" items={hrLinks} currentPath={pad} />
          )}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Desktop user menu */}
        {profiel && (
          <div className="hidden sm:block ml-2">
            <UserMenu profiel={profiel} onUitloggen={uitloggen} />
          </div>
        )}

        {/* Mobile: badge + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {chatBadge > 0 && pad !== '/chat' && (
            <span
              className="min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center font-medium"
              style={{ background: '#E24B4A', fontSize: 10 }}
            >
              {chatBadge > 9 ? '9+' : chatBadge}
            </span>
          )}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition"
            aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
          >
            {mobileOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3">

            {/* Main */}
            <div className="flex flex-col gap-0.5 mb-2">
              {mainLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition"
                  style={{
                    color: pad === l.href ? 'var(--vitanex-primary)' : '#374151',
                    background: pad === l.href ? 'var(--vitanex-primary-light)' : 'transparent',
                    fontWeight: pad === l.href ? 500 : 400,
                  }}
                >
                  <span>{l.label}</span>
                  {(l.badge ?? 0) > 0 && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center font-medium"
                      style={{ background: '#E24B4A', fontSize: 10 }}
                    >
                      {(l.badge ?? 0) > 9 ? '9+' : l.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Tools section */}
            <div className="border-t border-gray-100 pt-2.5 mb-2">
              <p className="text-xs font-semibold text-gray-400 px-3 mb-1.5 uppercase tracking-widest">Tools</p>
              <div className="flex flex-col gap-0.5">
                {allMobileToolsLinks.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition"
                    style={{
                      color: pad === l.href ? 'var(--vitanex-primary)' : '#374151',
                      background: pad === l.href ? 'var(--vitanex-primary-light)' : 'transparent',
                      fontWeight: pad === l.href ? 500 : 400,
                    }}
                  >
                    <span>{l.emoji}</span>
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* HR section */}
            {isHR && (
              <div className="border-t border-gray-100 pt-2.5 mb-2">
                <p className="text-xs font-semibold text-gray-400 px-3 mb-1.5 uppercase tracking-widest">HR</p>
                <div className="flex flex-col gap-0.5">
                  {hrLinks.map(l => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition"
                      style={{
                        color: pad === l.href ? 'var(--vitanex-primary)' : '#374151',
                        background: pad === l.href ? 'var(--vitanex-primary-light)' : 'transparent',
                        fontWeight: pad === l.href ? 500 : 400,
                      }}
                    >
                      <span>{l.emoji}</span>
                      <span>{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* User */}
            {profiel && (
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <Link
                  href="/instellingen"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <Avatar naam={profiel.naam || 'G'} avatarUrl={profiel.avatar_url} size={32} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-gray-800">{profiel.naam || 'Gebruiker'}</span>
                    <span className="text-xs" style={{ color: rolLabel(profiel.rol).color }}>
                      {rolLabel(profiel.rol).label}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={uitloggen}
                  className="text-xs text-gray-400 hover:text-gray-600 transition px-3 py-1.5 rounded-lg border border-gray-100"
                >
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
