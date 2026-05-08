'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTileDef, DEFAULT_TILES, type TileId } from '@/lib/tiles'

type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean }
type NavSection = { label: string; items: NavItem[] }

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const VITALITEIT_ITEMS: NavItem[] = [
  { href: '/checkin',     label: 'Check-in',      icon: <Icon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" /> },
  { href: '/coach',       label: 'AI Coach',      icon: <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /> },
  { href: '/rapport',     label: 'Mijn rapport',  icon: <Icon d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /> },
  { href: '/doelen',      label: 'Doelen',         icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /> },
  { href: '/uitdagingen', label: 'Uitdagingen',    icon: <Icon d="M5 3l14 9-14 9V3z" /> },
  { href: '/journal',     label: 'Journal',        icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
  { href: '/burnout',     label: 'Burn-out scan',  icon: <Icon d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z" /> },
  { href: '/focus',       label: 'Focus',          icon: <Icon d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> },
]

const PROFIEL_ITEMS: NavItem[] = [
  { href: '/instellingen', label: 'Instellingen', icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> },
]

type Props = {
  children: React.ReactNode
  naam?: string
  isHr?: boolean
  werkdagTiles?: NavItem[]
}

export default function EmployeeShell({ children, naam = '', isHr = false, werkdagTiles = [] }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ACCENT = '#1D9E75'
  const SIDEBAR_BG = '#FFFFFF'
  const SIDEBAR_BORDER = '#E5E7EB'
  const ACTIVE_BG = '#F0FDF8'

  const sections: NavSection[] = [
    {
      label: 'Vitaliteit',
      items: VITALITEIT_ITEMS,
    },
    ...(werkdagTiles.length > 0 ? [{
      label: 'Werkdag',
      items: werkdagTiles,
    }] : []),
    {
      label: 'Profiel',
      items: PROFIEL_ITEMS,
    },
  ]

  function SidebarContent() {
    return (
      <>
        {/* Brand */}
        <div style={{
          padding: '18px 16px',
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #1D9E75, #0d7a5a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
          }}>🌿</div>
          <div>
            <p style={{ color: '#111827', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>MentaForce</p>
            <p style={{ color: '#9CA3AF', fontSize: 10, marginTop: 1 }}>Jouw portaal</p>
          </div>
        </div>

        {/* Dashboard link */}
        <div style={{ padding: '8px 10px' }}>
          <Link href="/home" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8,
            background: pathname === '/home' ? ACTIVE_BG : 'transparent',
            color: pathname === '/home' ? ACCENT : '#374151',
            fontSize: 13, fontWeight: pathname === '/home' ? 600 : 500,
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
          {sections.map(section => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <p style={{
                color: '#9CA3AF', fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '10px 10px 5px',
              }}>{section.label}</p>
              {section.items.map(item => {
                const active = isActive(item)
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 7,
                    background: active ? ACTIVE_BG : 'transparent',
                    color: active ? ACCENT : '#4B5563',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    textDecoration: 'none', transition: 'all 0.12s',
                    marginBottom: 1,
                  }}>
                    <span style={{ color: active ? ACCENT : '#9CA3AF', flexShrink: 0, display: 'flex' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px', borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
          {isHr && (
            <Link href="/hr" style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7, marginBottom: 2,
              background: '#F0FDF8',
              color: ACCENT, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
              HR Portaal
            </Link>
          )}
          <button onClick={uitloggen} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', borderRadius: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#9CA3AF', fontSize: 12, textAlign: 'left',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Uitloggen
          </button>
        </div>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)',
        }} />
      )}

      {/* ── SIDEBAR (desktop: always visible, mobile: drawer) ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: SIDEBAR_BG,
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        zIndex: 50,
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
        className="hidden md:flex"
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="md:ml-[220px]">

        {/* Top bar */}
        <header style={{
          background: '#FFFFFF',
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>
              {new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Right: user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0d7a5a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              {naam.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#111827', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{naam.split(' ')[0]}</p>
              <p style={{ color: '#9CA3AF', fontSize: 10 }}>Medewerker</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 28px 48px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
