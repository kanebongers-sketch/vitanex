'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

// ── Types ──────────────────────────────────────────────────────

interface GewoonteDag {
  id: string
  naam: string
  gedaan: boolean
  emoji?: string
}

interface WeekrapportData {
  score_label?: string
  tip?: string
  samenvatting?: string
}

interface RecentLog {
  type: 'stemming' | 'slaap' | 'sport'
  label: string
  waarde: string
  tijd: string
  emoji: string
}

// ── ScoreRing ─────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const trackKleur =
    score >= 70
      ? 'rgba(29,158,117,0.12)'
      : score >= 45
      ? 'rgba(245,158,11,0.12)'
      : 'rgba(239,68,68,0.12)'

  return (
    <svg
      width="130"
      height="130"
      viewBox="0 0 130 130"
      style={{ flexShrink: 0 }}
      role="img"
      aria-label={`Vitaliteitsscore: ${score} van 100`}
    >
      <circle cx="65" cy="65" r={r} fill="none" stroke={trackKleur} strokeWidth="10" />
      <circle
        cx="65"
        cy="65"
        r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="10"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text x="65" y="59" textAnchor="middle" fontSize="30" fontWeight="800" fill={kleur}>
        {score}
      </text>
      <text x="65" y="77" textAnchor="middle" fontSize="11" fill="#9CA3AF" fontWeight="600">
        /100
      </text>
    </svg>
  )
}

// ── ActivityRing ──────────────────────────────────────────────

function ActivityRing({
  pct,
  emoji,
  label,
}: {
  pct: number
  emoji: string
  label: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  const r = 22
  const circ = 2 * Math.PI * r
  const kleur = clamped >= 80 ? '#1D9E75' : clamped >= 50 ? '#F59E0B' : '#EF4444'
  const track = clamped >= 80 ? 'rgba(29,158,117,0.12)' : clamped >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke={track} strokeWidth="6" />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={kleur}
            strokeWidth="6"
            strokeDasharray={`${(clamped / 100) * circ} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          {emoji}
        </span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, color: kleur }}>{Math.round(clamped)}%</span>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function dagtijdBegroeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Goedemorgen'
  if (h < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function dagEmoji(): string {
  const h = new Date().getHours()
  if (h < 12) return '☀️'
  if (h < 18) return '🌤️'
  return '🌙'
}

function nlDatum(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function tijdGeleden(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m geleden`
  const uur = Math.floor(min / 60)
  if (uur < 24) return `${uur}u geleden`
  return `${Math.floor(uur / 24)}d geleden`
}

// ── Component ─────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  // Meta
  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')

  // Score
  const [vitaalScore, setVitaalScore] = useState<number | null>(null)

  // Mini-stats
  const [slaapUren, setSlaapUren] = useState<number | null>(null)
  const [stemming, setStemming] = useState<number | null>(null)
  const [energie, setEnergie] = useState<number | null>(null)

  // Activity rings (percentages 0–100)
  const [ringBewegen, setRingBewegen] = useState(0)
  const [ringMindful, setRingMindful] = useState(0)
  const [ringSlaap, setRingSlaap] = useState(0)

  // Gewoontes
  const [gewoontes, setGewoontes] = useState<GewoonteDag[]>([])

  // Weekrapport tip
  const [weekTip, setWeekTip] = useState<WeekrapportData | null>(null)

  // Recente activiteit
  const [recenteLogs, setRecenteLogs] = useState<RecentLog[]>([])

  useEffect(() => {
    async function laad() {
      // Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Profiel + onboarding check
      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, onboarding_voltooid')
        .eq('id', user.id)
        .single()

      if (!profiel?.onboarding_voltooid) {
        router.replace('/onboarding')
        return
      }
      setNaam(profiel?.naam ?? '')

      // Sessie check (7 dagen)
      const zevenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: sessie } = await supabase
        .from('checkin_sessies')
        .select('id')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zevenGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!sessie) {
        router.push('/checkin')
        return
      }

      setLaden(false)

      // Parallel: score + mini-stats + gewoontes + weekrapport
      const vandaag = new Date().toISOString().slice(0, 10)
      const DOMEIN_CODES: Record<string, string[]> = {
        slaap:     ['slaap_kwaliteit', 'slaap_uren', 'slaap_fris', 'slaap_loslaten'],
        stress:    ['stress_niveau', 'stress_piekeren', 'stress_controle', 'stress_ontspanning'],
        energie:   ['energie_niveau', 'energie_beweging', 'energie_voeding', 'energie_dip'],
        focus:     ['focus_concentratie', 'focus_helderheid', 'focus_aanwezig', 'focus_flow'],
        balans:    ['balans_werk_prive', 'balans_grenzen', 'balans_tijd', 'balans_herstel'],
        motivatie: ['motivatie_werk', 'motivatie_zinvol', 'motivatie_enthousiasme', 'motivatie_waardering'],
      }

      const [antwoordenRes, slaapRes, stemmingRes, energieRes, gewoontesRes, weekRes] =
        await Promise.allSettled([
          supabase
            .from('checkin_antwoorden')
            .select('vraag_code, waarde_schaal')
            .eq('sessie_id', sessie.id)
            .not('waarde_schaal', 'is', null),
          supabase
            .from('slaap_logs')
            .select('uren, aangemaakt_op')
            .eq('user_id', user.id)
            .gte('aangemaakt_op', vandaag)
            .order('aangemaakt_op', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('stemming_logs')
            .select('waarde, aangemaakt_op')
            .eq('user_id', user.id)
            .gte('aangemaakt_op', vandaag)
            .order('aangemaakt_op', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('burnout_scores')
            .select('score, aangemaakt_op')
            .eq('user_id', user.id)
            .order('aangemaakt_op', { ascending: false })
            .limit(1)
            .maybeSingle(),
          authFetch('/api/gewoontes').then(r => r.ok ? r.json() : null).catch(() => null),
          authFetch('/api/inzichten/weekrapport').then(r => r.ok ? r.json() : null).catch(() => null),
        ])

      // Vitaal score uit check-in antwoorden
      if (antwoordenRes.status === 'fulfilled' && antwoordenRes.value.data?.length) {
        const codeMap: Record<string, number> = {}
        for (const r of antwoordenRes.value.data) {
          if (r.waarde_schaal != null) codeMap[r.vraag_code] = Number(r.waarde_schaal)
        }
        const domeinVals: number[] = []
        for (const codes of Object.values(DOMEIN_CODES)) {
          const som = codes.reduce((acc, c) => acc + (codeMap[c] ?? 0), 0)
          if (som > 0) domeinVals.push(som)
        }
        if (domeinVals.length) {
          const avg = domeinVals.reduce((a, b) => a + b, 0) / domeinVals.length
          setVitaalScore(Math.round(((avg - 4) / 16) * 100))
        }
      }

      // Slaap
      if (slaapRes.status === 'fulfilled' && slaapRes.value.data) {
        const uren = Number((slaapRes.value.data as { uren?: number }).uren ?? 0)
        setSlaapUren(uren)
        setRingSlaap((uren / 8) * 100)

        const sl = slaapRes.value.data as { aangemaakt_op?: string; uren?: number }
        if (sl.aangemaakt_op) {
          setRecenteLogs(prev => [
            ...prev,
            {
              type: 'slaap',
              label: 'Slaap gelogd',
              waarde: `${uren}u`,
              tijd: sl.aangemaakt_op!,
              emoji: '😴',
            },
          ])
        }
      }

      // Stemming
      if (stemmingRes.status === 'fulfilled' && stemmingRes.value.data) {
        const val = Number((stemmingRes.value.data as { waarde?: number }).waarde ?? 0)
        setStemming(val)

        const sm = stemmingRes.value.data as { aangemaakt_op?: string; waarde?: number }
        if (sm.aangemaakt_op) {
          setRecenteLogs(prev => [
            ...prev,
            {
              type: 'stemming',
              label: 'Stemming gelogd',
              waarde: `${val}/5`,
              tijd: sm.aangemaakt_op!,
              emoji: '😊',
            },
          ])
        }
      }

      // Energie uit burnout score
      if (energieRes.status === 'fulfilled' && energieRes.value.data) {
        const score = Number((energieRes.value.data as { score?: number }).score ?? 50)
        setEnergie(score)
      }

      // Mindful ring (placeholder – geen apart endpoint, toont 0 tenzij meditatie logs bestaan)
      try {
        const { data: meditatie } = await supabase
          .from('meditatie_sessies')
          .select('minuten')
          .eq('user_id', user.id)
          .gte('aangemaakt_op', vandaag)
        const totalMins = (meditatie ?? []).reduce(
          (acc: number, m: { minuten?: number }) => acc + (m.minuten ?? 0),
          0
        )
        setRingMindful((totalMins / 20) * 100)
      } catch { /* ok */ }

      // Bewegen ring (stappen via health data of sport logs)
      try {
        const { data: sport } = await supabase
          .from('sport_logs')
          .select('duur_minuten, aangemaakt_op')
          .eq('user_id', user.id)
          .gte('aangemaakt_op', vandaag)
        const totalSport = (sport ?? []).reduce(
          (acc: number, s: { duur_minuten?: number }) => acc + (s.duur_minuten ?? 0),
          0
        )
        // 30 min actief = 100%
        setRingBewegen((totalSport / 30) * 100)

        if (sport?.length) {
          const laatste = sport[sport.length - 1] as { aangemaakt_op?: string; duur_minuten?: number }
          if (laatste.aangemaakt_op) {
            setRecenteLogs(prev => [
              ...prev,
              {
                type: 'sport',
                label: 'Workout gelogd',
                waarde: `${laatste.duur_minuten ?? 0}min`,
                tijd: laatste.aangemaakt_op!,
                emoji: '💪',
              },
            ])
          }
        }
      } catch { /* ok */ }

      // Gewoontes
      if (gewoontesRes.status === 'fulfilled' && gewoontesRes.value) {
        const data = gewoontesRes.value as { gewoontes?: GewoonteDag[] }
        setGewoontes((data.gewoontes ?? []).slice(0, 4))
      }

      // Weekrapport
      if (weekRes.status === 'fulfilled' && weekRes.value) {
        const data = weekRes.value as { rapport?: WeekrapportData }
        if (data.rapport) setWeekTip(data.rapport)
      }
    }

    laad()
  }, [router])

  // Afgeleide waarden
  const voornaam = naam.split(' ')[0]
  const scoreKleur =
    vitaalScore === null
      ? '#9CA3AF'
      : vitaalScore >= 70
      ? '#1D9E75'
      : vitaalScore >= 45
      ? '#F59E0B'
      : '#EF4444'

  const scoreBorderKleur =
    vitaalScore === null
      ? '#E5E7EB'
      : vitaalScore >= 70
      ? 'rgba(29,158,117,0.25)'
      : vitaalScore >= 45
      ? 'rgba(245,158,11,0.25)'
      : 'rgba(239,68,68,0.25)'

  const scoreGradient =
    vitaalScore === null
      ? 'linear-gradient(135deg, #F9FAFB, #F3F4F6)'
      : vitaalScore >= 70
      ? 'linear-gradient(135deg, #E1F5EE 0%, #D1FAE5 60%, #F0FDF4 100%)'
      : vitaalScore >= 45
      ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FFF7ED 100%)'
      : 'linear-gradient(135deg, #FEF2F2 0%, #FCEBEB 60%, #FFF5F5 100%)'

  const snelleActies = [
    { href: '/voeding',   emoji: '🍎', label: 'Voeding'   },
    { href: '/stemming',  emoji: '😊', label: 'Stemming'  },
    { href: '/sport',     emoji: '💪', label: 'Sport'     },
    { href: '/water',     emoji: '💧', label: 'Water'     },
    { href: '/meditatie', emoji: '🧘', label: 'Mediteer'  },
    { href: '/checkin',   emoji: '✅', label: 'Check-in'  },
  ]

  const sortedLogs = [...recenteLogs].sort(
    (a, b) => new Date(b.tijd).getTime() - new Date(a.tijd).getTime()
  ).slice(0, 5)

  if (laden) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
            gap: 16,
          }}
        >
          <div className="mf-spinner" />
          <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Dashboard laden…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: '24px 16px 100px',
        }}
      >

        {/* ── HEADER ── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text-1)',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {dagtijdBegroeting()}, {voornaam}! {dagEmoji()}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-4)',
                textTransform: 'capitalize',
                fontWeight: 500,
              }}
            >
              {nlDatum()}
            </p>
          </div>

          {/* Notificatiebel */}
          <Link href="/meldingen" style={{ textDecoration: 'none', marginTop: 2 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </Link>
        </header>

        {/* ── HERO CARD ── */}
        <section
          style={{
            background: scoreGradient,
            border: `1.5px solid ${scoreBorderKleur}`,
            borderRadius: 24,
            marginBottom: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Groene bovenrand accent */}
          <div
            style={{
              height: 4,
              background: `linear-gradient(90deg, ${scoreKleur}, ${scoreKleur}80)`,
              borderRadius: '24px 24px 0 0',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '20px 20px 16px',
            }}
          >
            {/* Score ring links */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {vitaalScore !== null ? (
                <ScoreRing score={vitaalScore} />
              ) : (
                <div
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.6)',
                    border: '2px dashed #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#D1D5DB', fontSize: 28 }}>—</span>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: scoreKleur,
                    marginBottom: 2,
                  }}
                >
                  {vitaalScore !== null ? `${vitaalScore}% vitaal` : 'Geen data'}
                </p>
                <Link
                  href="/rapport"
                  style={{
                    fontSize: 11,
                    color: scoreKleur,
                    fontWeight: 600,
                    textDecoration: 'none',
                    opacity: 0.8,
                  }}
                >
                  Bekijk rapport →
                </Link>
              </div>
            </div>

            {/* Mini-stats rechts */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Slaap */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  borderRadius: 12,
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <span style={{ fontSize: 13 }}>😴</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flex: 1, marginLeft: 8 }}>
                  Slaap
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#6366F1' }}>
                  {slaapUren !== null ? `${slaapUren}u` : '—'}
                </span>
              </div>

              {/* Stemming */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  borderRadius: 12,
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <span style={{ fontSize: 13 }}>😊</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flex: 1, marginLeft: 8 }}>
                  Stemming
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>
                  {stemming !== null ? `${stemming}/5` : '—'}
                </span>
              </div>

              {/* Energie */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  borderRadius: 12,
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <span style={{ fontSize: 13 }}>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flex: 1, marginLeft: 8 }}>
                  Energie
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1D9E75' }}>
                  {energie !== null ? `${Math.round(energie)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── VANDAAG SECTIE — Activity Rings ── */}
        <section style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--text-4)',
              marginBottom: 14,
            }}
          >
            Jouw dag in één oogopslag
          </p>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 20,
              padding: '20px 16px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            <ActivityRing pct={ringBewegen} emoji="🏃" label="Bewegen" />
            <ActivityRing pct={ringMindful} emoji="🧠" label="Mindful" />
            <ActivityRing pct={ringSlaap} emoji="💤" label="Slaap" />
          </div>
        </section>

        {/* ── SNELLE ACTIES ── */}
        <section style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--text-4)',
              marginBottom: 14,
            }}
          >
            Snel loggen
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}
          >
            {snelleActies.map(actie => (
              <Link
                key={actie.href}
                href={actie.href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: '14px 8px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease)',
                    cursor: 'pointer',
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
                      borderRadius: 16,
                      background: 'var(--mf-green-light)',
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
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-2)',
                      textAlign: 'center',
                    }}
                  >
                    {actie.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── GEWOONTES VANDAAG ── */}
        <section style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: 'var(--text-4)',
              }}
            >
              Gewoontes
            </p>
            <Link
              href="/gewoontes"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--mf-green)',
                textDecoration: 'none',
              }}
            >
              Alles →
            </Link>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 20,
              padding: '16px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {gewoontes.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {gewoontes.map(g => (
                  <div
                    key={g.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 20,
                      background: g.gedaan ? 'var(--mf-green-light)' : '#F3F4F6',
                      border: `1.5px solid ${g.gedaan ? 'rgba(29,158,117,0.3)' : 'transparent'}`,
                      cursor: 'default',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: g.gedaan ? 'var(--mf-green)' : '#9CA3AF',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {g.gedaan ? '✓' : '○'}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: g.gedaan ? 'var(--mf-green-dark)' : '#6B7280',
                      }}
                    >
                      {g.emoji ? `${g.emoji} ` : ''}{g.naam}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 8 }}>
                  Nog geen gewoontes ingesteld
                </p>
                <Link
                  href="/gewoontes"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--mf-green)',
                    textDecoration: 'none',
                  }}
                >
                  Voeg gewoontes toe →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── WEKELIJKS INZICHT ── */}
        {weekTip && (weekTip.tip || weekTip.samenvatting) && (
          <section style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: 'var(--text-4)',
                marginBottom: 14,
              }}
            >
              Wekelijks inzicht
            </p>
            <div
              style={{
                background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                borderRadius: 20,
                padding: '18px 20px',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 18,
                  }}
                >
                  ✨
                </div>
                <div style={{ flex: 1 }}>
                  {weekTip.score_label && (
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#6D28D9',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        marginBottom: 4,
                      }}
                    >
                      {weekTip.score_label}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#4C1D95',
                      lineHeight: 1.55,
                    }}
                  >
                    {weekTip.tip || weekTip.samenvatting}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── RECENTE ACTIVITEIT ── */}
        <section style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--text-4)',
              marginBottom: 14,
            }}
          >
            Recente activiteit
          </p>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 20,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log, i) => (
                <div
                  key={`${log.type}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderBottom:
                      i < sortedLogs.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      {log.emoji}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>
                      {log.label}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
                      {tijdGeleden(log.tijd)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--mf-green)',
                      flexShrink: 0,
                    }}
                  >
                    {log.waarde}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
                  Nog niets gelogd vandaag. Begin met een actie hierboven!
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
