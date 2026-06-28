'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const BrainCanvas = dynamic(() => import('@/components/marketing/BrainCanvas'), { ssr: false })

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Pillar {
  emoji: string
  naam: string
  zin: string
  stat: string
  color: string
  key: string
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PILLARS: Pillar[] = [
  { emoji: '⚡', naam: 'Energie', zin: 'Dagelijkse vitaliteit gemeten, voordat de batterij leegloopt.', stat: '71% herkent energieverlies te laat', color: '#F5A524', key: 'energie' },
  { emoji: '🌙', naam: 'Slaap', zin: 'Slaapkwaliteit en herstel, nacht na nacht inzichtelijk.', stat: '68% verbetert slaap na 4 weken', color: '#6366F1', key: 'slaap' },
  { emoji: '🧘', naam: 'Stress', zin: 'Vroege signalen van overbelasting, weken eerder zichtbaar.', stat: '73% herkent dit signaal te laat', color: '#2DD4BF', key: 'stress' },
  { emoji: '☀️', naam: 'Stemming', zin: 'Mentaal welzijn en motivatie, zonder ongemakkelijk gesprek.', stat: '4× meer open met anonimiteit', color: '#A78BFA', key: 'stemming' },
  { emoji: '🏃', naam: 'Beweging', zin: 'Lichamelijke activiteit die energie en focus voedt.', stat: '62% meer actief na inzicht', color: '#FB7185', key: 'beweging' },
  { emoji: '🥗', naam: 'Voeding', zin: 'Voeding en hydratatie als fundament van weerbaarheid.', stat: '3 van 4 teams zien direct patroon', color: '#34D399', key: 'voeding' },
]

const HOTSPOT_POS = [
  { left: '50%', top: '22%' },
  { left: '74%', top: '38%' },
  { left: '30%', top: '40%' },
  { left: '62%', top: '58%' },
  { left: '38%', top: '66%' },
  { left: '52%', top: '78%' },
]

const STATS = [
  { getal: '6 wk', label: 'Eerder signaal vóór verzuim' },
  { getal: '100%', label: 'Anoniem en AVG-conform' },
  { getal: '6', label: 'Vlakken van welzijn gemeten' },
  { getal: '< 1 dag', label: 'Tot je team live is' },
]

const FEATURES = [
  { icoon: '🔒', cat: 'PRIVACY', titel: 'AVG-conform by design', body: 'Volledig geanonieme aggregatie. Geen enkele score is herleidbaar naar een individu. Gehost in de EU, AVG-proof.' },
  { icoon: '📡', cat: 'DETECTIE', titel: '6 weken eerder zicht', body: 'Detecteer dalende weerbaarheid gemiddeld zes weken voordat verzuim ontstaat — en grijp op tijd in.' },
  { icoon: '⚙️', cat: 'IMPLEMENTATIE', titel: 'Direct inzetbaar', body: 'Geen IT-traject, geen implementatieproject. Je team is binnen één werkdag live, zonder installatie.' },
]

// ─── LP TOKENS (scoped, no Tailwind for complex parts) ────────────────────────

const lp = {
  bgVoid: '#05070D',
  bgDeep: '#0A0E1A',
  bgNavy: '#0F1524',
  bgElevated: '#141B2E',
  cyan: '#2DD4BF',
  cyanBright: '#5EEAD4',
  blue: '#3B82F6',
  violet: '#8B5CF6',
  text1: '#F8FAFC',
  text2: '#C7D2E0',
  text3: '#8696AC',
  borderSoft: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  gradBrand: 'linear-gradient(135deg, #2DD4BF 0%, #3B82F6 50%, #8B5CF6 100%)',
  gradCta: 'linear-gradient(135deg, #5EEAD4 0%, #3B82F6 100%)',
  glowCta: '0 8px 32px rgba(45,212,191,0.30), 0 2px 8px rgba(59,130,246,0.25)',
}

const glass = {
  nav: {
    background: 'rgba(10,14,26,0.72)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderBottom: `1px solid ${lp.borderSoft}`,
  } as React.CSSProperties,
  panel: {
    background: 'rgba(20,27,46,0.55)',
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    border: `1px solid ${lp.border}`,
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
  } as React.CSSProperties,
  hotspot: {
    background: 'rgba(15,21,36,0.45)',
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: `1px solid ${lp.borderStrong}`,
    borderRadius: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
  } as React.CSSProperties,
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav
      style={{
        ...glass.nav,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'padding 0.3s ease',
        padding: scrolled ? '12px 0' : '18px 0',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: lp.gradBrand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, fontFamily: 'var(--font-display)' }}>
            MF
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: lp.text1, fontSize: 17, letterSpacing: '-0.02em' }}>
            MentaForce
          </span>
        </div>

        {/* Links desktop */}
        <div className="hidden md:flex" style={{ gap: 36 }}>
          {[['#brein', 'Het brein'], ['#features', 'Waarom MentaForce'], ['#stats', 'Resultaten']].map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: lp.text3, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = lp.text1 }}
              onMouseLeave={e => { e.currentTarget.style.color = lp.text3 }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA desktop */}
        <div className="hidden md:flex" style={{ gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: lp.text3, textDecoration: 'none' }}>
            Inloggen
          </Link>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: lp.text1,
              padding: '10px 22px', borderRadius: 12, textDecoration: 'none',
              background: lp.gradCta,
              boxShadow: lp.glowCta,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            Demo aanvragen
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: lp.text3, cursor: 'pointer', padding: 8 }}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></> : <><line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="15" x2="19" y2="15" /></>}
          </svg>
        </button>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${lp.borderSoft}`, padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['#brein', 'Het brein'], ['#features', 'Waarom MentaForce'], ['#stats', 'Resultaten']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ color: lp.text2, textDecoration: 'none', fontSize: 15 }}>{label}</a>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} style={{ color: lp.text1, background: lp.gradCta, padding: '12px 0', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Demo aanvragen
          </Link>
        </div>
      )}
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ background: lp.bgVoid, position: 'relative', overflow: 'hidden', padding: '100px 0 120px' }}>
      {/* Ambient glows */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '55%', height: '110%', background: 'radial-gradient(ellipse, rgba(45,212,191,0.10) 0%, transparent 55%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', height: '80%', background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', left: '35%', width: '30%', height: '60%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 60%)', borderRadius: '50%' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative' }}>
        {/* Overline */}
        <p style={{
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: lp.cyan, marginBottom: 24,
        }}>
          Welzijnsplatform voor Nederlandse teams
        </p>

        {/* H1 */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 600,
          fontSize: 'clamp(44px, 7vw, 84px)',
          letterSpacing: '-0.03em', lineHeight: 1.05,
          color: lp.text1, marginBottom: 28, maxWidth: 720,
        }}>
          Voorkom verzuim.<br />
          Versterk je{' '}
          <span style={{
            background: 'linear-gradient(120deg, #F8FAFC 0%, #5EEAD4 40%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            team.
          </span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-body)', fontWeight: 400,
          fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.6,
          color: lp.text2, marginBottom: 44, maxWidth: 520,
        }}>
          MentaForce meet mentaal welzijn vroeg — anoniem, AVG-conform en direct inzetbaar.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 52 }}>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
              color: lp.bgVoid, background: lp.gradCta,
              padding: '14px 28px', borderRadius: 14, textDecoration: 'none',
              boxShadow: lp.glowCta, display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            Demo aanvragen
            <span aria-hidden>→</span>
          </Link>
          <a
            href="#brein"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15,
              color: lp.text2, background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${lp.border}`,
              padding: '14px 28px', borderRadius: 14, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
          >
            Hoe werkt het
          </a>
        </div>

        {/* Trust pills */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['Volledig anoniem', 'AVG-conform', 'Actief in 1 dag', 'Geen IT-traject'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: lp.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: lp.cyan }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── BRAIN SECTION ────────────────────────────────────────────────────────────

function BrainSection() {
  const [activePillar, setActivePillar] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [panelVisible, setPanelVisible] = useState(true)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const prevPillar = useRef(0)

  const onScroll = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const totalScroll = el.offsetHeight - window.innerHeight
    const scrolled = -rect.top
    const progress = Math.max(0, Math.min(1, scrolled / totalScroll))
    setScrollProgress(progress)
    const idx = Math.min(5, Math.floor(progress * 6))
    if (idx !== prevPillar.current) {
      setPanelVisible(false)
      setTimeout(() => {
        setActivePillar(idx)
        prevPillar.current = idx
        setPanelVisible(true)
      }, 150)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const pillar = PILLARS[activePillar]

  return (
    <section id="brein" aria-label="6 vlakken van welzijn" style={{ position: 'relative', background: lp.bgDeep }}>
      <div ref={wrapperRef} style={{ height: '720vh' }}>
        {/* Sticky fullscreen viewport */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          {/* Brain canvas — fills entire viewport */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <BrainCanvas activePillar={activePillar} scrollProgress={scrollProgress} />
          </div>

          {/* Ambient colour overlay */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${pillar.color}0d 0%, transparent 65%)`,
            transition: 'background 0.9s ease' }} />

          {/* LEFT — glass pillar nav */}
          <div style={{
            position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 2,
            background: 'rgba(5,7,13,0.60)', backdropFilter: 'blur(18px) saturate(1.4)',
            borderRadius: 18, padding: '14px 6px',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {PILLARS.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setActivePillar(i)}
                style={{
                  background: activePillar === i ? `${p.color}14` : 'none',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 12,
                  transition: 'all 0.25s var(--ease)',
                  opacity: activePillar === i ? 1 : 0.38,
                }}
              >
                <span style={{ fontSize: 17 }}>{p.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14,
                  color: activePillar === i ? p.color : lp.text3,
                  transition: 'color 0.3s', letterSpacing: '-0.01em',
                }}>
                  {p.naam}
                </span>
                {activePillar === i && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}`, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* RIGHT — glass info panel */}
          <div style={{
            position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
            ...glass.hotspot,
            width: 268, padding: '26px 22px',
            opacity: panelVisible ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: pillar.color, marginBottom: 14 }}>
              Vlak 0{activePillar + 1}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{pillar.emoji}</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 20, color: lp.text1, letterSpacing: '-0.02em', margin: 0 }}>
                {pillar.naam}
              </h3>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: lp.text2, marginBottom: 18 }}>
              {pillar.zin}
            </p>
            <div style={{ background: `${pillar.color}18`, border: `1px solid ${pillar.color}30`, borderRadius: 10, padding: '9px 13px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: pillar.color, fontWeight: 600, margin: 0 }}>
                {pillar.stat}
              </p>
            </div>
          </div>

          {/* Progress dots — right edge */}
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PILLARS.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setActivePillar(i)}
                aria-label={p.naam}
                style={{
                  width: 3, height: activePillar === i ? 28 : 12,
                  background: activePillar === i ? p.color : lp.borderSoft,
                  borderRadius: 2, border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s var(--ease)',
                  boxShadow: activePillar === i ? `0 0 8px ${p.color}` : 'none',
                }}
              />
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes lp-pulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-50%) scale(1.25); }
        }
      `}</style>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" style={{ background: lp.bgNavy, padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: lp.cyan, marginBottom: 16 }}>
            Waarom MentaForce
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(30px,4.5vw,52px)', letterSpacing: '-0.025em', lineHeight: 1.12, color: lp.text1, marginBottom: 16 }}>
            Gebouwd voor vroeg signaleren
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: lp.text2, maxWidth: 480, margin: '0 auto' }}>
            Niet reactief reageren op verzuim. Proactief ingrijpen voordat het te laat is.
          </p>
        </div>

        {/* 3 cards — bento layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.titel}
              style={{
                ...glass.panel,
                padding: '36px 28px',
                transform: i === 1 ? 'scale(1.04)' : 'scale(1)',
                boxShadow: i === 1
                  ? '0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(45,212,191,0.15), inset 0 1px 0 rgba(255,255,255,0.10)'
                  : glass.panel.boxShadow,
                transition: 'transform 0.25s var(--ease)',
              }}
              onMouseEnter={e => { if (i !== 1) (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)' }}
              onMouseLeave={e => { if (i !== 1) (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            >
              {/* Icon tile */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: lp.gradBrand,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 20,
                boxShadow: i === 1 ? '0 0 20px rgba(45,212,191,0.25)' : 'none',
              }}>
                {f.icoon}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: lp.cyan, marginBottom: 10 }}>
                {f.cat}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(20px,2vw,24px)', letterSpacing: '-0.02em', lineHeight: 1.25, color: lp.text1, marginBottom: 14 }}>
                {f.titel}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, color: lp.text2 }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section id="stats" style={{ background: lp.bgElevated, padding: '120px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: lp.cyan, marginBottom: 16 }}>
            Resultaten
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(30px,4.5vw,52px)', letterSpacing: '-0.025em', lineHeight: 1.12, color: lp.text1 }}>
            Cijfers die spreken
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, borderTop: `1px solid ${lp.borderSoft}`, borderBottom: `1px solid ${lp.borderSoft}` }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                borderLeft: i > 0 ? `1px solid ${lp.borderSoft}` : 'none',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 'clamp(36px,5vw,60px)',
                letterSpacing: '-0.04em', lineHeight: 1,
                background: 'linear-gradient(180deg, #5EEAD4 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 16,
              }}>
                {s.getal}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: lp.text3, lineHeight: 1.4 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section style={{ background: lp.bgVoid, padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(45,212,191,0.08) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: lp.cyan, marginBottom: 24 }}>
          Klaar om te beginnen?
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(32px,5vw,56px)', letterSpacing: '-0.03em', lineHeight: 1.08, color: lp.text1, marginBottom: 20 }}>
          Iedere week zonder inzicht is een gemiste kans.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: lp.text2, marginBottom: 44 }}>
          Start vandaag gratis. Je team is operationeel binnen 24 uur. Geen creditcard. Geen IT-afdeling. Geen commitment.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
              color: lp.bgVoid, background: lp.gradCta,
              padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
              boxShadow: lp.glowCta,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            Demo aanvragen →
          </Link>
          <Link
            href="/register"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15,
              color: lp.text2, background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${lp.border}`,
              padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
            }}
          >
            Gratis starten
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Geen creditcard', 'Operationeel in 1 dag', 'AVG-conform', 'Opzegbaar per maand'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: lp.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: lp.cyan }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: lp.bgVoid, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap', marginBottom: 48 }}>
          {/* Brand */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: lp.gradBrand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 12 }}>MF</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: lp.text1, fontSize: 16 }}>MentaForce</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.25)', maxWidth: 240 }}>
              Vitaliteit op de werkplek. Burn-out preventie voor Nederlandse HR-teams.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.18)', marginTop: 12 }}>
              AVG-conform · EU-hosting · Gemaakt in Nederland 🇳🇱
            </p>
          </div>

          {/* Links */}
          {[
            { titel: 'Product', items: [['#brein', 'Het brein'], ['#features', 'Features'], ['/contact', 'Demo aanvragen']] },
            { titel: 'Bedrijf', items: [['/contact', 'Contact'], ['/voorwaarden', 'Voorwaarden']] },
            { titel: 'Juridisch', items: [['/voorwaarden', 'Privacy'], ['/voorwaarden', 'AVG'], ['/voorwaarden', 'Voorwaarden']] },
          ].map(col => (
            <div key={col.titel}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: 16 }}>
                {col.titel}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map(([href, label]) => (
                  href.startsWith('#')
                    ? <a key={label} href={href} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.22)', textDecoration: 'none' }}>{label}</a>
                    : <Link key={label} href={href} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.22)', textDecoration: 'none' }}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
            © 2026 MentaForce
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
            Gemaakt in Nederland 🇳🇱
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div style={{ background: lp.bgVoid, color: lp.text1, minHeight: '100vh' }}>
      <Nav />
      <main>
        <Hero />
        <BrainSection />
        <Features />
        <Stats />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
