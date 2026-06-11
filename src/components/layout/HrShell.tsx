'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type NavItem = { href: string; icon: string; label: string; exact?: boolean }
type NavSection = { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overzicht',
    items: [
      { href: '/hr',      icon: '⊞', label: 'Dashboard', exact: true },
      { href: '/team',    icon: '◎', label: 'Team' },
      { href: '/rapport', icon: '↗', label: 'Rapporten' },
    ],
  },
  {
    label: 'Inrichten',
    items: [
      { href: '/hr/protocollen', icon: '☰', label: 'Protocollen' },
      { href: '/nieuws',         icon: '◈', label: 'Nieuws' },
      { href: '/surveys',        icon: '◉', label: 'Surveys' },
    ],
  },
  {
    label: 'Beheren',
    items: [
      { href: '/hr/roosters', icon: '▦', label: 'Roosters' },
      { href: '/verlof',      icon: '◷', label: 'Verlof' },
      { href: '/loonstroken', icon: '◈', label: 'Loonstroken' },
      { href: '/directory',   icon: '◎', label: 'Medewerkers' },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/instellingen', icon: '◎', label: 'Instellingen' },
  { href: '/home',         icon: '←', label: 'Terug naar portaal' },
]

function SidebarIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactElement> = {
    '⊞': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
    '◎': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    '↗': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    '☰': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    '◈': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
    '◉': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="12" y2="16" />
      </svg>
    ),
    '◷': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    '←': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
  }
  return icons[icon] ?? <span style={{ fontSize: 14 }}>{icon}</span>
}

type Props = {
  children: React.ReactNode
  naam?: string
  bedrijfNaam?: string
}

export default function HrShell({ children, naam = 'HR', bedrijfNaam = 'MentaForce' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href + '/') || pathname === item.href
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ACCENT = '#1D9E75'
  const SIDEBAR_BG = '#14151f'
  const SIDEBAR_HOVER = 'rgba(255,255,255,0.05)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : undefined,
        bottom: 0,
        zIndex: 50,
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
        className="hidden md:flex"
      >
        {/* Brand */}
        <div style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🌿</div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{bedrijfNaam}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 }}>HR Portaal</p>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '12px 16px 6px',
              }}>
                {section.label}
              </p>
              {section.items.map(item => {
                const active = isActive(item)
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px',
                    margin: '1px 8px',
                    borderRadius: 8,
                    background: active ? 'rgba(29,158,117,0.15)' : 'transparent',
                    color: active ? ACCENT : 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ color: active ? ACCENT : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      <SidebarIcon icon={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom items */}
        <div style={{ padding: '8px 0 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {BOTTOM_ITEMS.map(item => {
            const active = isActive(item)
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px', margin: '1px 8px', borderRadius: 8,
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12, fontWeight: 400,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
              >
                <SidebarIcon icon={item.icon} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN (sidebar offset) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="md:ml-[220px]">

        {/* Top bar */}
        <header style={{
          background: SIDEBAR_BG,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Left: hamburger (mobile) + page context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              className="md:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              HR Portaal
            </p>
          </div>

          {/* Right: user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/home" style={{
              color: 'rgba(255,255,255,0.5)', fontSize: 12,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Portaal
            </Link>
            <div style={{
              width: 1, height: 20, background: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
              }}>
                {naam.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{naam.split(' ')[0]}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>HR Manager</p>
              </div>
            </div>
            <button onClick={uitloggen} style={{
              color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, transition: 'color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
              title="Uitloggen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px 32px 48px', minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
