'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICON LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

function Ico({ d, size = 20, color = 'currentColor', fill = 'none', sw = 1.8 }: {
  d: string | string[]; size?: number; color?: string; fill?: string; sw?: number
}) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

const ICONS = {
  check:       'M20 6 9 17 4 12',
  checkCircle: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01 9 11.01'],
  dashboard:   ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  sparkles:    ['M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5z',
                'M5 3 5.5 5 7 5.5 5.5 6 5 8 4.5 6 3 5.5 4.5 5z',
                'M19 15 19.5 17 21 17.5 19.5 18 19 20 18.5 18 17 17.5 18.5 17z'],
  book:        ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
                'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  wind:        'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
  alert:       ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
                'M12 9v4', 'M12 17h.01'],
  message:     'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  barChart:    ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  trophy:      ['M8 21 12 17 16 21', 'M12 17v-6', 'M7 4v3a5 5 0 0 0 10 0V4',
                'M3 4h18', 'M7 4c0 0-1 9-4 9', 'M17 4c0 0 1 9 4 9'],
  shield:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chevronDown: 'M6 9l6 6 6-6',
  arrowRight:  ['M5 12h14', 'M12 5l7 7-7 7'],
  x:           ['M18 6 6 18', 'M6 6l12 12'],
  users:       ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
                'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75',
                'M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0'],
  clock:       ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 6v6l4 2'],
  zap:         'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  star:        'M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
}

function Icon({ name, size = 20, color = 'currentColor', filled = false }: {
  name: keyof typeof ICONS; size?: number; color?: string; filled?: boolean
}) {
  const d = ICONS[name]
  return <Ico d={d} size={size} color={color} fill={filled ? color : 'none'} sw={filled ? 0 : 1.8} />
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────


function Check({ text, color }: { text: string; color: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-600">
      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color }}>
        <Icon name="check" size={10} color="white" />
      </span>
      {text}
    </li>
  )
}

function Label({ text }: { text: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--mf-green)' }}>{text}</p>
  )
}

function SectionHeading({ children, sub, center = true, dark = false }: {
  children: React.ReactNode; sub?: string; center?: boolean; dark?: boolean
}) {
  return (
    <div className={center ? 'text-center mb-16' : 'mb-12'}>
      <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight leading-tight"
        style={{ color: dark ? 'white' : 'var(--text-1)' }}>
        {children}
      </h2>
      {sub && <p className="text-xl max-w-2xl mx-auto" style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'var(--text-4)' }}>{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(10,15,30,0.97)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #15B89A)' }}>M</div>
          <span className="font-bold text-white text-lg tracking-tight">MentaForce</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {[['#hoe-werkt-het', 'Hoe werkt het'], ['#functies', 'Functies'], ['#prijzen', 'Prijzen']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
              {label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium px-4 py-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
            Inloggen
          </Link>
          <Link href="/contact"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}>
            Demo aanvragen
          </Link>
          <Link href="/register"
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #15B89A)', boxShadow: '0 0 24px rgba(29,158,117,0.4)' }}>
            Gratis starten
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={() => setOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {open
              ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-6 py-5 flex flex-col gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0f1e' }}>
          {[['#hoe-werkt-het', 'Hoe werkt het'], ['#functies', 'Functies'], ['#prijzen', 'Prijzen']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="text-sm py-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</a>
          ))}
          <hr style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
          <Link href="/login" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Inloggen</Link>
          <Link href="/contact" onClick={() => setOpen(false)}
            className="text-sm font-semibold py-3.5 rounded-xl text-center border"
            style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.15)' }}>
            Demo aanvragen
          </Link>
          <Link href="/register" onClick={() => setOpen(false)}
            className="text-sm font-bold text-white py-3.5 rounded-xl text-center"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #15B89A)' }}>
            Gratis starten
          </Link>
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function MockDashboard() {
  return (
    <div className="w-full rounded-2xl overflow-hidden select-none"
      style={{ maxWidth: 520, boxShadow: '0 48px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)' }}>
      {/* Browser chrome */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'var(--text-1)' }}>
        <div className="flex gap-1.5">
          {['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
        </div>
        <div className="flex-1 rounded-md px-3 py-1 text-xs font-mono text-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)' }}>
          app.mentaforce.nl/hr/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-5" style={{ background: 'var(--bg-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">HR-dashboard</p>
            <p className="text-xs text-gray-400">Maandag, 09:41</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--mf-green)' }} />
            Live
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Vitaliteitscore', value: '4.1/5', color: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
            { label: 'Participatie', value: '87%', color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
            { label: 'Risicosignalen', value: '2', color: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center bg-white border border-gray-100">
              <p className="text-xl font-extrabold tracking-tight" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600">Vitaliteitstrend · 12 weken</p>
            <span className="text-xs font-bold" style={{ color: 'var(--mf-green)' }}>↑ +12%</span>
          </div>
          <div className="flex items-end gap-1" style={{ height: 52 }}>
            {[52, 56, 53, 64, 68, 63, 72, 70, 77, 75, 81, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all"
                style={{ height: `${h}%`, background: i >= 10 ? 'var(--mf-green)' : i >= 6 ? 'var(--mf-green-mid)' : 'var(--mf-green-light)' }} />
            ))}
          </div>
        </div>

        {/* AI insight */}
        <div className="rounded-xl p-3.5 mb-3 border" style={{ background: 'var(--text-1)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(29,158,117,0.3)', color: 'var(--mf-green)' }}>AI</span>
            <p className="text-xs font-semibold text-white">Inzicht van deze week</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Werkdruk stijgt al 3 weken bij 2 teamleden. Overweeg een gesprek vóór vrijdag.
          </p>
        </div>

        {/* Team list */}
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-2 tracking-widest">TEAM DEZE WEEK</p>
          {[
            { naam: 'Sarah V.', score: 4.3, status: 'ok' },
            { naam: 'Thomas D.', score: 2.1, status: 'risico' },
            { naam: 'Emma B.', score: 3.8, status: 'ok' },
            { naam: 'Lore M.', score: null, status: 'open' },
          ].map(l => (
            <div key={l.naam} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: l.status === 'risico' ? 'var(--mf-red-light)' : l.status === 'open' ? 'var(--bg-subtle)' : 'var(--mf-green-light)',
                    color: l.status === 'risico' ? 'var(--mf-red)' : l.status === 'open' ? 'var(--text-3)' : 'var(--mf-green)',
                  }}>
                  {l.naam[0]}
                </div>
                <span className="text-xs font-medium text-gray-700">{l.naam}</span>
                {l.status === 'risico' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--mf-red-light)', color: 'var(--mf-red)' }}>Signaal</span>
                )}
              </div>
              <span className="text-xs font-bold"
                style={{ color: !l.score ? 'var(--border-strong)' : l.score >= 3.5 ? 'var(--mf-green)' : l.score >= 2.5 ? 'var(--mf-amber)' : 'var(--mf-red)' }}>
                {l.score ? `${l.score}/5` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE STICKY CTA
// ─────────────────────────────────────────────────────────────────────────────

function MobileSticky() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  if (!show) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-4 pb-5"
      style={{ background: 'rgba(10,15,30,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
      <Link href="/register"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white text-sm"
        style={{ background: 'linear-gradient(135deg, #1D9E75, #15B89A)', boxShadow: '0 4px 24px rgba(29,158,117,0.45)' }}>
        Gratis starten, geen creditcard vereist
        <Icon name="arrowRight" size={14} color="white" />
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING SECTION (met toggle)
// ─────────────────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      naam: 'Starter', maand: 4, kleur: 'var(--text-2)', populair: false,
      min: 'Min. 10 medewerkers', sub: 'Ideaal voor kleine teams',
      cta: 'Gratis starten →', href: '/register',
      features: ['Wekelijkse anonieme check-in', 'Persoonlijk medewerkerportaal', 'AI Welzijnscoach', 'Teamchat', 'HR-dashboard (basisoverzicht)'],
      missing: ['Pulse surveys', 'Burn-out detectie', 'AI HR-inzichten'],
    },
    {
      naam: 'Groei', maand: 7, kleur: 'var(--mf-green)', populair: true,
      min: 'Min. 25 medewerkers', sub: 'Voor groeiende organisaties',
      cta: 'Demo aanvragen →', href: '/contact?plan=groei',
      features: ['Alles in Starter', 'Pulse surveys met templates', 'Burn-out risico detectie', 'Anonieme feedback inbox', 'AI HR-inzichten & samenvatting', 'Trends en exporteerbare rapporten', 'Early warning signalen', 'Prioritaire e-mailsupport'],
      missing: [],
    },
    {
      naam: 'Enterprise', maand: null, kleur: '#1a1a2e', populair: false,
      min: '100+ medewerkers', sub: 'Voor grote organisaties',
      cta: 'Neem contact op →', href: '/contact?plan=enterprise',
      features: ['Alles in Groei', 'AFAS / Personio koppeling', 'SSO en SAML login', 'Eigen branding & white-label', 'SLA-garantie (99,9% uptime)', 'Dedicated customer success manager', 'Maatwerk rapportages & API', 'Onboarding & trainingsprogramma'],
      missing: [],
    },
  ]

  return (
    <section id="prijzen" className="py-28" style={{ background: 'var(--bg-subtle)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <Label text="Prijzen" />
          <SectionHeading sub="Geen verborgen kosten. Per medewerker per maand. Altijd opzegbaar.">
            Transparant en schaalbaar
          </SectionHeading>

          {/* Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {[
              { label: 'Maandelijks', value: false },
              { label: 'Jaarlijks', value: true },
            ].map(opt => (
              <button key={String(opt.value)} onClick={() => setAnnual(opt.value)}
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: annual === opt.value ? 'var(--mf-green)' : 'transparent',
                  color: annual === opt.value ? 'white' : 'var(--text-2)',
                }}>
                {opt.label}
                {opt.value && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: annual ? 'rgba(255,255,255,0.22)' : 'var(--mf-green-light)', color: annual ? 'white' : 'var(--mf-green)' }}>
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(p => {
            const price = p.maand ? (annual ? +(p.maand * 0.8).toFixed(2) : p.maand) : null
            return (
              <div key={p.naam} className="bg-white rounded-2xl p-8 relative flex flex-col"
                style={{ border: `2px solid ${p.populair ? p.kleur : 'var(--border)'}`, boxShadow: p.populair ? '0 24px 64px rgba(29,158,117,0.12)' : 'none' }}>
                {p.populair && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-bold px-5 py-2 rounded-full text-white" style={{ background: p.kleur }}>
                      Meest gekozen
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{p.naam}</p>
                  <p className="text-xs text-gray-400 mb-5">{p.sub}</p>
                  <div className="flex items-baseline gap-1">
                    {price !== null
                      ? <><span className="text-2xl font-bold text-gray-400">€</span><span className="font-black text-gray-900 leading-none" style={{ fontSize: '3.25rem' }}>{price}</span></>
                      : <span className="font-black text-gray-900" style={{ fontSize: '2rem' }}>Op maat</span>
                    }
                  </div>
                  {price !== null && <p className="text-xs text-gray-400 mt-1">per medewerker / maand{annual ? ' · jaarlijks' : ''}</p>}
                  <p className="text-xs text-gray-400 mt-0.5 pb-5 border-b border-gray-100 mt-3">{p.min}</p>
                </div>

                <Link href={p.href}
                  className="block w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all mb-7"
                  style={{ background: p.populair ? p.kleur : 'transparent', color: p.populair ? 'white' : p.kleur, border: p.populair ? 'none' : `2px solid ${p.kleur}` }}>
                  {p.cta}
                </Link>

                <ul className="space-y-3 flex-1">
                  {p.features.map(f => <Check key={f} text={f} color={p.kleur} />)}
                  {p.missing.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs flex-shrink-0">—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {price !== null && (
                  <p className="text-xs text-center mt-6 pt-5 border-t border-gray-100" style={{ color: '#b0b8c5' }}>
                    14 dagen gratis · geen creditcard
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'Hoe snel kan ik starten met MentaForce?', a: 'Na registratie kun je direct medewerkers uitnodigen via e-mail of CSV-import. Geen IT-afdeling of installatie nodig. De meeste teams zijn binnen 24 uur live.' },
  { q: 'Is de anonimiteit van medewerkers echt gegarandeerd?', a: 'Ja. HR ziet uitsluitend geaggregeerde groepsgemiddelden. Nooit individuele scores. Voor teams kleiner dan 5 personen worden resultaten extra beschermd. Dit is ingebouwd in de architectuur, niet slechts een instelling.' },
  { q: 'Is er een gratis proefperiode?', a: 'Ja. 14 dagen gratis proberen, geen creditcard vereist. Je hebt direct volledige toegang tot het Starter-plan.' },
  { q: 'Hoe worden de gegevens beschermd?', a: 'MentaForce is volledig AVG-conform. Data wordt opgeslagen op EU-servers. Wij tekenen een verwerkersovereenkomst met elke organisatie en delen nooit data met derden.' },
  { q: 'Kan MentaForce integreren met ons HR-systeem?', a: 'AFAS en Personio koppelingen zijn beschikbaar op Enterprise. Voor andere systemen bieden wij een open API. Neem contact op voor persoonlijk advies.' },
  { q: 'Wat is het minimale aantal medewerkers?', a: "Starter vereist minimaal 10 medewerkers. Groei minimaal 25. Voor kleinere teams of zzp'ers: neem contact op voor een aangepast voorstel." },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="py-28 bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <Label text="Veelgestelde vragen" />
          <SectionHeading sub="Staat je vraag er niet bij? Neem dan direct contact op.">
            Alles wat je wilt weten
          </SectionHeading>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="rounded-2xl border overflow-hidden transition-all"
              style={{ borderColor: open === i ? 'rgba(29,158,117,0.3)' : 'var(--bg-subtle)', background: open === i ? 'rgba(29,158,117,0.02)' : 'white' }}>
              <button className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-gray-900 text-sm leading-snug">{faq.q}</span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'none', background: open === i ? 'rgba(29,158,117,0.1)' : 'var(--bg-subtle)' }}>
                  <Icon name="chevronDown" size={13} color={open === i ? 'var(--mf-green)' : 'var(--text-3)'} />
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-6 border-t" style={{ borderColor: 'rgba(29,158,117,0.1)' }}>
                  <p className="text-sm text-gray-500 leading-relaxed pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-center mt-10 text-gray-400">
          Meer vragen?{' '}
          <Link href="/contact" className="font-semibold hover:opacity-75 transition-opacity" style={{ color: 'var(--mf-green)' }}>
            Neem contact op →
          </Link>
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <Nav />
      <MobileSticky />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#060d1f' }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '100%', background: 'radial-gradient(ellipse, rgba(29,158,117,0.14) 0%, transparent 58%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '40%', height: '70%', background: 'radial-gradient(ellipse, rgba(55,138,221,0.06) 0%, transparent 60%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '40%', left: '30%', width: '30%', height: '60%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 60%)', borderRadius: '50%' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold border"
                style={{ background: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.2)', color: 'var(--mf-green)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--mf-green)' }} />
                Voor Nederlandse HR-teams en medewerkers
              </div>

              <h1 className="font-extrabold text-white leading-[1.08] mb-6 tracking-tight"
                style={{ fontSize: 'clamp(2.75rem, 5vw, 4.25rem)' }}>
                Stop burn-out<br />
                <span style={{ color: 'var(--mf-green)', position: 'relative', display: 'inline-block' }}>
                  voordat het te laat is.
                  <svg aria-hidden="true" viewBox="0 0 340 16" preserveAspectRatio="none"
                    style={{ position: 'absolute', bottom: '-6px', left: 0, width: '100%', height: 14, overflow: 'visible' }}>
                    <path d="M3,11 C55,4 120,14 185,8 C245,3 295,12 337,7"
                      fill="none" stroke="#1D9E75" strokeWidth="3.5" strokeLinecap="round" opacity="0.65"/>
                  </svg>
                </span>
              </h1>

              <p className="mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.125rem', maxWidth: 460 }}>
                MentaForce geeft HR-teams realtime inzicht in welzijn op het werk.
                Detecteer risico&apos;s gemiddeld{' '}
                <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>6 weken eerder</strong>
                {', '}anoniem, AVG-conform en actiegericht.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #17a880)', boxShadow: '0 4px 28px rgba(29,158,117,0.5)' }}>
                  Start gratis, geen creditcard
                  <Icon name="arrowRight" size={14} color="white" />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Bekijk een demo (2 min)
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Volledig anoniem', 'AVG-conform', 'Actief in 1 dag', 'Altijd opzegbaar'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <Icon name="check" size={11} color="#1D9E75" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Product preview */}
            <div className="flex justify-center lg:justify-end">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VERTROUWEN BAR ────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'shield',  color: 'var(--mf-green)', bg: 'var(--mf-green-light)', titel: 'AVG-conform',       sub: 'Data op EU-servers · verwerkersovereenkomst inbegrepen' },
              { icon: 'sparkles',color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', titel: 'Aangedreven door AI',sub: 'Claude AI analyseert patronen en schrijft HR-adviezen in het Nederlands' },
              { icon: 'users',   color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', titel: 'Privacy by design',  sub: 'HR ziet nooit individuele scores, alleen groepsgemiddelden' },
              { icon: 'zap',     color: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', titel: 'Gemaakt in Nederland',sub: 'Nederlandstalig platform, support en documentatie' },
            ].map(p => (
              <div key={p.titel} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: p.bg }}>
                  <Icon name={p.icon as keyof typeof ICONS} size={16} color={p.color} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{p.titel}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PROBLEEM (STATS) ───────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: '#060d1f' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '50%', left: '15%', transform: 'translateY(-50%)', width: '35%', height: '120%', background: 'radial-gradient(ellipse, rgba(239,68,68,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '50%', right: '10%', transform: 'translateY(-50%)', width: '30%', height: '100%', background: 'radial-gradient(ellipse, rgba(55,138,221,0.06) 0%, transparent 65%)', borderRadius: '50%' }} />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="text-center mb-20">
            <Label text="De realiteit" />
            <SectionHeading dark sub="Burn-out is geen HR-probleem. Het is een bedrijfsrisico met een concrete prijs.">
              Waarom jouw organisatie dit<br />niet langer kan negeren
            </SectionHeading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { stat: '1 op 3', label: 'werknemers ervaart burn-outklachten', bron: 'TNO 2024', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
              { stat: '€15.000', label: 'gemiddelde kosten per langdurig verzuim', bron: 'RIVM 2023', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
              { stat: '68%', label: 'HR-managers mist vroegtijdig inzicht', bron: 'Gallup 2023', color: '#378ADD', glow: 'rgba(55,138,221,0.3)' },
            ].map((s, i) => (
              <div key={s.label} className="py-16 px-10 text-center"
                style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <p className="font-black mb-5 tracking-tighter leading-none"
                  style={{ fontSize: 'clamp(3.5rem, 7vw, 5.5rem)', color: s.color, textShadow: `0 0 80px ${s.glow}` }}>
                  {s.stat}
                </p>
                <p className="text-base mb-3 leading-snug max-w-[200px] mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.label}</p>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>*{s.bron}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOE WERKT HET ─────────────────────────────────────────────────── */}
      <section id="hoe-werkt-het" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <Label text="Hoe werkt het" />
            <SectionHeading sub="Geen IT-afdeling. Geen training. Geen gedoe.">
              Van aanmelding tot inzicht<br />in minder dan 24 uur.
            </SectionHeading>
          </div>

          {/* Desktop tijdlijn */}
          <div className="hidden md:block relative">
            {/* Verbindingslijn door knooppunten */}
            <div className="absolute h-px z-0"
              style={{
                top: 24,
                left: 'calc(100% / 6)',
                right: 'calc(100% / 6)',
                background: 'linear-gradient(90deg, #1D9E75 0%, #378ADD 50%, #7c3aed 100%)',
              }} />

            <div className="grid grid-cols-3">
              {[
                { step: '01', dotColor: '#1D9E75', label: 'Vandaag · 5 min', titel: 'Account aanmaken', tekst: "Registreer gratis en nodig collega's uit via e-mail of CSV-import. Geen IT-afdeling nodig. Binnen een dag live." },
                { step: '02', dotColor: '#378ADD', label: 'Wekelijks · 60 sec', titel: 'Medewerkers checken in', tekst: 'Een korte anonieme check-in elke maandag. 12 vragen. Medewerkers zien hun eigen trends. HR ziet uitsluitend groepspatronen.' },
                { step: '03', dotColor: '#7c3aed', label: 'Continu · Realtime', titel: 'HR handelt proactief', tekst: "Het dashboard markeert risico's. De AI formuleert adviezen. Je grijpt in vóórdat iemand uitvalt, gemiddeld 6 weken eerder." },
              ].map(s => (
                <div key={s.step} className="flex flex-col items-center px-8 pt-1">
                  {/* Knooppunt */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm mb-8 relative z-10 bg-white flex-shrink-0"
                    style={{ border: `3px solid ${s.dotColor}`, color: s.dotColor, boxShadow: `0 0 24px ${s.dotColor}30` }}>
                    {s.step}
                  </div>
                  {/* Inhoud */}
                  <span className="text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block"
                    style={{ background: s.dotColor + '14', color: s.dotColor }}>
                    {s.label}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{s.titel}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm text-center">{s.tekst}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobiele tijdlijn */}
          <div className="md:hidden relative">
            <div className="absolute left-[23px] top-6 bottom-6 w-px"
              style={{ background: 'linear-gradient(180deg, #1D9E75, #378ADD, #7c3aed)' }} />
            {[
              { step: '01', dotColor: '#1D9E75', label: 'Vandaag · 5 min', titel: 'Account aanmaken', tekst: "Registreer gratis en nodig collega's uit via e-mail of CSV-import. Geen IT-afdeling nodig. Binnen een dag live." },
              { step: '02', dotColor: '#378ADD', label: 'Wekelijks · 60 sec', titel: 'Medewerkers checken in', tekst: 'Een korte anonieme check-in elke maandag. 12 vragen. Medewerkers zien hun eigen trends. HR ziet uitsluitend groepspatronen.' },
              { step: '03', dotColor: '#7c3aed', label: 'Continu · Realtime', titel: 'HR handelt proactief', tekst: "Het dashboard markeert risico's. De AI formuleert adviezen. Je grijpt in vóórdat iemand uitvalt, gemiddeld 6 weken eerder." },
            ].map((s, i) => (
              <div key={s.step} className={`flex gap-6 ${i < 2 ? 'pb-10' : ''}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 relative z-10 bg-white"
                  style={{ border: `3px solid ${s.dotColor}`, color: s.dotColor, boxShadow: `0 0 20px ${s.dotColor}25` }}>
                  {s.step}
                </div>
                <div className="pt-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
                    style={{ background: s.dotColor + '14', color: s.dotColor }}>
                    {s.label}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.titel}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{s.tekst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA under steps */}
          <div className="text-center mt-16">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--mf-green)', boxShadow: '0 4px 24px rgba(29,158,117,0.35)' }}>
              Begin vandaag gratis
              <Icon name="arrowRight" size={14} color="white" />
            </Link>
            <p className="text-xs mt-4" style={{ color: '#b0b8c5' }}>14 dagen gratis · geen creditcard · operationeel in 24 uur</p>
          </div>
        </div>
      </section>

      {/* ── 5. FUNCTIES (3 MAIN PILLARS) ─────────────────────────────────────── */}
      <section id="functies" className="py-28 relative overflow-hidden" style={{ background: '#060d1f' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(29,158,117,0.07) 0%, transparent 65%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="text-center mb-20">
            <Label text="Functies" />
            <SectionHeading dark sub="Van anonieme meting tot AI-gestuurd HR-advies, alles in één platform.">
              Eén platform voor<br />proactief personeelswelzijn.
            </SectionHeading>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'dashboard', color: '#1D9E75', border: 'rgba(29,158,117,0.2)', glow: 'rgba(29,158,117,0.08)',
                titel: 'HR-dashboard',
                tekst: 'Realtime overzicht van teamwelzijn. Vitaliteitsscores, trends en vroege waarschuwingssignalen op één scherm. Altijd up-to-date, nooit verouderd.',
                items: ['Vitaliteitscore per team & afdeling', 'Burn-out risico detectie', 'Anonieme feedback inbox', 'AI-gestuurde wekelijkse inzichten'],
              },
              {
                icon: 'shield', color: '#378ADD', border: 'rgba(55,138,221,0.2)', glow: 'rgba(55,138,221,0.08)',
                titel: 'Anonieme check-ins',
                tekst: 'Medewerkers geven eerlijke antwoorden omdat het anoniem is. HR ziet enkel groepsgemiddelden. Nooit individuele scores.',
                items: ['5 kant-en-klare vragenlijsten', 'Kleine-teambeveiliging (< 5 pers.)', 'Volledig AVG-conform', 'Automatische herinneringen & follow-up'],
              },
              {
                icon: 'sparkles', color: '#7c3aed', border: 'rgba(124,58,237,0.2)', glow: 'rgba(124,58,237,0.08)',
                titel: 'AI-inzichten',
                tekst: 'Claude AI analyseert jouw teamdata en geeft concrete adviezen in gewone taal. Geen rapporten lezen. Geen jargon. Gewoon actie.',
                items: ['Wekelijkse AI-samenvatting in Nederlands', 'Concrete HR-gespreksadviezen', 'Trendanalyse over meerdere weken', 'Persoonlijke AI-coach voor medewerkers'],
              },
            ].map(f => (
              <div key={f.titel}
                className="group rounded-3xl p-8 transition-all duration-300 cursor-default"
                style={{ background: f.glow, border: `1px solid ${f.border}` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ background: f.color + '20' }}>
                  <Icon name={f.icon as keyof typeof ICONS} size={24} color={f.color} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.titel}</h3>
                <p className="mb-6 leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.tekst}</p>
                <ul className="space-y-3">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: f.color + '25' }}>
                        <Icon name="check" size={10} color={f.color} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. VOOR WIE ──────────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <Label text="Voor wie" />
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Gebouwd voor iedereen in jouw organisatie
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: 'var(--mf-green)', bg: 'var(--mf-green-light)',
                icon: 'barChart',
                titel: 'HR-managers',
                tekst: 'Krijg realtime inzicht in teamwelzijn zonder privacy te schenden. Herken risico\'s vroeg en handel proactief, niet reactief.',
                items: ['Dashboard met vitaliteitsscores', 'AI-inzichten elke maandag', 'AVG-conforme rapportages'],
              },
              {
                color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)',
                icon: 'users',
                titel: 'Medewerkers',
                tekst: 'Check anoniem in, volg je eigen welzijn en krijg persoonlijke tips van de AI-coach. Veilig, privé en altijd beschikbaar.',
                items: ['Persoonlijk vitaliteitsdashboard', 'AI Welzijnscoach (24/7)', 'Journal, focus & burn-out scan'],
              },
              {
                color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)',
                icon: 'zap',
                titel: 'Leidinggevenden',
                tekst: 'Voer betere gesprekken op basis van data, zonder details over individuen te kennen. Stuur op cultuur, niet op gevoel.',
                items: ['Teamtrends op teamniveau', 'Gesprekshandvatten via AI', 'Early warning signalen'],
              },
            ].map(card => (
              <div key={card.titel} className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: card.bg }}>
                  <Icon name={card.icon as keyof typeof ICONS} size={22} color={card.color} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{card.titel}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{card.tekst}</p>
                <ul className="space-y-2.5">
                  {card.items.map(item => <Check key={item} text={item} color={card.color} />)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. ALLE TOOLS (FEATURE GRID) ─────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Een platform. Alle tools.
            </h2>
            <p className="text-lg text-gray-400">Voor medewerkers én HR-managers, in één omgeving.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: 'checkCircle', color: 'var(--mf-green)', bg: 'var(--mf-green-light)', label: 'Wekelijkse check-in', sub: '1 min · 12 metrics' },
              { icon: 'sparkles',    color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', label: 'AI Welzijnscoach',    sub: '24/7 beschikbaar' },
              { icon: 'book',        color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', label: 'Persoonlijk journal', sub: 'Reflectie & inzicht' },
              { icon: 'wind',        color: 'var(--mf-green)', bg: 'var(--mf-green-light)', label: 'Focus & herstel',     sub: 'Ademhaling & timers' },
              { icon: 'alert',       color: 'var(--mf-red)', bg: 'var(--mf-red-light)', label: 'Burn-out scan',       sub: 'Vroeg detecteren' },
              { icon: 'message',     color: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', label: 'Teamchat',            sub: 'Direct communiceren' },
              { icon: 'barChart',    color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', label: 'HR-rapporten',        sub: 'Trends & export' },
              { icon: 'trophy',      color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', label: 'Gewoontetracker',     sub: 'Dagelijkse streaks' },
            ].map(f => (
              <div key={f.label} className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 cursor-default">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: f.bg }}>
                  <Icon name={f.icon as keyof typeof ICONS} size={20} color={f.color} />
                </div>
                <p className="text-sm font-bold text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-400 mt-1">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. VERGELIJKING ──────────────────────────────────────────────────── */}
      <section className="py-28" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <Label text="Vergelijking" />
            <SectionHeading sub="Zie in één oogopslag waarom HR-teams kiezen voor MentaForce.">
              MentaForce vs. de alternatieven
            </SectionHeading>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-white min-w-[560px]">
              {/* Header row */}
              <div className="grid grid-cols-4 border-b border-gray-100">
                <div className="p-5" />
                {[
                  { naam: 'MentaForce', sub: '', highlight: true },
                  { naam: 'Handmatig', sub: 'HR-surveys', highlight: false },
                  { naam: 'Generiek', sub: 'SaaS-tools', highlight: false },
                ].map(col => (
                  <div key={col.naam} className="p-5 text-center border-l border-gray-100"
                    style={{ background: col.highlight ? 'rgba(29,158,117,0.04)' : 'transparent' }}>
                    {col.highlight && (
                      <span className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white mb-2"
                        style={{ background: 'var(--mf-green)' }}>Aanbevolen</span>
                    )}
                    <p className={`text-sm font-bold ${col.highlight ? 'text-gray-900' : 'text-gray-500'}`}>{col.naam}</p>
                    {col.sub && <p className="text-xs text-gray-400">{col.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Feature rows */}
              {[
                { feature: 'Volledige anonimiteit',         menta: true,      hand: false,        gen: 'Beperkt' },
                { feature: 'AVG-conform',                   menta: true,      hand: 'Handmatig',  gen: 'Beperkt' },
                { feature: 'AI HR-inzichten',               menta: true,      hand: false,        gen: false },
                { feature: 'Realtime HR-dashboard',         menta: true,      hand: false,        gen: 'Beperkt' },
                { feature: 'Burn-out detectie',             menta: true,      hand: false,        gen: false },
                { feature: 'Medewerkerportaal',             menta: true,      hand: false,        gen: false },
                { feature: 'Implementatietijd',             menta: '1 dag',   hand: 'Weken',      gen: 'Dagen' },
                { feature: 'HR-tijdsinvestering',           menta: '< 1 u/w', hand: '5+ u/w',    gen: '3+ u/w' },
              ].map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-4 border-b border-gray-50 last:border-0 ${i % 2 !== 0 ? 'bg-gray-50/50' : ''}`}>
                  <div className="p-4 pl-5 flex items-center">
                    <p className="text-sm text-gray-600 font-medium">{row.feature}</p>
                  </div>
                  {([row.menta, row.hand, row.gen] as (boolean | string)[]).map((val, ci) => (
                    <div key={ci} className="p-4 text-center border-l border-gray-100 flex items-center justify-center"
                      style={{ background: ci === 0 ? 'rgba(29,158,117,0.03)' : 'transparent' }}>
                      {val === true ? (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--mf-green-light)' }}>
                          <Icon name="check" size={12} color="#1D9E75" />
                        </span>
                      ) : val === false ? (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
                          <Icon name="x" size={12} color="#d1d5db" />
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
                          style={{ background: ci === 0 ? 'var(--mf-green-light)' : 'var(--bg-subtle)', color: ci === 0 ? 'var(--mf-green)' : 'var(--text-2)' }}>
                          {val}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--mf-green)', boxShadow: '0 4px 24px rgba(29,158,117,0.35)' }}>
              Probeer MentaForce gratis
              <Icon name="arrowRight" size={14} color="white" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. TWEE PERSPECTIEVEN ────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: '#060d1f' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(29,158,117,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">

          <div className="text-center mb-16">
            <Label text="Twee perspectieven. Één platform." />
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Wat iedereen ziet:<br />
              <span style={{ color: 'var(--mf-green)' }}>en wat verborgen blijft.</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Anonimiteit is niet een instelling die je kunt uitzetten. Het zit ingebakken in hoe het platform werkt.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">

            {/* Medewerker kant */}
            <div className="rounded-3xl overflow-hidden border" style={{ borderColor: 'rgba(55,138,221,0.25)', background: 'rgba(55,138,221,0.04)' }}>
              <div className="px-7 py-5 border-b flex items-center gap-3" style={{ borderColor: 'rgba(55,138,221,0.15)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(55,138,221,0.2)' }}>
                  <Icon name="users" size={15} color="#378ADD" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Medewerker</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Ziet alleen zijn eigen data</p>
                </div>
              </div>
              <div className="p-7 space-y-4">
                {[
                  { label: 'Jouw vitaliteitscore', value: '3.8 / 5', color: 'var(--mf-blue)', sub: 'Alleen zichtbaar voor jou' },
                  { label: 'Trend afgelopen 8 weken', value: '↑ Stijgend', color: 'var(--mf-green)', sub: 'Jouw persoonlijk verloop' },
                  { label: 'AI welzijnscoach', value: 'Nieuw advies beschikbaar', color: 'var(--mf-purple)', sub: 'Privé en persoonlijk' },
                  { label: 'Check-in status', value: 'Voltooid · maandag 09:03', color: 'var(--mf-amber)', sub: 'Anoniem ingediend' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-xs font-semibold text-white">{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.sub}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: r.color + '22', color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div className="rounded-2xl px-4 py-3.5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--mf-red)' }}>🔒 Niet beschikbaar voor medewerker</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Scores van collega&apos;s, teamgemiddelden, HR-notities</p>
                </div>
              </div>
            </div>

            {/* HR kant */}
            <div className="rounded-3xl overflow-hidden border" style={{ borderColor: 'rgba(29,158,117,0.25)', background: 'rgba(29,158,117,0.04)' }}>
              <div className="px-7 py-5 border-b flex items-center gap-3" style={{ borderColor: 'rgba(29,158,117,0.15)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.2)' }}>
                  <Icon name="barChart" size={15} color="#1D9E75" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">HR-manager</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Ziet alleen groepspatronen</p>
                </div>
              </div>
              <div className="p-7 space-y-4">
                {[
                  { label: 'Team vitaliteitscore', value: '4.1 / 5 gem.', color: 'var(--mf-green)', sub: 'Groepsgemiddelde · 18 deelnemers' },
                  { label: 'Participatiegraad', value: '87%', color: 'var(--mf-blue)', sub: 'Deze week ingevuld' },
                  { label: 'Risicosignalen', value: '2 signalen', color: 'var(--mf-red)', sub: 'Patroon in de groep, geen namen' },
                  { label: 'AI HR-advies', value: 'Nieuw inzicht', color: 'var(--mf-purple)', sub: 'Gebaseerd op anonieme patronen' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-xs font-semibold text-white">{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.sub}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: r.color + '22', color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div className="rounded-2xl px-4 py-3.5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--mf-red)' }}>🔒 Niet beschikbaar voor HR</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Individuele scores, namen achter signalen, persoonlijke journaalentries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Onderste uitleg balk */}
          <div className="rounded-2xl px-8 py-6 border flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(29,158,117,0.15)' }}>
              <Icon name="shield" size={18} color="#1D9E75" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">Privacy by design: geen instelling, maar architectuur</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Individuele scores worden nooit opgeslagen als herleidbaar gegeven. Het systeem kan ze technisch niet aan een naam koppelen, ook niet als HR dat zou willen. Teams kleiner dan 5 worden extra beschermd: resultaten worden pas getoond zodra voldoende deelnemers hebben ingevuld.
              </p>
            </div>
            <Link href="/register"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-xs transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #17a880)' }}>
              Zelf proberen
              <Icon name="arrowRight" size={12} color="white" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. PRIJZEN ──────────────────────────────────────────────────────── */}
      <Pricing />

      {/* ── 11. FAQ ──────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── 12. CLOSING CTA ──────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: '#060d1f' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(29,158,117,0.12) 0%, transparent 65%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <Label text="Klaar om te beginnen?" />
          <h2 className="font-extrabold text-white mb-5 tracking-tight leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
            Iedere week zonder inzicht<br />is een gemiste kans.
          </h2>
          <p className="text-lg mb-12 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Start vandaag gratis. Je team is operationeel binnen 24 uur.<br />
            Geen creditcard. Geen IT-afdeling. Geen commitment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #17a880)', boxShadow: '0 4px 28px rgba(29,158,117,0.5)' }}>
              Start 14 dagen gratis
              <Icon name="arrowRight" size={14} color="white" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
              Plan een persoonlijke demo
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Geen creditcard', 'Operationeel in 1 dag', 'AVG-conform', 'Maandelijks opzegbaar', 'Nederlandstalig support'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <Icon name="check" size={10} color="rgba(29,158,117,0.85)" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#030812', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-4 max-w-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #15B89A)' }}>M</div>
                <span className="font-bold text-white text-lg">MentaForce</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Vitaliteit op de werkplek. Burn-out preventie voor Nederlandse HR-teams en medewerkers.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                AVG-conform · Data opgeslagen in de EU · Gemaakt in Nederland 🇳🇱
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-12 gap-y-6 text-xs">
              <div className="flex flex-col gap-3">
                <p className="font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Platform</p>
                {[['#functies', 'Functies'], ['#hoe-werkt-het', 'Hoe werkt het'], ['#prijzen', 'Prijzen']].map(([h, l]) => (
                  <a key={h} href={h} className="transition-colors hover:text-white/60" style={{ color: 'rgba(255,255,255,0.22)' }}>{l}</a>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Bedrijf</p>
                {[['contact', 'Contact'], ['voorwaarden', 'Voorwaarden']].map(([h, l]) => (
                  <Link key={h} href={`/${h}`} className="transition-colors hover:text-white/60" style={{ color: 'rgba(255,255,255,0.22)' }}>{l}</Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Account</p>
                {[['register', 'Gratis registreren'], ['login', 'Inloggen'], ['contact?plan=enterprise', 'Demo aanvragen']].map(([h, l]) => (
                  <Link key={h} href={`/${h}`} className="transition-colors hover:text-white/60" style={{ color: 'rgba(255,255,255,0.22)' }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2025 MentaForce B.V. · Amsterdam, Nederland</p>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
              <Link href="/voorwaarden" className="hover:text-white/40 transition-colors">Voorwaarden</Link>
              <span>·</span>
              <Link href="/contact" className="hover:text-white/40 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
