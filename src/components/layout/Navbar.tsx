'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const SIDEBAR_W = 240

/* ── ViewMode (portaal schakelaar) ── */
export type ViewMode = 'employee' | 'hr' | 'admin'

export function schakelPortaal(mode: ViewMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mf-view-mode', mode)
    window.dispatchEvent(new CustomEvent('mf-view-mode-change', { detail: mode }))
  }
}

/* ── Types ── */
type NavItem = { href: string; label: string }

type TopItem = {
  key: string
  label: string
  emoji: string
  href?: string
  items?: NavItem[]
  defaultOpen?: boolean
}

/* ── Navigatiestructuur ── */
const TOP_ITEMS: TopItem[] = [
  {
    key: 'vandaag',
    label: 'Vandaag',
    emoji: '📋',
    href: '/vandaag',
  },
  {
    key: 'welzijn',
    label: 'Welzijn',
    emoji: '💚',
    defaultOpen: true,
    items: [
      { href: '/stemming',          label: '😊 Stemming'          },
      { href: '/slaap',             label: '😴 Slaap'             },
      { href: '/stress',            label: '⚡ Stress'            },
      { href: '/werkgeluk',         label: '😄 Werkgeluk'         },
      { href: '/inzichten',         label: '📊 Inzichten'         },
      { href: '/rapport',           label: '📋 Rapport'           },
      { href: '/stemming-kalender', label: '📅 Stemming kalender' },
    ],
  },
  {
    key: 'actief',
    label: 'Actief',
    emoji: '🏃',
    items: [
      { href: '/sport',     label: '💪 Sport'     },
      { href: '/voeding',   label: '🍎 Voeding'   },
      { href: '/water',     label: '💧 Water'      },
      { href: '/gezondheid',label: '❤️ Gezondheid' },
      { href: '/gewoontes', label: '✅ Gewoontes'  },
      { href: '/focus',     label: '⏱ Focus'       },
    ],
  },
  {
    key: 'groeien',
    label: 'Groeien',
    emoji: '🧠',
    items: [
      { href: '/coach',       label: '🤖 AI Coach'    },
      { href: '/doelen',      label: '🎯 Doelen'       },
      { href: '/journal',     label: '📝 Journal'      },
      { href: '/meditatie',   label: '🧘 Meditatie'    },
      { href: '/ademhaling',  label: '💨 Ademhaling'   },
      { href: '/dankbaarheid',label: '🙏 Dankbaarheid' },
      { href: '/reflectie',   label: '🔍 Reflectie'    },
      { href: '/groeiplan',   label: '🌱 Groeiplan'    },
      { href: '/disc',        label: '🎭 DISC'          },
    ],
  },
  {
    key: 'profiel',
    label: 'Profiel',
    emoji: '👤',
    items: [
      { href: '/achievements', label: '🏅 Achievements' },
      { href: '/voortgang',    label: '📈 Voortgang'    },
      { href: '/instellingen', label: '⚙️ Instellingen' },
      { href: '/koppelingen',  label: '🔗 Koppelingen'  },
      { href: '/mijn-rapport', label: '📄 Mijn rapport' },
    ],
  },
]

const HR_ITEMS: NavItem[] = [
  { href: '/hr/portaal',      label: '🏢 HR Portaal'   },
  { href: '/hr/team',         label: '👥 Team'          },
  { href: '/hr/analytics',    label: '📊 Analytics'     },
  { href: '/hr/pulse-survey', label: '📋 Pulse Survey'  },
  { href: '/hr/enps',         label: '⭐ eNPS'          },
  { href: '/hr/uitdagingen',  label: '🏆 Uitdagingen'   },
]

/* ── Chevron ── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.18s ease',
        flexShrink: 0,
      }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

/* ── NavLink ── */
function NavLink({
  href,
  label,
  pathname,
  indent,
  onClick,
}: {
  href: string
  label: string
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
        padding: indent ? '7px 12px 7px 32px' : '7px 12px',
        fontSize: 13,
        color: isActive ? '#1D9E75' : '#374151',
        borderRadius: 8,
        margin: '1px 8px',
        textDecoration: 'none',
        background: isActive ? '#E1F5EE' : 'transparent',
        fontWeight: isActive ? 700 : 400,
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = '#F9FAFB'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      {label}
    </Link>
  )
}

/* ── Sidebar content ── */
function SidebarContent({
  userName,
  userRol,
  pathname,
  openSections,
  onToggleSection,
  onSignOut,
  onClose,
}: {
  userName: string | null
  userRol: string | null
  pathname: string
  openSections: Record<string, boolean>
  onToggleSection: (key: string) => void
  onSignOut: () => void
  onClose?: () => void
}) {
  const isHrOrAdmin = userRol === 'hr' || userRol === 'admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1D9E75', letterSpacing: '-0.02em' }}>
            MentaForce
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1D9E75',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8, scrollbarWidth: 'none' }}>
        {TOP_ITEMS.map((item) => {
          if (item.href) {
            /* Direct link — geen submenu */
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#1D9E75' : '#111827',
                  borderRadius: 8,
                  margin: '1px 8px',
                  textDecoration: 'none',
                  background: isActive ? '#E1F5EE' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = '#F3F4F6'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            )
          }

          /* Collapsible sectie */
          const isOpen = openSections[item.key] ?? false
          return (
            <div key={item.key} style={{ marginBottom: 2 }}>
              <button
                onClick={() => onToggleSection(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  borderRadius: 8,
                  margin: '1px 8px',
                  maxWidth: 'calc(100% - 16px)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </span>
                <Chevron open={isOpen} />
              </button>
              <div
                style={{
                  maxHeight: isOpen ? '600px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.2s ease',
                }}
              >
                {item.items?.map((sub) => (
                  <NavLink
                    key={sub.href}
                    href={sub.href}
                    label={sub.label}
                    pathname={pathname}
                    indent
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* HR sectie — conditioneel */}
        {isHrOrAdmin && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={() => onToggleSection('hr')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                borderRadius: 8,
                margin: '1px 8px',
                maxWidth: 'calc(100% - 16px)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>🏢</span>
                <span>HR</span>
              </span>
              <Chevron open={openSections['hr'] ?? false} />
            </button>
            <div
              style={{
                maxHeight: (openSections['hr'] ?? false) ? '400px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.2s ease',
              }}
            >
              {HR_ITEMS.map((sub) => (
                <NavLink
                  key={sub.href}
                  href={sub.href}
                  label={sub.label}
                  pathname={pathname}
                  indent
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Check-in CTA */}
      <div style={{ padding: '8px', borderTop: '1px solid #E5E7EB' }}>
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
            background: '#1D9E75',
            color: 'white',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#17855F'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#1D9E75'
          }}
        >
          ✅ Start check-in
        </Link>

        {/* Uitloggen */}
        <button
          onClick={onSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            marginTop: 4,
            fontSize: 13,
            color: '#6B7280',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
          }}
        >
          🚪 Uitloggen {userName ? `(${userName.split(' ')[0]})` : ''}
        </button>
      </div>
    </div>
  )
}

/* ── Mobile bottom bar tabs ── */
const MOBILE_TABS = [
  { key: 'vandaag', label: 'Vandaag', emoji: '📋', href: '/vandaag' },
  { key: 'welzijn', label: 'Welzijn', emoji: '💚', href: '/stemming' },
  { key: 'actief',  label: 'Actief',  emoji: '🏃', href: '/sport'   },
  { key: 'groeien', label: 'Groeien', emoji: '🧠', href: '/coach'   },
  { key: 'profiel', label: 'Profiel', emoji: '👤', href: '/voortgang'},
]

/* ── Main Navbar ── */
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [openMenu, setOpenMenu] = useState(false)
  const [userRol, setUserRol] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const buildInitialSections = () => {
    const initial: Record<string, boolean> = { hr: false }
    TOP_ITEMS.forEach((item) => {
      if (item.items) initial[item.key] = item.defaultOpen ?? false
    })
    return initial
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(buildInitialSections)

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
          background: 'white',
          borderRight: '1px solid #E5E7EB',
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
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 30,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1D9E75' }}>MentaForce</span>
        <button
          onClick={() => setOpenMenu((o) => !o)}
          aria-label={openMenu ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={openMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#374151',
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

      {/* Mobile slide-over */}
      {openMenu && (
        <>
          <div
            onClick={() => setOpenMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.4)' }}
          />
          <aside
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: SIDEBAR_W,
              background: 'white',
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
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.92)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -1px 16px rgba(0,0,0,0.06)',
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
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
                gap: 3,
                minHeight: 44,
                textDecoration: 'none',
                color: isActive ? '#1D9E75' : '#9CA3AF',
                fontWeight: isActive ? 700 : 400,
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.emoji}</span>
              <span style={{ fontSize: 10, lineHeight: 1 }}>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
