'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const SIDEBAR_W = 240

/* ── Types ── */
type NavItem = { href: string; label: string }
type NavSection = {
  label: string
  items: NavItem[]
  hrOnly?: boolean
  defaultOpen?: boolean
}

/* ── Sectie definities ── */
const SECTIONS: NavSection[] = [
  {
    label: 'Dagelijks',
    defaultOpen: true,
    items: [
      { href: '/home',    label: '🏠 Dashboard' },
      { href: '/checkin', label: '✅ Check-in'   },
    ],
  },
  {
    label: 'Mijn Welzijn',
    defaultOpen: true,
    items: [
      { href: '/rapport',          label: '📊 Rapport'    },
      { href: '/inzichten',        label: '💡 Inzichten'  },
      { href: '/stemming',         label: '😊 Stemming'   },
      { href: '/stemming-kalender',label: '📅 Kalender'   },
      { href: '/slaap',            label: '😴 Slaap'      },
      { href: '/stress',           label: '⚡ Stress'     },
      { href: '/werkgeluk',        label: '😄 Werkgeluk'  },
    ],
  },
  {
    label: 'Groei & Focus',
    items: [
      { href: '/doelen',       label: '🎯 Doelen'      },
      { href: '/focus',        label: '⏱ Focus'        },
      { href: '/journal',      label: '📝 Journal'     },
      { href: '/dankbaarheid', label: '🙏 Dankbaarheid'},
      { href: '/reflectie',    label: '🔍 Reflectie'   },
      { href: '/groeiplan',    label: '🌱 Groeiplan'   },
    ],
  },
  {
    label: 'Zelfzorg',
    items: [
      { href: '/meditatie',      label: '🧘 Meditatie'       },
      { href: '/ademhaling',     label: '💨 Ademhaling'       },
      { href: '/mentale-sterkte',label: '💪 Mentale sterkte' },
    ],
  },
  {
    label: 'Gezondheid',
    items: [
      { href: '/gezondheid', label: '❤️ Gezondheid' },
      { href: '/sport',      label: '🏃 Sport'       },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/team',           label: '👥 Team'               },
      { href: '/team-uitdagingen',label: '🏆 Uitdagingen'       },
      { href: '/pulse-survey',   label: '📋 Pulse Survey'       },
      { href: '/enps',           label: '⭐ eNPS'               },
      { href: '/psych-veiligheid',label: '🛡️ Psych. veiligheid' },
    ],
  },
  {
    label: 'AI & Coach',
    items: [
      { href: '/coach',        label: '🤖 AI Coach'    },
      { href: '/disc',         label: '🎭 DISC'         },
      { href: '/achievements', label: '🏅 Achievements' },
    ],
  },
  {
    label: 'HR',
    hrOnly: true,
    items: [
      { href: '/hr/portaal',      label: '🏢 HR Portaal'     },
      { href: '/hr/team',         label: '👁️ Team overzicht' },
      { href: '/hr/analytics',    label: '📊 Analytics'      },
      { href: '/hr/pulse-survey', label: '📋 Pulse Survey'   },
      { href: '/hr/enps',         label: '⭐ eNPS'           },
      { href: '/hr/uitdagingen',  label: '🏆 Uitdagingen'    },
    ],
  },
]

/* ── Chevron icon ── */
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
        transition: 'transform 0.2s ease',
        flexShrink: 0,
      }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

/* ── Collapsible section ── */
function CollapsibleSection({
  section,
  pathname,
  open,
  onToggle,
}: {
  section: NavSection
  pathname: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#9CA3AF',
          border: 'none',
          background: 'none',
          width: '100%',
        }}
      >
        <span>{section.label}</span>
        <Chevron open={open} />
      </button>
      <div
        style={{
          maxHeight: open ? '500px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.2s ease',
        }}
      >
        {section.items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px 7px 28px',
                fontSize: 13,
                color: isActive ? '#1D9E75' : '#374151',
                borderRadius: 8,
                margin: '1px 8px',
                cursor: 'pointer',
                textDecoration: 'none',
                background: isActive ? '#E1F5EE' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    '#F9FAFB'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Sidebar inhoud ── */
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
  onToggleSection: (label: string) => void
  onSignOut: () => void
  onClose?: () => void
}) {
  const isHrOrAdmin = userRol === 'hr' || userRol === 'admin'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#1D9E75',
            letterSpacing: '-0.02em',
          }}
        >
          MentaForce
        </span>
      </div>

      {/* Nav sections */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: 8,
          scrollbarWidth: 'none',
        }}
      >
        {SECTIONS.filter((s) => !s.hrOnly || isHrOrAdmin).map((section) => (
          <CollapsibleSection
            key={section.label}
            section={section}
            pathname={pathname}
            open={openSections[section.label] ?? false}
            onToggle={() => {
              onToggleSection(section.label)
              onClose?.()
            }}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: '8px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <Link
          href="/instellingen"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            fontSize: 13,
            color:
              pathname === '/instellingen' ? '#1D9E75' : '#374151',
            borderRadius: 8,
            margin: '1px 0',
            textDecoration: 'none',
            background:
              pathname === '/instellingen' ? '#E1F5EE' : 'transparent',
            fontWeight: pathname === '/instellingen' ? 600 : 400,
          }}
        >
          ⚙️ Instellingen
        </Link>
        <button
          onClick={onSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            fontSize: 13,
            color: '#6B7280',
            borderRadius: 8,
            margin: '1px 0',
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

/* ── Main Navbar component ── */
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [openMenu, setOpenMenu] = useState(false)
  const [userRol, setUserRol] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  /* Initialiseer open/dicht per sectie */
  const buildInitialSections = () => {
    const initial: Record<string, boolean> = {}
    SECTIONS.forEach((s) => {
      initial[s.label] = s.defaultOpen ?? false
    })
    return initial
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    buildInitialSections
  )

  useEffect(() => {
    let mounted = true

    async function laad() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') router.push('/login')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
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
      {/* ── Stijl: desktop sidebar + mobile bottom bar ── */}
      <style>{`
        .mf-sidebar {
          display: none;
        }
        .mf-mobile-topbar {
          display: flex;
        }
        .mf-mobile-bottombar {
          display: flex;
        }
        @media (min-width: 768px) {
          .mf-sidebar {
            display: flex !important;
          }
          .mf-mobile-topbar {
            display: none !important;
          }
          .mf-mobile-bottombar {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Desktop sidebar ── */}
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

      {/* ── Mobile topbar ── */}
      <div
        className="mf-mobile-topbar"
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
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#1D9E75',
          }}
        >
          MentaForce
        </span>
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Mobile slide-over ── */}
      {openMenu && (
        <>
          <div
            onClick={() => setOpenMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 45,
              background: 'rgba(0,0,0,0.4)',
            }}
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
            <SidebarContent
              {...sharedProps}
              onClose={() => setOpenMenu(false)}
            />
          </aside>
        </>
      )}

      {/* ── Mobile bottom bar ── */}
      <nav
        className="mf-mobile-bottombar"
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
          background: 'rgba(255,255,255,0.9)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -1px 16px rgba(0,0,0,0.06)',
        }}
      >
        {(
          [
            { href: '/home',    label: 'Home',    emoji: '🏠' },
            { href: '/checkin', label: 'Check-in', emoji: '✅' },
            { href: '/rapport', label: 'Rapport',  emoji: '📊' },
            { href: '/coach',   label: 'Coach',    emoji: '🤖' },
          ] as { href: string; label: string; emoji: string }[]
        ).map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
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
