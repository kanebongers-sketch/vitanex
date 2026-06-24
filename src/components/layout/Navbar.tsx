'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const SIDEBAR_W = 240

export type ViewMode = 'employee' | 'hr' | 'admin'

export function schakelPortaal(mode: ViewMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mf-view-mode', mode)
    window.dispatchEvent(new CustomEvent('mf-view-mode-change', { detail: mode }))
  }
}

/* ── SVG Icons ── */
function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  )
}

const IconCalendar = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
)

const IconHeart = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
)

const IconActivity = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Svg>
)

const IconLayers = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </Svg>
)

const IconUser = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
)

const IconFilm = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </Svg>
)

const IconBuilding = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
)

const IconCheck = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
)

const IconLogOut = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
)

/* ── Types ── */
type NavItem = { href: string; label: string }

type TopItem = {
  key: string
  label: string
  icon: React.ReactNode
  href?: string
  items?: NavItem[]
  defaultOpen?: boolean
}

/* ── Navigatiestructuur ── */
const TOP_ITEMS: TopItem[] = [
  {
    key: 'vandaag',
    label: 'Vandaag',
    icon: <IconCalendar />,
    href: '/vandaag',
  },
  {
    key: 'welzijn',
    label: 'Welzijn',
    icon: <IconHeart />,
    defaultOpen: true,
    items: [
      { href: '/stemming',          label: 'Stemming'          },
      { href: '/slaap',             label: 'Slaap'             },
      { href: '/stress',            label: 'Stress'            },
      { href: '/werkgeluk',         label: 'Werkgeluk'         },
      { href: '/inzichten',         label: 'Inzichten'         },
      { href: '/patronen',          label: 'Mijn patronen'     },
      { href: '/rapport',           label: 'Rapport'           },
      { href: '/stemming-kalender', label: 'Stemming kalender' },
    ],
  },
  {
    key: 'actief',
    label: 'Actief',
    icon: <IconActivity />,
    items: [
      { href: '/sport',      label: 'Sport'      },
      { href: '/voeding',    label: 'Voeding'    },
      { href: '/water',      label: 'Water'       },
      { href: '/gezondheid', label: 'Gezondheid'  },
      { href: '/gewoontes',  label: 'Gewoontes'   },
      { href: '/focus',      label: 'Focus'       },
    ],
  },
  {
    key: 'groeien',
    label: 'Groeien',
    icon: <IconLayers />,
    items: [
      { href: '/coach',        label: 'AI Coach'    },
      { href: '/doelen',       label: 'Doelen'       },
      { href: '/journal',      label: 'Journal'      },
      { href: '/meditatie',    label: 'Meditatie'    },
      { href: '/ademhaling',   label: 'Ademhaling'   },
      { href: '/dankbaarheid', label: 'Dankbaarheid' },
      { href: '/reflectie',    label: 'Reflectie'    },
      { href: '/groeiplan',    label: 'Groeiplan'    },
      { href: '/disc',         label: 'DISC'          },
    ],
  },
  {
    key: 'profiel',
    label: 'Profiel',
    icon: <IconUser />,
    items: [
      { href: '/achievements',  label: 'Achievements' },
      { href: '/voortgang',     label: 'Voortgang'    },
      { href: '/instellingen',  label: 'Instellingen' },
      { href: '/koppelingen',   label: 'Koppelingen'  },
      { href: '/mijn-rapport',  label: 'Mijn rapport' },
    ],
  },
  {
    key: 'content',
    label: 'Content OS',
    icon: <IconFilm />,
    items: [
      { href: '/content',           label: 'Dagelijkse Briefing' },
      { href: '/content/kalender',  label: 'Weekkalender'        },
      { href: '/content/strategie', label: 'Strategie'           },
      { href: '/content/ideeen',    label: 'Ideeën Bank'         },
    ],
  },
]

const HR_ITEMS: NavItem[] = [
  { href: '/hr/portaal',      label: 'HR Portaal'   },
  { href: '/hr/team',         label: 'Team'          },
  { href: '/hr/analytics',    label: 'Analytics'     },
  { href: '/hr/pulse-survey', label: 'Pulse Survey'  },
  { href: '/hr/enps',         label: 'eNPS'          },
  { href: '/hr/uitdagingen',  label: 'Uitdagingen'   },
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
        padding: indent ? '6px 12px 6px 36px' : '7px 12px',
        fontSize: 13,
        color: isActive ? 'var(--mf-green)' : 'var(--text-3)',
        borderRadius: 7,
        margin: '1px 8px',
        textDecoration: 'none',
        background: isActive ? 'var(--mf-green-light, #E1F5EE)' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-subtle)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      {indent && (
        <span style={{
          position: 'absolute',
          left: 20,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: isActive ? 'var(--mf-green)' : 'var(--text-4)',
          flexShrink: 0,
        }} />
      )}
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
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{
          fontFamily: 'var(--font-display, Georgia, serif)',
          fontStyle: 'italic',
          fontSize: 20,
          fontWeight: 400,
          color: 'var(--mf-green)',
          display: 'block',
        }}>
          MentaForce
        </span>
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          margin: '3px 0 0 0',
        }}>Welzijn &amp; Vitaliteit</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8, scrollbarWidth: 'none' }}>
        {TOP_ITEMS.map((item) => {
          if (item.href) {
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
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--mf-green)' : 'var(--text-1)',
                  borderRadius: 8,
                  margin: '1px 8px',
                  textDecoration: 'none',
                  background: isActive ? 'var(--mf-green-light, #E1F5EE)' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-subtle)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }}
              >
                <span style={{ color: isActive ? 'var(--mf-green)' : 'var(--text-3)', display: 'flex' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          }

          const isOpen = openSections[item.key] ?? false
          const hasActiveChild = item.items?.some(
            (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
          ) ?? false

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
                  borderLeft: hasActiveChild ? '2px solid var(--mf-green)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: hasActiveChild ? 700 : 500,
                  color: hasActiveChild ? 'var(--text-1)' : 'var(--text-2)',
                  borderRadius: 8,
                  margin: '1px 8px',
                  maxWidth: 'calc(100% - 16px)',
                  transition: 'color 0.12s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: hasActiveChild ? 'var(--mf-green)' : 'var(--text-3)', display: 'flex' }}>
                    {item.icon}
                  </span>
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
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
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
                borderLeft: '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-2)',
                borderRadius: 8,
                margin: '1px 8px',
                maxWidth: 'calc(100% - 16px)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--text-3)', display: 'flex' }}>
                  <IconBuilding />
                </span>
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
            color: 'white',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            transition: 'background 0.15s, box-shadow 0.15s',
            boxShadow: '0 2px 10px rgba(29,158,117,0.25)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--mf-green-dark)'
            el.style.boxShadow = '0 4px 16px rgba(29,158,117,0.35)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--mf-green)'
            el.style.boxShadow = '0 2px 10px rgba(29,158,117,0.25)'
          }}
        >
          <IconCheck size={15} />
          Start check-in
        </Link>

        <button
          onClick={onSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            marginTop: 4,
            fontSize: 13,
            color: 'var(--text-3)',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)' }}
        >
          <IconLogOut size={14} />
          Uitloggen {userName ? `(${userName.split(' ')[0]})` : ''}
        </button>
      </div>
    </div>
  )
}

/* ── Mobile bottom bar tabs ── */
const MOBILE_TABS = [
  { key: 'vandaag', label: 'Vandaag', icon: <IconCalendar size={20} />, href: '/vandaag' },
  { key: 'welzijn', label: 'Welzijn', icon: <IconHeart size={20} />,    href: '/stemming' },
  { key: 'actief',  label: 'Actief',  icon: <IconActivity size={20} />, href: '/sport'   },
  { key: 'groeien', label: 'Groeien', icon: <IconLayers size={20} />,   href: '/coach'   },
  { key: 'profiel', label: 'Profiel', icon: <IconUser size={20} />,     href: '/voortgang'},
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
        <span style={{
          fontFamily: 'var(--font-display, Georgia, serif)',
          fontStyle: 'italic',
          fontSize: 17,
          fontWeight: 400,
          color: 'var(--mf-green)',
        }}>MentaForce</span>
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
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.94)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -1px 20px rgba(0,0,0,0.07)',
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
                textDecoration: 'none',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                minHeight: 44,
                width: '100%',
                padding: '6px 4px 4px',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    width: 20,
                    height: 2.5,
                    borderRadius: 100,
                    background: 'var(--mf-green)',
                  }} />
                )}
                <span style={{
                  color: isActive ? 'var(--mf-green)' : 'var(--text-4)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), color 0.15s',
                  display: 'flex',
                }}>
                  {tab.icon}
                </span>
                <span style={{
                  fontSize: 10,
                  lineHeight: 1,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--mf-green)' : 'var(--text-4)',
                  letterSpacing: isActive ? '-0.01em' : '0',
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
