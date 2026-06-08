'use client'

import React, { useEffect, useLayoutEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTileDef, type TileId } from '@/lib/tiles'
import { laadXPData, berekenLevel, LEVEL_KLEUREN, LEVEL_BG } from '@/lib/xp'

/* ── Types ── */
type Profiel = { id: string; naam: string; rol: string; bedrijf_id: string | null }
type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean }
type NavSection = { label: string; items: NavItem[] }
export type ViewMode = 'employee' | 'hr' | 'admin'

/* ── Portaal wisselen — alleen via Instellingen aanroepen ── */
export function schakelPortaal(mode: ViewMode) {
  localStorage.setItem('mf-view-mode', mode)
  // Harde navigatie zodat Navbar opnieuw init
  window.location.href = mode === 'employee' ? '/home' : mode === 'hr' ? '/hr' : '/admin'
}

/* ── Icoon helper ── */
function Ico({ d, size = 16 }: { d: string | string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

/* ── Sidebar nav-sectie ── */
function NavSection({ section, pathname, accent, hover }: {
  section: NavSection; pathname: string; accent: string; hover: string
}) {
  return (
    <div style={{ marginBottom: 2 }}>
      <p style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: hover,
        padding: '10px 14px 5px',
      }}>{section.label}</p>
      {section.items.map(item => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', margin: '1px 8px', borderRadius: 7,
            background: active ? accent + '22' : 'transparent',
            color: active ? accent : hover,
            fontSize: 13, fontWeight: active ? 600 : 400,
            textDecoration: 'none', transition: 'background 0.12s, color 0.12s',
          }}>
            <span style={{ color: active ? accent : hover, display: 'flex', flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ── Iconen ── */
const I = {
  home:    <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  sport:   <Ico d={['M6.5 6.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', 'M6 10l-3 8h6l1-4 4 4 5-8', 'M14 6l2-2 3 3-2 2']} />,
  voeding: <Ico d={['M12 2a7 7 0 0 1 7 7c0 3-2 5.5-5 6.7V21h-4v-5.3C7 14.5 5 12 5 9a7 7 0 0 1 7-7z', 'M9 21h6']} />,
  check:   <Ico d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  coach:   <Ico d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  rapport: <Ico d={['M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z']} />,
  doelen:  <Ico d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  uitd:    <Ico d="M5 3l14 9-14 9V3z" />,
  journal: <Ico d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  burnout: <Ico d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z" />,
  focus:   <Ico d={['M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z']} />,
  team:    <Ico d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0', 'M16 3.13a4 4 0 0 1 0 7.75']} />,
  chart:   <Ico d="M23 6 13.5 15.5 8.5 10.5 1 18 M17 6h6v6" />,
  prot:    <Ico d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8']} />,
  nieuws:  <Ico d={['M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2', 'M18 14h-8', 'M15 18h-5', 'M10 6h8v4h-8V6z']} />,
  gear:    <Ico d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />,
  koppel:  <Ico d={['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']} />,
  verlof:  <Ico d={['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z']} />,
  chat:    <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  dash:    <Ico d={['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']} />,
  shield:  <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  logout:  <Ico d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']} />,
}

export const SIDEBAR_W = 240

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [profiel, setProfiel]           = useState<Profiel | null>(null)
  const [werkdagItems, setWerkdagItems] = useState<NavItem[]>([])
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [viewMode, setViewMode]         = useState<ViewMode>('employee')
  const [fitLevel, setFitLevel]         = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return
      const { data } = await supabase.from('profiles')
        .select('naam, rol, bedrijf_id').eq('id', user.id).single()
      if (!mounted || !data) return
      setProfiel({ id: user.id, ...data })

      // Bepaal view mode:
      // - gewone medewerker: altijd 'employee'
      // - hr: altijd 'hr'
      // - admin: leest localStorage, default 'admin'
      const rol = data.rol as string
      if (rol === 'admin') {
        const saved = localStorage.getItem('mf-view-mode') as ViewMode | null
        if (mounted) setViewMode(saved ?? 'admin')
      } else if (rol === 'hr') {
        if (mounted) setViewMode('hr')
      } else {
        // medewerker, zelfstandige, en alle andere rollen → employee portaal
        if (mounted) setViewMode('employee')
      }

      try { if (mounted) setFitLevel(berekenLevel(laadXPData().xp)) } catch { /* non-critical */ }

      // ── Wekelijkse check-in gate (alleen voor medewerkers/gebruikers) ──
      const effectiefViewMode = rol === 'admin'
        ? (localStorage.getItem('mf-view-mode') ?? 'admin')
        : rol === 'hr' ? 'hr' : 'employee'

      const VRIJGESTELD = [
        '/checkin', '/disc', '/login', '/register', '/onboarding',
        '/instellingen', '/', '/contact', '/voorwaarden', '/bedankt',
      ]
      const isVrijgesteld = VRIJGESTELD.some(p =>
        pathname === p || pathname.startsWith('/hr') || pathname.startsWith('/admin') ||
        pathname.startsWith('/agent') || pathname === '/dashboard'
      )

      if (effectiefViewMode === 'employee' && !isVrijgesteld) {
        const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: sessie } = await supabase
          .from('checkin_sessies')
          .select('id')
          .eq('user_id', user.id)
          .gte('aangemaakt_op', zevenDagenGeleden)
          .limit(1)
          .maybeSingle()

        if (!sessie && mounted) {
          router.replace('/checkin')
          return
        }
      }

      // ── DISC gate (alleen voor medewerkers met bedrijf_id) ──
      if (effectiefViewMode === 'employee' && data.bedrijf_id && pathname !== '/disc') {
        const { data: bedrijf } = await supabase
          .from('bedrijven')
          .select('disc_verplicht')
          .eq('id', data.bedrijf_id)
          .maybeSingle()

        if (bedrijf?.disc_verplicht) {
          const { data: discInzending } = await supabase
            .from('disc_inzendingen')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

          if (!discInzending && mounted) {
            router.replace('/disc')
            return
          }
        }
      }

      if (data.bedrijf_id) {
        const { data: config } = await supabase
          .from('portaal_config').select('tiles').eq('bedrijf_id', data.bedrijf_id).single()
        if (!mounted) return
        if (config?.tiles && Array.isArray(config.tiles)) {
          const TILE_SVG: Partial<Record<TileId, React.ReactNode>> = {
            verlof:      <Ico d={['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10']} />,
            uren:        <Ico d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
            declaraties: <Ico d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M12 18v-6', 'M9 15h6']} />,
            loonstroken: <Ico d={['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} />,
            nieuws:      I.nieuws,
            directory:   I.team,
            protocollen: I.prot,
            surveys:     <Ico d={['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2', 'M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2', 'M9 14l2 2 4-4']} />,
          }
          const werkdagIds: TileId[] = ['verlof','uren','declaraties','loonstroken','nieuws','directory','protocollen','surveys']
          const items: NavItem[] = (config.tiles as TileId[])
            .filter(id => werkdagIds.includes(id))
            .map(id => getTileDef(id))
            .filter(Boolean)
            .map(t => ({ href: t!.path, label: t!.label, icon: TILE_SVG[t!.id] ?? <Ico d="M4 6h16M4 12h16M4 18h16" /> }))
          setWerkdagItems(items)
        }
      }
    }
    laad()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(e => {
      if (e === 'SIGNED_OUT') router.push('/login')
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname])

  useLayoutEffect(() => {
    document.body.classList.add('mf-has-sidebar')
    return () => document.body.classList.remove('mf-has-sidebar')
  }, [])

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profiel) return null

  const naam    = profiel.naam ?? ''
  // Elke portal heeft zijn eigen kleurschema — volledig gescheiden
  const isDark  = viewMode === 'hr' || viewMode === 'admin'

  /* ── Kleurenschema per portaal ── */
  const ACCENT     = viewMode === 'admin' ? '#7C3AED' : '#1D9E75'
  const bg         = viewMode === 'employee' ? '#FFFFFF' : viewMode === 'hr' ? '#14151f' : '#1a0533'
  const border     = isDark  ? 'rgba(255,255,255,0.07)' : '#E5E7EB'
  const text       = isDark  ? 'rgba(255,255,255,0.6)'  : '#4B5563'
  const textMuted  = isDark  ? 'rgba(255,255,255,0.28)' : '#9CA3AF'
  const nameTxt    = isDark  ? 'rgba(255,255,255,0.88)' : '#111827'
  const activeBg   = viewMode === 'employee' ? '#F0FDF8' : ACCENT + '22'

  /* ── Navigatie per portaal ── */
  const isWerknemer = viewMode === 'employee' && !!profiel?.bedrijf_id
  const portalLabel = viewMode === 'employee'
    ? (isWerknemer ? 'Werknemersportaal' : 'Persoonlijk portaal')
    : viewMode === 'hr' ? 'HR Portaal' : 'Admin Portaal'

  const DEFAULT_WERKDAG_ITEMS: NavItem[] = [
    { href: '/bestanden',   label: 'Mijn bestanden', icon: <Ico d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6']} /> },
    { href: '/verlof',      label: 'Verlof',      icon: <Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /> },
    { href: '/uren',        label: 'Uren',        icon: <Ico d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /> },
    { href: '/declaraties', label: 'Declaraties', icon: <Ico d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M12 18v-6', 'M9 15h6']} /> },
    { href: '/loonstroken', label: 'Loonstroken', icon: <Ico d={['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} /> },
    { href: '/nieuws',      label: 'Nieuws',      icon: I.nieuws },
    { href: '/protocollen', label: 'Protocollen', icon: I.prot },
    { href: '/directory',   label: 'Collega\'s',  icon: I.team },
  ]

  const effectiefWerkdagItems = werkdagItems.length > 0 ? werkdagItems : (isWerknemer ? DEFAULT_WERKDAG_ITEMS : [])

  const sections: NavSection[] = viewMode === 'employee' ? [
    {
      label: 'Mijn week',
      items: [
        { href: '/checkin', label: 'Check-in',    icon: I.check },
        { href: '/rapport', label: 'Mijn rapport', icon: I.rapport },
      ],
    },
    {
      label: 'Begeleiding',
      items: [
        { href: '/coach',       label: 'AI Coach',     icon: I.coach },
        { href: '/doelen',      label: 'Doelen',       icon: I.doelen },
        { href: '/uitdagingen', label: 'Uitdagingen',  icon: I.uitd },
        { href: '/disc',        label: 'DISC test',    icon: <Ico d={['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z','M8 12h8','M12 8v8']} /> },
        { href: '/sport',       label: 'Sport & Fitness', icon: I.sport },
        { href: '/voeding',     label: 'Voeding',         icon: I.voeding },
      ],
    },
    {
      label: 'Zelfzorg',
      items: [
        { href: '/journal',     label: 'Journal',       icon: I.journal },
        { href: '/focus',       label: 'Focus',         icon: I.focus },
        { href: '/burnout',     label: 'Burn-out scan', icon: I.burnout },
        { href: '/koppelingen', label: 'Koppelingen',   icon: I.koppel },
      ],
    },
    ...(isWerknemer ? [{
      label: 'Planning',
      items: [
        { href: '/roosters',        label: 'Mijn rooster',    icon: <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /> },
        { href: '/mijn-gesprekken', label: 'Mijn gesprekken', icon: <Ico d={['M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2v4l.586-.586z']} /> },
      ],
    }] : []),
    ...(effectiefWerkdagItems.length > 0 ? [{ label: 'Werkdag', items: effectiefWerkdagItems }] : []),
  ] : viewMode === 'hr' ? [
    {
      label: 'Overzicht',
      items: [
        { href: '/hr',        label: 'Dashboard',   icon: I.dash, exact: true },
        { href: '/dashboard', label: 'HR Analytics', icon: I.chart },
        { href: '/team',      label: 'Team',         icon: I.team },
      ],
    },
    {
      label: 'Planning',
      items: [
        { href: '/roosters',   label: 'Roosters',    icon: <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /> },
        { href: '/hr/gesprekken', label: 'Gesprekken', icon: <Ico d={['M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2v4l.586-.586z']} /> },
      ],
    },
    {
      label: 'Inrichten',
      items: [
        { href: '/hr/protocollen', label: 'Protocollen', icon: I.prot },
        { href: '/nieuws',         label: 'Nieuws',       icon: I.nieuws },
        { href: '/surveys',        label: 'Surveys',      icon: I.check },
      ],
    },
    {
      label: 'Beheren',
      items: [
        { href: '/verlof',       label: 'Verlof',       icon: I.verlof },
        { href: '/loonstroken',  label: 'Loonstroken',  icon: I.rapport },
        { href: '/hr/bestanden', label: 'Bestanden',    icon: <Ico d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6']} /> },
        { href: '/directory',    label: 'Medewerkers',  icon: I.team },
      ],
    },
  ] : /* admin — volledig eigen portaal, niks van HR/werknemer */ [
    {
      label: 'Beheer',
      items: [
        { href: '/admin', label: 'Admin panel', icon: I.shield, exact: true },
      ],
    },
  ]

  /* ── Sidebar inhoud ── */
  function SidebarContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Brand */}
        <div style={{ padding: '18px 14px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: viewMode === 'hr' ? 'rgba(29,158,117,0.25)' : 'linear-gradient(135deg,#1D9E75,#0d7a5a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewMode === 'hr' ? '#1D9E75' : 'white',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div>
            <p style={{ color: nameTxt, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>MentaForce</p>
            <p style={{ color: textMuted, fontSize: 10, marginTop: 1 }}>{portalLabel}</p>
          </div>
        </div>

        {/* Home link */}
        <div style={{ padding: '8px 8px 0' }}>
          <Link href={viewMode === 'employee' ? '/home' : viewMode === 'hr' ? '/hr' : '/admin'} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 7,
            background: (pathname === '/home' || pathname === '/hr' || pathname === '/admin') ? activeBg : 'transparent',
            color: (pathname === '/home' || pathname === '/hr' || pathname === '/admin') ? ACCENT : text,
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none', transition: 'background 0.12s',
          }}>
            <span style={{ display: 'flex' }}>{I.home}</span>
            {viewMode === 'employee' ? 'Home' : 'Dashboard'}
          </Link>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', scrollbarWidth: 'none' }}>
          {sections.map(s => (
            <NavSection key={s.label} section={s} pathname={pathname} accent={ACCENT} hover={text} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: `1px solid ${border}` }}>
          <Link href="/chat" style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', borderRadius: 7, marginBottom: 2,
            background: pathname === '/chat' ? activeBg : 'transparent',
            color: pathname === '/chat' ? ACCENT : text,
            fontSize: 12, fontWeight: 500, textDecoration: 'none',
          }}>
            <span style={{ display: 'flex', color: textMuted }}>{I.chat}</span>
            Berichten
          </Link>
          <Link href="/instellingen" style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', borderRadius: 7, marginBottom: 4,
            background: pathname === '/instellingen' ? activeBg : 'transparent',
            color: pathname === '/instellingen' ? ACCENT : text,
            fontSize: 12, fontWeight: 500, textDecoration: 'none',
          }}>
            <span style={{ display: 'flex', color: textMuted }}>{I.gear}</span>
            Instellingen
          </Link>

          {/* Naam + uitloggen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 2px', borderTop: `1px solid ${border}` }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>{naam.slice(0, 1).toUpperCase()}</div>
              {fitLevel !== null && viewMode === 'employee' && (
                <div style={{
                  position: 'absolute', bottom: -4, right: -6,
                  background: LEVEL_BG[fitLevel] || '#F3F4F6',
                  border: `1.5px solid ${LEVEL_KLEUREN[fitLevel] || '#9CA3AF'}`,
                  borderRadius: 6, padding: '0px 4px',
                  fontSize: 9, fontWeight: 800, color: LEVEL_KLEUREN[fitLevel] || '#9CA3AF',
                  lineHeight: '14px',
                }}>{fitLevel}</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: nameTxt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {naam.split(' ')[0]}
              </p>
              <p style={{ fontSize: 10, color: textMuted }}>
                {viewMode === 'employee'
                  ? (fitLevel !== null ? `Fit Level ${fitLevel}` : isWerknemer ? 'Werknemer' : 'Gebruiker')
                  : viewMode === 'hr' ? 'HR Manager' : 'Admin'}
              </p>
            </div>
            <button onClick={uitloggen} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 2, display: 'flex' }} title="Uitloggen">
              {I.logout}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_W,
        background: bg, borderRight: `1px solid ${border}`, zIndex: 40,
        boxShadow: viewMode === 'hr' ? 'none' : '2px 0 12px rgba(0,0,0,0.04)',
        flexDirection: 'column',
        paddingTop: 'var(--safe-top, 0px)',
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <div className="flex md:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--topbar-h, 52px)',
        background: bg, borderBottom: `1px solid ${border}`,
        alignItems: 'flex-end', justifyContent: 'space-between',
        paddingBottom: 8, paddingLeft: 16, paddingRight: 16,
        paddingTop: 'var(--safe-top, 0px)',
        zIndex: 30,
      }}>
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <p style={{ color: nameTxt, fontWeight: 700, fontSize: 14 }}>MentaForce</p>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
          {naam.slice(0, 1).toUpperCase()}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.4)' }} />
          <aside id="mobile-drawer" style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_W,
            background: bg, zIndex: 50, display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--safe-top, 0px)',
          }}>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
