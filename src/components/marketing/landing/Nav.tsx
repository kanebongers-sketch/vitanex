'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { COLORS, FONT, MAXW, EASE } from '../theme'

const LINKS: [string, string][] = [
  ['/#brein', 'Het brein'],
  ['/#aanpak', 'Aanpak'],
  ['/#contact', 'Contact'],
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        fontFamily: FONT.grotesk,
        background: scrolled ? COLORS.navyScrim : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(150%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(150%)' : 'none',
        borderBottom: `1px solid ${scrolled ? COLORS.line : 'transparent'}`,
        transition: `background .3s ${EASE}`,
        padding: scrolled ? '14px 0' : '22px 0',
      }}
    >
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.cyan, boxShadow: `0 0 12px ${COLORS.cyanGlow}` }} />
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.14em', color: COLORS.ink }}>MENTAFORCE</span>
        </Link>

        <div className="hidden md:flex" style={{ gap: 34, alignItems: 'center' }}>
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}
              style={{ fontSize: 14, fontWeight: 500, color: COLORS.inkDim, textDecoration: 'none', transition: `color .2s ${EASE}` }}
              onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ink }}
              onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.inkDim }}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex" style={{ gap: 14, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: COLORS.inkDim, textDecoration: 'none' }}>Inloggen</Link>
          <Link href="/register" style={{ fontSize: 14, fontWeight: 500, color: COLORS.inkDim, textDecoration: 'none' }}>Zelf starten</Link>
          <Link href="/contact"
            style={{
              fontSize: 14, fontWeight: 600, color: COLORS.navyDeep, background: COLORS.cyan,
              padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
              boxShadow: `0 6px 24px ${COLORS.cyanSoft}`, transition: `transform .2s ${EASE}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
            Demo aanvragen
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}
          style={{ background: 'none', border: 'none', color: COLORS.ink, cursor: 'pointer', padding: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></>
                  : <><line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="15" x2="19" y2="15" /></>}
          </svg>
        </button>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 14, padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 16, background: COLORS.navyDeep }}>
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ color: COLORS.inkDim, textDecoration: 'none', fontSize: 15 }}>{label}</a>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} style={{ color: COLORS.inkDim, textDecoration: 'none', fontSize: 15 }}>Inloggen</Link>
          <Link href="/register" onClick={() => setOpen(false)} style={{ color: COLORS.inkDim, textDecoration: 'none', fontSize: 15 }}>Zelf starten</Link>
          <Link href="/contact" onClick={() => setOpen(false)} style={{ color: COLORS.navyDeep, background: COLORS.cyan, padding: '12px 0', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Demo aanvragen</Link>
        </div>
      )}
    </nav>
  )
}
