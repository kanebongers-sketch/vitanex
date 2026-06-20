'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

// ── Helpers ───────────────────────────────────────────────────

function nlDatumKort(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function dagdeel(): string {
  const uur = new Date().getHours()
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function readinessAdvies(score: number | null): { tekst: string; kleur: string; bg: string } {
  if (score === null) return { tekst: '', kleur: '', bg: '' }
  if (score >= 80) return {
    tekst: 'Je bent klaar voor de dag',
    kleur: '#1D9E75',
    bg: 'linear-gradient(135deg, #E1F5EE 0%, #D1FAE5 100%)',
  }
  if (score >= 50) return {
    tekst: 'Let op je energie vandaag',
    kleur: '#BA7517',
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  }
  return {
    tekst: 'Neem het rustig vandaag',
    kleur: '#E24B4A',
    bg: 'linear-gradient(135deg, #FEF2F2 0%, #FCEBEB 100%)',
  }
}

function initialen(naam: string): string {
  return naam
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Onbekend'
  if (score >= 80) return 'Hersteld'
  if (score >= 60) return 'Goed'
  if (score >= 40) return 'Matig'
  return 'Rust nodig'
}

function scoreKleur(score: number | null): string {
  if (score === null) return '#9CA3AF'
  if (score >= 80) return '#1D9E75'
  if (score >= 60) return '#185FA5'
  if (score >= 40) return '#BA7517'
  return '#E24B4A'
}

function scoreGradient(score: number | null): string {
  if (score === null) return 'linear-gradient(160deg, #F9FAFB 0%, #F3F4F6 100%)'
  if (score >= 80) return 'linear-gradient(160deg, #E1F5EE 0%, #D1FAE5 60%, #F0FDF4 100%)'
  if (score >= 60) return 'linear-gradient(160deg, #E6F1FB 0%, #DBEAFE 60%, #EFF6FF 100%)'
  if (score >= 40) return 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 60%, #FFF7ED 100%)'
  return 'linear-gradient(160deg, #FEF2F2 0%, #FCEBEB 60%, #FFF5F5 100%)'
}

// ── ReadinessRing ─────────────────────────────────────────────

function ReadinessRing({ score }: { score: number | null }) {
  const r = 64
  const circ = 2 * Math.PI * r
  const pct = score ?? 0
  const kleur = scoreKleur(score)

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      role="img"
      aria-label={`Readiness score: ${score ?? 'onbekend'} van 100`}
    >
      <circle cx="80" cy="80" r={r} fill="none" stroke={`${kleur}20`} strokeWidth="12" />
      <circle
        cx="80"
        cy="80"
        r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="12"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {score !== null ? (
        <>
          <text x="80" y="73" textAnchor="middle" fontSize="38" fontWeight="900" fill={kleur}>
            {score}
          </text>
          <text x="80" y="92" textAnchor="middle" fontSize="12" fill="#9CA3AF" fontWeight="600">
            /100
          </text>
        </>
      ) : (
        <text x="80" y="86" textAnchor="middle" fontSize="14" fill="#9CA3AF" fontWeight="600">
          Geen data
        </text>
      )}
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────

interface VandaagItem {
  key: string
  label: string
  emoji: string
  href: string
  gedaan: boolean
}

export default function HomePage() {
  const router = useRouter()

  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [vandaagItems, setVandaagItems] = useState<VandaagItem[]>([
    { key: 'stemming',    label: 'Stemming',   emoji: '😊', href: '/stemming',    gedaan: false },
    { key: 'slaap',       label: 'Slaap',      emoji: '😴', href: '/slaap',       gedaan: false },
    { key: 'water',       label: 'Water',       emoji: '💧', href: '/water',       gedaan: false },
    { key: 'sport',       label: 'Bewegen',     emoji: '🏃', href: '/sport',       gedaan: false },
    { key: 'meditatie',   label: 'Meditatie',   emoji: '🧘', href: '/meditatie',   gedaan: false },
    { key: 'dankbaarheid',label: 'Dankbaarheid',emoji: '🙏', href: '/dankbaarheid',gedaan: false },
  ])

  const snelLog = [
    { href: '/stemming',  emoji: '😊', label: 'Stemming'  },
    { href: '/water',     emoji: '💧', label: 'Water'     },
    { href: '/slaap',     emoji: '😴', label: 'Slaap'     },
    { href: '/sport',     emoji: '🏃', label: 'Sport'     },
    { href: '/voeding',   emoji: '🍎', label: 'Eten'      },
    { href: '/meditatie', emoji: '🧘', label: 'Mediteren' },
  ]

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, onboarding_voltooid')
        .eq('id', user.id)
        .single()

      if (!profiel?.onboarding_voltooid) { router.replace('/onboarding'); return }
      setNaam(profiel?.naam ?? '')
      setLaden(false)

      // Parallel fetches
      const [readinessRes, vandaagRes, gewoontesRes] = await Promise.allSettled([
        authFetch('/api/readiness').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/vandaag').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/streak').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      // Readiness score
      if (readinessRes.status === 'fulfilled' && readinessRes.value) {
        const d = readinessRes.value as { score?: number; readiness?: number }
        const s = d.score ?? d.readiness ?? null
        if (typeof s === 'number') setReadiness(Math.round(s))
      }

      // Vandaag checklist — API geeft { checklist: [{id, status}], scores, suggestie }
      if (vandaagRes.status === 'fulfilled' && vandaagRes.value) {
        const d = vandaagRes.value as { checklist?: Array<{ id: string; status: string }> }
        const gedaanSet = new Set(
          (d.checklist ?? []).filter(i => i.status === 'gedaan').map(i => i.id)
        )
        setVandaagItems(prev => prev.map(item => ({
          ...item,
          gedaan: gedaanSet.has(item.key),
        })))
      }

      // Streak uit /api/streak
      if (gewoontesRes.status === 'fulfilled' && gewoontesRes.value) {
        const d = gewoontesRes.value as { streak?: number }
        setStreak(d.streak ?? 0)
      }
    }

    laad()
  }, [router])

  const kleur = scoreKleur(readiness)
  const label = scoreLabel(readiness)
  const gradient = scoreGradient(readiness)
  const gedaanCount = vandaagItems.filter(i => i.gedaan).length

  if (laden) {
    return (
      <div style={{ minHeight: '100vh' }} className="mf-mesh-bg">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 160, flexDirection: 'column', gap: 16 }}>
          <div className="mf-spinner" />
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 500 }}>Laden…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} className="mf-mesh-bg">
      <Navbar />

      {/* ── FIXED HEADER ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          zIndex: 40,
          width: '100%',
          background: 'rgba(244,246,248,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 17,
            fontWeight: 400,
            color: 'var(--mf-green)',
          }}
        >
          MentaForce
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>
          {nlDatumKort()}
        </span>
        <div
          aria-label="Profielmenu"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: kleur,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: '#fff',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => router.push('/instellingen')}
        >
          {initialen(naam) || '?'}
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '72px 16px 120px' }}>

        {/* ── GREETING ── */}
        <div
          className="mf-animate-slide-up"
          style={{ marginBottom: 18 }}
        >
          <h1
            style={{
              fontSize: 'clamp(22px, 6vw, 28px)',
              fontWeight: 800,
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            {dagdeel()}{naam ? `, ${naam.split(' ')[0]}` : ''} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 500 }}>
            {nlDatumKort()} · Hoe voel jij je vandaag?
          </p>

          {/* Readiness advies banner (alleen als score aanwezig) */}
          {readiness !== null && (() => {
            const advies = readinessAdvies(readiness)
            return (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 16,
                  background: advies.bg,
                  border: `1.5px solid ${advies.kleur}30`,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: `0 2px 12px ${advies.kleur}15`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: advies.kleur,
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${advies.kleur}60`,
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: advies.kleur,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {advies.tekst}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 18,
                    fontWeight: 900,
                    color: advies.kleur,
                  }}
                >
                  {readiness}
                </span>
              </div>
            )
          })()}
        </div>

        {/* ── SECTION 1 — READINESS HERO ── */}
        <section
          className="mf-grain"
          style={{
            borderRadius: 28,
            background: gradient,
            border: `1.5px solid ${kleur}22`,
            boxShadow: `0 8px 40px ${kleur}15, 0 2px 8px ${kleur}08`,
            marginBottom: 16,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ height: 5, background: `linear-gradient(90deg, ${kleur}, ${kleur}50)`, width: '100%' }} />
          <div
            style={{
              padding: '32px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: kleur,
                opacity: 0.85,
                marginBottom: 20,
              }}
            >
              READINESS VANDAAG
            </p>

            <div className="mf-animate-breathe mf-animate-glow" style={{ display: 'inline-block' }}>
              <ReadinessRing score={readiness} />
            </div>

            <p
              className="mf-display"
              style={{
                fontSize: 'clamp(22px, 5vw, 28px)',
                color: kleur,
                marginTop: 12,
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
              }}
            >
              {label}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/slaap" className="mf-pill"><span>😴</span> Slaap</Link>
              <Link href="/stemming" className="mf-pill"><span>😊</span> Stemming</Link>
              <Link href="/checkin" className="mf-pill"><span>⚡</span> Stress</Link>
            </div>

            <Link
              href="/checkin"
              style={{
                marginTop: 24,
                width: '100%',
                background: kleur,
                color: 'white',
                borderRadius: 14,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: `0 4px 20px ${kleur}35`,
                letterSpacing: '-0.01em',
                display: 'block',
                textDecoration: 'none',
              }}
            >
              {readiness === null ? 'Log vandaag om je score te berekenen' : 'Start je dag →'}
            </Link>
          </div>
        </section>

        {/* ── STREAK MOTIVATOR BANNER (>=30 of >=7) ── */}
        {streak >= 30 && (
          <section
            className="mf-animate-slide-up mf-stagger-1"
            style={{
              borderRadius: 20,
              background: 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)',
              padding: '20px 22px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 8px 32px rgba(29,158,117,0.35)',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: '#FDE047',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
            }}>🏆</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>
                30 dagen sterk! Je bent een kampioen.
              </p>
              <p style={{ fontSize: 12, color: '#86efac', fontWeight: 500 }}>
                Volharding als deze verandert levens. Ga zo door!
              </p>
            </div>
          </section>
        )}
        {streak >= 7 && streak < 30 && (
          <section
            className="mf-animate-slide-up mf-stagger-1"
            style={{
              borderRadius: 20,
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 60%, #FDBA74 100%)',
              border: '1.5px solid rgba(249,115,22,0.35)',
              padding: '18px 22px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 4px 20px rgba(249,115,22,0.2)',
            }}
          >
            <div
              className="mf-animate-flame"
              style={{
                width: 52, height: 52, borderRadius: '50%', background: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}
            >🔥</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#92400E', marginBottom: 2 }}>
                Je bent op een {streak}-daagse streak!
              </p>
              <p style={{ fontSize: 12, color: '#B45309', fontWeight: 500 }}>
                Elke dag bijhouden bouwt een gewoonte voor het leven.
              </p>
            </div>
          </section>
        )}

        {/* ── SECTION 2 — STREAK ── */}
        <section
          className="mf-animate-slide-up mf-stagger-1"
          style={{
            borderRadius: 20,
            background: streak >= 30
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : streak > 0
              ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
              : 'var(--bg-card)',
            border: streak > 0 ? '1.5px solid rgba(186,117,23,0.22)' : '1px solid var(--border)',
            padding: '20px 22px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: streak > 0 ? 'var(--shadow-amber-glow)' : 'var(--shadow-xs)',
          }}
        >
          <div
            className={streak > 0 ? 'mf-animate-flame' : ''}
            style={{
              width: streak >= 7 ? 64 : 52,
              height: streak >= 7 ? 64 : 52,
              borderRadius: '50%',
              background: streak >= 30 ? '#FDE047' : streak >= 7 ? '#FCD34D' : streak > 0 ? '#FED7AA' : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: streak >= 7 ? 34 : 28,
              flexShrink: 0,
              boxShadow: streak >= 7 ? '0 4px 16px rgba(251,191,36,0.45)' : 'none',
              transition: 'all 0.4s ease',
            }}
          >
            {streak >= 30 ? '🏆' : streak >= 7 ? '🔥' : streak > 0 ? '🔥' : '💪'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                className="mf-display"
                style={{
                  fontSize: streak >= 7 ? 36 : 28,
                  color: streak >= 30 ? '#78350F' : streak >= 7 ? '#92400E' : streak > 0 ? '#92400E' : 'var(--text-1)',
                  transition: 'font-size 0.3s ease',
                }}
              >
                {streak > 0 ? `${streak}` : '0'}
              </span>
              <span
                style={{
                  fontSize: streak >= 7 ? 16 : 14,
                  fontWeight: 700,
                  color: streak >= 30 ? '#78350F' : streak > 0 ? '#92400E' : 'var(--text-1)',
                }}
              >
                {streak > 0 ? ' dagen op rij' : ' – start vandaag!'}
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: streak > 0 ? '#B45309' : 'var(--text-4)',
                fontWeight: 500,
                marginTop: 3,
              }}
            >
              {streak >= 30
                ? 'Ongelooflijk — je bent een ware kampioen!'
                : streak >= 7
                ? 'Je bent in de flow. Houd dit vol!'
                : streak > 0
                ? 'Elke dag telt. Mis je vandaag, start je opnieuw.'
                : 'Log elke dag en bouw een gewoonte op.'}
            </p>
          </div>
        </section>

        {/* ── SECTION 3 — VANDAAG CHECKLIST ── */}
        <section
          className="mf-animate-slide-up mf-stagger-2"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 14,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              Vandaag
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: gedaanCount === vandaagItems.length ? 'var(--mf-green)' : 'var(--text-4)',
              }}
            >
              {gedaanCount}/{vandaagItems.length}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 3,
              borderRadius: 100,
              background: 'var(--bg-subtle)',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(gedaanCount / vandaagItems.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--mf-green), var(--mf-green-mid))',
                borderRadius: 100,
                transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>

          {/* Checklist items */}
          {vandaagItems.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`mf-check-row${item.gedaan ? ' done' : ''}`}
            >
              <span className="mf-check-bubble">
                {item.gedaan ? <span style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>✓</span> : null}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: item.gedaan ? 600 : 500,
                  color: item.gedaan ? 'var(--mf-green)' : 'var(--text-2)',
                  flex: 1,
                  textDecoration: item.gedaan ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(29,158,117,0.4)',
                }}
              >
                {item.emoji} {item.label}
              </span>
              {!item.gedaan && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>›</span>}
            </Link>
          ))}
        </section>

        {/* ── SECTION 4 — SNEL LOGGEN ── */}
        <section className="mf-animate-slide-up mf-stagger-3">
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--text-4)',
              marginBottom: 12,
            }}
          >
            Snel loggen
          </p>
          <div className="mf-scroll-row">
            {snelLog.map(actie => (
              <Link key={actie.href} href={actie.href} className="mf-scroll-item" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '16px 18px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    boxShadow: 'var(--shadow-xs)',
                    minWidth: 80,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'var(--shadow-xs)'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--mf-green-light), rgba(29,158,117,0.08))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      lineHeight: 1,
                    }}
                  >
                    {actie.emoji}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-3)',
                      textAlign: 'center',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {actie.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
