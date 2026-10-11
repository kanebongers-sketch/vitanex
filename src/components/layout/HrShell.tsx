'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Users,
  TrendingUp,
  FileText,
  Newspaper,
  ClipboardList,
  CalendarRange,
  CalendarClock,
  Receipt,
  Settings,
  ArrowLeft,
  Menu,
  Home,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { useVertaling } from '@/lib/i18n/TaalProvider'

// label = sleutel onder account.hrShell (vertaald bij het tekenen)
type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean }
type NavSection = { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'overzicht',
    items: [
      { href: '/hr', icon: LayoutGrid, label: 'dashboard', exact: true },
      { href: '/team', icon: Users, label: 'team' },
      { href: '/rapport', icon: TrendingUp, label: 'rapporten' },
    ],
  },
  {
    label: 'inrichten',
    items: [
      { href: '/hr/protocollen', icon: FileText, label: 'protocollen' },
      { href: '/nieuws', icon: Newspaper, label: 'nieuws' },
      { href: '/surveys', icon: ClipboardList, label: 'surveys' },
    ],
  },
  {
    label: 'beheren',
    items: [
      { href: '/hr/roosters', icon: CalendarRange, label: 'roosters' },
      { href: '/verlof', icon: CalendarClock, label: 'verlof' },
      { href: '/loonstroken', icon: Receipt, label: 'loonstroken' },
      { href: '/directory', icon: Users, label: 'medewerkers' },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/instellingen', icon: Settings, label: 'instellingen' },
  { href: '/home', icon: ArrowLeft, label: 'terugPortaal' },
]

type Props = {
  children: React.ReactNode
  naam?: string
  bedrijfNaam?: string
}

export default function HrShell({ children, naam = 'HR', bedrijfNaam = 'MentaForce' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useVertaling()

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href + '/') || pathname === item.href
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : undefined,
        bottom: 0,
        zIndex: 50,
        transition: 'transform 0.25s var(--ease)',
      }}
        className="hidden md:flex"
      >
        {/* Brand */}
        <div style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--mentaforce-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutGrid size={17} color="var(--bg-app)" aria-hidden />
          </div>
          <div>
            <p style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{bedrijfNaam}</p>
            <p style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 1 }}>{t('account.hrShell.hrPortaal')}</p>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <p style={{
                color: 'var(--text-4)',
                fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '12px 16px 6px',
              }}>
                {t(`account.hrShell.${section.label}`)}
              </p>
              {section.items.map(item => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className="mf-hr-nav"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px',
                      margin: '1px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'var(--mentaforce-primary-light)' : 'transparent',
                      color: active ? 'var(--mentaforce-primary)' : 'var(--text-2)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={16} aria-hidden style={{ flexShrink: 0, color: active ? 'var(--mentaforce-primary)' : 'var(--text-3)' }} />
                    {t(`account.hrShell.${item.label}`)}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom items */}
        <div style={{ padding: '8px 0 16px', borderTop: '1px solid var(--border)' }}>
          {BOTTOM_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className="mf-hr-nav"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', margin: '1px 8px', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-3)',
                  fontSize: 12, fontWeight: 400,
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} aria-hidden style={{ flexShrink: 0 }} />
                {t(`account.hrShell.${item.label}`)}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN (sidebar offset) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="md:ml-[220px]">

        {/* Top bar */}
        <header style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Left: hamburger (mobile) + page context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="mf-hr-iconbtn md:hidden"
              aria-label={sidebarOpen ? t('account.hrShell.menuSluiten') : t('account.hrShell.menuOpenen')}
              aria-expanded={sidebarOpen}
              style={{ color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-xs)' }}
            >
              <Menu size={20} aria-hidden />
            </button>
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
              {t('account.hrShell.hrPortaal')}
            </p>
          </div>

          {/* Right: user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/home" className="mf-hr-nav" style={{
              color: 'var(--text-3)', fontSize: 12,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 6px', borderRadius: 'var(--radius-xs)',
            }}>
              <Home size={14} aria-hidden />
              {t('account.hrShell.portaal')}
            </Link>
            <div style={{
              width: 1, height: 20, background: 'var(--border-strong)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--mentaforce-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--bg-app)',
              }}>
                {naam.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p style={{ color: 'var(--text-1)', fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{naam.split(' ')[0]}</p>
                <p style={{ color: 'var(--text-4)', fontSize: 10 }}>{t('account.hrShell.hrManager')}</p>
              </div>
            </div>
            <button onClick={uitloggen}
              className="mf-hr-iconbtn mf-hr-logout"
              aria-label={t('account.hrShell.uitloggen')}
              title={t('account.hrShell.uitloggen')}
              style={{
                color: 'var(--text-3)', background: 'none', border: 'none',
                cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-xs)',
                transition: 'color 0.15s var(--ease)',
              }}
            >
              <LogOut size={16} aria-hidden />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px 32px 48px', minHeight: 0 }}>
          {children}
        </main>
      </div>

      <style>{`
        .mf-hr-nav { transition: background 0.15s var(--ease), color 0.15s var(--ease); }
        .mf-hr-nav:hover { background: var(--bg-subtle); color: var(--text-1); }
        .mf-hr-iconbtn { transition: background 0.15s var(--ease), color 0.15s var(--ease); }
        .mf-hr-iconbtn:hover { background: var(--bg-subtle); color: var(--text-1); }
        .mf-hr-logout:hover { color: var(--mf-red); }
        .mf-hr-nav:focus-visible,
        .mf-hr-iconbtn:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
