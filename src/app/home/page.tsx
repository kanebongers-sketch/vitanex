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
    { key: 'stemming', label: 'Stemming', emoji: '😊', href: '/stemming', gedaan: false },
    { key: 'slaap',    label: 'Slaap',    emoji: '😴', href: '/slaap',    gedaan: false },
    { key: 'water',    label: 'Water',    emoji: '💧', href: '/water',    gedaan: false },
    { key: 'bewegen',  label: 'Bewegen',  emoji: '🏃', href: '/sport',    gedaan: false },
    { key: 'checkin',  label: 'Check-in', emoji: '✅', href: '/checkin',  gedaan: false },
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
        authFetch('/api/gewoontes').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      // Readiness score
      if (readinessRes.status === 'fulfilled' && readinessRes.value) {
        const d = readinessRes.value as { score?: number; readiness?: number }
        const s = d.score ?? d.readiness ?? null
        if (typeof s === 'number') setReadiness(Math.round(s))
      }

      // Vandaag checklist
      if (vandaagRes.status === 'fulfilled' && vandaagRes.value) {
        const d = vandaagRes.value as Record<string, boolean | unknown>
        setVandaagItems(prev => prev.map(item => ({
          ...item,
          gedaan: Boolean(d[item.key] ?? false),
        })))
      }

      // Streak — hoogste streak uit gewoontes
      if (gewoontesRes.status === 'fulfilled' && gewoontesRes.value) {
        const d = gewoontesRes.value as { gewoontes?: Array<{ streak?: number }> }
        const hoogste = (d.gewoontes ?? []).reduce(
          (max: number, g) => Math.max(max, g.streak ?? 0), 0
        )
        setStreak(hoogste)
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <div className="mf-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />

      {/* ── STICKY HEADER ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(244,246,248,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          MentaForce
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>
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
          onClick={() => router.push('/profiel')}
        >
          {initialen(naam) || '?'}
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* ── 1. READINESS HERO ── */}
        <section
          style={{
            background: gradient,
            border: `1.5px solid ${kleur}25`,
            borderRadius: 28,
            marginBottom: 14,
            overflow: 'hidden',
            boxShadow: `0 4px 28px ${kleur}18`,
          }}
        >
          <div style={{ height: 5, background: `linear-gradient(90deg, ${kleur}, ${kleur}60)` }} />
          <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: kleur, marginBottom: 8 }}>
              Readiness vandaag
            </p>

            <ReadinessRing score={readiness} />

            <p style={{ fontSize: 20, fontWeight: 800, color: kleur, marginTop: 4, letterSpacing: '-0.02em' }}>
              {label}
            </p>

            {/* Data pills */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { emoji: '😴', label: 'Slaap', href: '/slaap' },
                { emoji: '😊', label: 'Stemming', href: '/stemming' },
                { emoji: '⚡', label: 'Stress', href: '/checkin' },
              ].map(p => (
                <Link key={p.label} href={p.href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-2)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{p.emoji}</span>
                    {p.label}
                  </div>
                </Link>
              ))}
            </div>

            {readiness === null ? (
              <Link href="/checkin" style={{ textDecoration: 'none', marginTop: 20, width: '100%' }}>
                <div
                  style={{
                    background: '#1D9E75',
                    color: '#fff',
                    borderRadius: 14,
                    padding: '14px 24px',
                    textAlign: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                  }}
                >
                  Log vandaag om je score te berekenen
                </div>
              </Link>
            ) : (
              <Link href="/checkin" style={{ textDecoration: 'none', marginTop: 20, width: '100%' }}>
                <div
                  style={{
                    background: kleur,
                    color: '#fff',
                    borderRadius: 14,
                    padding: '13px 24px',
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    boxShadow: `0 4px 16px ${kleur}40`,
                  }}
                >
                  Start je dag →
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ── 2. STREAK BANNER ── */}
        <section
          style={{
            background: streak >= 30
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : streak > 0
              ? 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)'
              : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
            border: `1.5px solid ${streak > 0 ? 'rgba(186,117,23,0.25)' : 'var(--border)'}`,
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: streak > 0 ? '0 2px 16px rgba(186,117,23,0.10)' : 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>
            {streak >= 30 ? '🏆' : streak > 0 ? '🔥' : '💪'}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: streak > 0 ? '#92400E' : 'var(--text-1)', letterSpacing: '-0.03em' }}>
              {streak > 0 ? `${streak} DAGEN OP RIJ` : 'Start vandaag je streak!'}
            </p>
            <p style={{ fontSize: 12, color: streak > 0 ? '#B45309' : 'var(--text-4)', fontWeight: 500, marginTop: 2 }}>
              {streak > 0
                ? 'Elke dag telt. Mis je vandaag, start je opnieuw.'
                : 'Log elke dag en bouw een gewoonte op.'
              }
            </p>
          </div>
        </section>

        {/* ── 3. VANDAAG CHECKLIST ── */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 14,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
              Nog te doen vandaag
            </p>
            <span style={{ fontSize: 12, fontWeight: 700, color: gedaanCount === vandaagItems.length ? '#1D9E75' : 'var(--text-4)' }}>
              {gedaanCount}/{vandaagItems.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {vandaagItems.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: item.gedaan ? 'rgba(29,158,117,0.06)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      width: 22,
                      textAlign: 'center',
                      color: item.gedaan ? '#1D9E75' : '#D1D5DB',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {item.gedaan ? '✓' : '●'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.gedaan ? '#1D9E75' : 'var(--text-2)', flex: 1 }}>
                    {item.emoji} {item.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-4)' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 4. SNELLE LOG KNOPPEN ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-4)', marginBottom: 12 }}>
            Snel loggen
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}
          >
            {snelLog.map(actie => (
              <Link key={actie.href} href={actie.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '16px 8px 14px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-2px)'
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
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--mf-green-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      lineHeight: 1,
                    }}
                  >
                    {actie.emoji}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center', letterSpacing: '0.01em' }}>
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
