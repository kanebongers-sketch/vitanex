'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import { CATEGORIEEN } from '@/lib/navigatie/categorie-nav'
import {
  CalendarDays, HeartPulse, Activity, Bot, User, Clapperboard,
  Building2, Users, BarChart3, Star, Trophy,
  LayoutDashboard, Calendar, Map, Lightbulb,
  LogOut, ChevronRight, CheckCircle2, GraduationCap, UserRound,
  UserPlus, ListChecks, Apple, BookOpen, Milestone, Dumbbell, FolderKanban,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import WeekRingen from './WeekRingen'
import { Wordmark } from './Logo'

// Een categorie-tab blijft actief als je op een van zijn onderdelen zit
// (bijv. "Welzijn" oplichten terwijl je op /stemming bent).
function categorieActief(pathname: string, href: string): boolean {
  const sleutel = href.slice(1) as keyof typeof CATEGORIEEN
  const cat = CATEGORIEEN[sleutel]
  if (!cat) return false
  return cat.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
}

export const SIDEBAR_W = 240

export type ViewMode = 'employee' | 'hr' | 'admin'

export function schakelPortaal(mode: ViewMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mf-view-mode', mode)
    window.dispatchEvent(new CustomEvent('mf-view-mode-change', { detail: mode }))
  }
}

/* ── Types ── */
type NavItem = { href: string; label: string; icon?: LucideIcon }

type TopItem = {
  key: string
  label: string
  icon: LucideIcon
  href?: string
  items?: NavItem[]
  defaultOpen?: boolean
}

/* ── Navigatiestructuur ── */
const TOP_ITEMS: TopItem[] = [
  { key: 'vandaag',   label: 'Home',      icon: CalendarDays,  href: '/home'      },
  { key: 'welzijn',   label: 'Welzijn',   icon: HeartPulse,    href: '/welzijn'   },
  { key: 'vita',      label: 'Vita',      icon: Bot,           href: '/coach'     },
  { key: 'voortgang', label: 'Voortgang', icon: BarChart3,     href: '/inzichten' },
  { key: 'profiel',   label: 'Profiel',   icon: User,          href: '/profiel'   },
  {
    key: 'content',
    label: 'Content OS',
    icon: Clapperboard,
    items: [
      { href: '/content',           label: 'Dagelijkse Briefing', icon: LayoutDashboard },
      { href: '/content/kalender',  label: 'Weekkalender',        icon: Calendar        },
      { href: '/content/strategie', label: 'Strategie',           icon: Map             },
      { href: '/content/ideeen',    label: 'Ideeën Bank',         icon: Lightbulb       },
    ],
  },
]

const HR_ITEMS: NavItem[] = [
  { href: '/hr/portaal',      label: 'HR Portaal',  icon: Building2 },
  { href: '/hr/team',         label: 'Team',        icon: Users     },
  { href: '/hr/analytics',    label: 'Analytics',   icon: BarChart3 },
  { href: '/hr/pulse-survey', label: 'Pulse Survey',icon: Activity  },
  { href: '/hr/enps',         label: 'eNPS',        icon: Star      },
  { href: '/hr/uitdagingen',  label: 'Uitdagingen', icon: Trophy    },
]

// Coaching-sectie — zichtbaar voor de coach-rol (1-op-1 klantbegeleiding)
const COACH_ITEMS: NavItem[] = [
  { href: '/coaching',            label: 'Klanten',    icon: Users    },
  { href: '/coaching/uitnodigen', label: 'Uitnodigen', icon: UserPlus },
]

/* ── NavLink ── */
function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  indent,
  onClick,
}: {
  href: string
  label: string
  icon?: LucideIcon
  pathname: string
  indent?: boolean
  onClick?: () => void
}) {
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: indent ? '6px 8px 6px 32px' : '7px 12px',
        fontSize: 13,
        color: isActive ? 'var(--mf-green)' : 'var(--text-3)',
        borderRadius: 7,
        margin: '1px 8px',
        textDecoration: 'none',
        background: isActive ? 'color-mix(in srgb, var(--mf-green) 10%, transparent)' : 'transparent',
        fontWeight: isActive ? 500 : 400,
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      {Icon && <Icon size={13} strokeWidth={isActive ? 2 : 1.7} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />}
      {label}
    </Link>
  )
}

/* ── Sidebar content ── */
function SidebarContent({
  userName,
  userRol,
  heeftCoach,
  pathname,
  openSections,
  onToggleSection,
  onSignOut,
  onClose,
}: {
  userName: string | null
  userRol: string | null
  heeftCoach: boolean
  pathname: string
  openSections: Record<string, boolean>
  onToggleSection: (key: string) => void
  onSignOut: () => void
  onClose?: () => void
}) {
  const isHrOrAdmin = userRol === 'hr' || userRol === 'admin'
  const isCoach = userRol === 'coach' || userRol === 'admin'
  // Content OS is founder-/admin-tooling (briefings, strategie, ideeën) en hoort
  // niet in de navigatie van een gewone medewerker.
  const zichtbareTopItems = TOP_ITEMS.filter(
    (item) => item.key !== 'content' || userRol === 'admin'
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <Wordmark size={15} className="block" />
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          margin: '3px 0 12px 0',
        }}>Welzijn &amp; Vitaliteit</p>
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Week voortgang
          </span>
        </div>
        <WeekRingen size={28} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8, scrollbarWidth: 'none' }}>
        {zichtbareTopItems.map((item) => {
          const Icon = item.icon
          if (item.href) {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || categorieActief(pathname, item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 8px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--mf-green)' : 'var(--text-2)',
                  borderRadius: 8,
                  margin: '1px 6px',
                  textDecoration: 'none',
                  background: isActive ? 'color-mix(in srgb, var(--mf-green) 10%, transparent)' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.7} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                {item.label}
              </Link>
            )
          }

          const isOpen = openSections[item.key] ?? false
          const hasActiveChild = item.items?.some(
            (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
          ) ?? false

          return (
            <div key={item.key} style={{ marginBottom: 1 }}>
              <button
                onClick={() => onToggleSection(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 8px',
                  width: 'calc(100% - 12px)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: hasActiveChild ? 'var(--mf-green)' : 'var(--text-2)',
                  borderRadius: 8,
                  margin: '1px 6px',
                  transition: 'color 0.12s, background 0.12s',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon size={15} strokeWidth={hasActiveChild ? 2 : 1.7} style={{ flexShrink: 0, opacity: hasActiveChild ? 1 : 0.7 }} />
                  {item.label}
                </span>
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  style={{
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.18s var(--ease)',
                    opacity: 0.4,
                  }}
                />
              </button>
              <div
                style={{
                  maxHeight: isOpen ? '600px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.22s var(--ease)',
                }}
              >
                {item.items?.map((sub) => (
                  <NavLink
                    key={sub.href}
                    href={sub.href}
                    label={sub.label}
                    icon={sub.icon}
                    pathname={pathname}
                    indent
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Kane's persoonlijke command center: zijn volledige dashboard (werk,
            notities, agenda, taken, welzijn) plus het mensen-bord. Founder-only;
            de echte gate zit server-side (elke /api/lifeos-route 403't een
            niet-founder, en FounderPoort stuurt niet-founders terug). */}
        {userRol === 'admin' && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <NavLink href="/home" label="Mijn dashboard" icon={LayoutDashboard} pathname={pathname} onClick={onClose} />
            <NavLink href="/home#mensen" label="Mensen" icon={Users} pathname={pathname} onClick={onClose} />
            <NavLink href="/projecten" label="Projecten" icon={FolderKanban} pathname={pathname} onClick={onClose} />
            <NavLink href="/programma" label="Programma" icon={Dumbbell} pathname={pathname} onClick={onClose} />
            <NavLink href="/team-kpi" label="Team" icon={UsersRound} pathname={pathname} onClick={onClose} />
          </div>
        )}

        {/* HR sectie — conditioneel */}
        {isHrOrAdmin && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => onToggleSection('hr')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 8px',
                width: 'calc(100% - 12px)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-2)',
                borderRadius: 8,
                margin: '1px 6px',
                transition: 'background 0.12s',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Building2 size={15} strokeWidth={1.7} style={{ flexShrink: 0, opacity: 0.7 }} />
                HR
              </span>
              <ChevronRight
                size={12}
                strokeWidth={2}
                style={{
                  transform: (openSections['hr'] ?? false) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.18s var(--ease)',
                  opacity: 0.4,
                }}
              />
            </button>
            <div
              style={{
                maxHeight: (openSections['hr'] ?? false) ? '400px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.22s var(--ease)',
              }}
            >
              {HR_ITEMS.map((sub) => (
                <NavLink
                  key={sub.href}
                  href={sub.href}
                  label={sub.label}
                  icon={sub.icon}
                  pathname={pathname}
                  indent
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        )}

        {/* Coaching sectie — conditioneel (coach-rol) */}
        {isCoach && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => onToggleSection('coaching')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 8px',
                width: 'calc(100% - 12px)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-2)',
                borderRadius: 8,
                margin: '1px 6px',
                transition: 'background 0.12s',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <GraduationCap size={15} strokeWidth={1.7} style={{ flexShrink: 0, opacity: 0.7 }} />
                Coaching
              </span>
              <ChevronRight
                size={12}
                strokeWidth={2}
                style={{
                  transform: (openSections['coaching'] ?? false) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.18s var(--ease)',
                  opacity: 0.4,
                }}
              />
            </button>
            <div
              style={{
                maxHeight: (openSections['coaching'] ?? false) ? '400px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.22s var(--ease)',
              }}
            >
              {COACH_ITEMS.map((sub) => (
                <NavLink
                  key={sub.href}
                  href={sub.href}
                  label={sub.label}
                  icon={sub.icon}
                  pathname={pathname}
                  indent
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        )}

        {/* Coaching voor klanten — zichtbaar zodra ze aan een coach gekoppeld zijn */}
        {heeftCoach && !isCoach && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <NavLink href="/mijn-coach" label="Mijn coach" icon={UserRound} pathname={pathname} onClick={onClose} />
            <NavLink href="/mijn-taken" label="Mijn taken" icon={ListChecks} pathname={pathname} onClick={onClose} />
            <NavLink href="/mijn-traject" label="Mijn traject" icon={Milestone} pathname={pathname} onClick={onClose} />
            <NavLink href="/mijn-voeding" label="Mijn voeding" icon={Apple} pathname={pathname} onClick={onClose} />
            <NavLink href="/mijn-content" label="Van je coach" icon={BookOpen} pathname={pathname} onClick={onClose} />
          </div>
        )}
      </nav>

      {/* Check-in CTA */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <Link
          href="/checkin"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 44,
            width: '100%',
            background: 'var(--mf-green)',
            color: 'var(--bg-app)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            transition: 'background 0.15s, box-shadow 0.15s',
            boxShadow: '0 2px 10px color-mix(in srgb, var(--mf-green) 25%, transparent)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--mf-green-dark)'
            el.style.boxShadow = '0 4px 16px color-mix(in srgb, var(--mf-green) 35%, transparent)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--mf-green)'
            el.style.boxShadow = '0 2px 10px color-mix(in srgb, var(--mf-green) 25%, transparent)'
          }}
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          Start check-in
        </Link>

        <button
          onClick={onSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 8px',
            marginTop: 2,
            fontSize: 12,
            color: 'var(--text-4)',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            transition: 'color 0.12s, background 0.12s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--text-1) 6%, transparent)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
          }}
        >
          <LogOut size={13} strokeWidth={1.8} style={{ opacity: 0.6 }} />
          Uitloggen {userName ? `(${userName.split(' ')[0]})` : ''}
        </button>
      </div>
    </div>
  )
}

/* ── Mobile bottom bar tabs ── */
const MOBILE_TABS = [
  { key: 'vandaag',   label: 'Home',      icon: CalendarDays, href: '/home'      },
  { key: 'welzijn',   label: 'Welzijn',   icon: HeartPulse,   href: '/welzijn'   },
  { key: 'vita',      label: 'Vita',      icon: Bot,          href: '/coach'     },
  { key: 'voortgang', label: 'Voortgang', icon: BarChart3,    href: '/inzichten' },
  { key: 'profiel',   label: 'Profiel',   icon: User,         href: '/profiel'   },
]

/* ── Main Navbar ── */
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [openMenu, setOpenMenu] = useState(false)
  const [userRol, setUserRol] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [heeftCoach, setHeeftCoach] = useState(false)

  const buildInitialSections = () => {
    const initial: Record<string, boolean> = { hr: false }
    TOP_ITEMS.forEach((item) => {
      if (item.items) initial[item.key] = item.defaultOpen ?? false
    })
    return initial
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(buildInitialSections)

  useEffect(() => {
    document.body.classList.add('mf-has-sidebar', 'mf-has-tabbar')
    return () => {
      document.body.classList.remove('mf-has-sidebar', 'mf-has-tabbar')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return

      const { data } = await supabase
        .from('profiles')
        .select('naam, rol')
        .eq('id', user.id)
        .single()

      if (!mounted || !data) return
      setUserRol(data.rol ?? null)
      setUserName(data.naam ?? null)

      // Heeft deze gebruiker een (menselijke) coach? Dan tonen we "Mijn coach".
      const { data: koppeling } = await supabase
        .from('coach_klanten')
        .select('id')
        .eq('klant_id', user.id)
        .in('status', ['actief', 'gepauzeerd'])
        .limit(1)
        .maybeSingle()
      if (mounted) setHeeftCoach(!!koppeling)
    }

    laad()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') router.push('/login')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sharedProps = {
    userName,
    userRol,
    heeftCoach,
    pathname,
    openSections,
    onToggleSection: toggleSection,
    onSignOut: handleSignOut,
  }

  return (
    <>
      <style>{`
        .mf-sidebar { display: none; }
        .mf-topbar  { display: flex; }
        .mf-bottombar { display: flex; }
        @media (min-width: 768px) {
          .mf-sidebar   { display: flex !important; }
          .mf-topbar    { display: none !important; }
          .mf-bottombar { display: none !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="mf-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: SIDEBAR_W,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          zIndex: 40,
          flexDirection: 'column',
        }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Mobile topbar */}
      <div
        className="mf-topbar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 30,
        }}
      >
        <Wordmark size={14} />

        <button
          onClick={() => setOpenMenu((o) => !o)}
          aria-label={openMenu ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={openMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {openMenu ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile week-progress balk */}
      <div
        className="mf-topbar"
        style={{
          position: 'fixed',
          top: 52,
          left: 0,
          right: 0,
          height: 76,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 29,
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Week voortgang
        </span>
        <WeekRingen size={34} />
      </div>

      {/* Mobile slide-over */}
      {openMenu && (
        <>
          <div
            onClick={() => setOpenMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 45,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <aside
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: SIDEBAR_W,
              background: 'var(--bg-card)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <SidebarContent {...sharedProps} onClose={() => setOpenMenu(false)} />
          </aside>
        </>
      )}

      {/* Mobile bottom bar */}
      <nav
        className="mf-bottombar"
        aria-label="Hoofdnavigatie"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/') || categorieActief(pathname, tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                width: '100%',
                padding: '8px 4px 4px',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    width: 20,
                    height: 2,
                    borderRadius: 100,
                    background: 'var(--mf-green)',
                  }} />
                )}
                <Icon
                  size={isActive ? 21 : 19}
                  strokeWidth={isActive ? 2 : 1.6}
                  style={{
                    color: isActive ? 'var(--mf-green)' : 'var(--text-4)',
                    transition: 'color 0.15s, transform 0.2s var(--ease)',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
                <span style={{
                  fontSize: 9.5,
                  lineHeight: 1,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--mf-green)' : 'var(--text-4)',
                  letterSpacing: '0.01em',
                  transition: 'color 0.15s',
                }}>
                  {tab.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
