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

const CALORIE_DOEL = 2000
const WATER_DOEL_ML = 2000

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

// ── Mini calorie ring ─────────────────────────────────────────

function CalorieRingMini({ kcal, doel }: { kcal: number; doel: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, doel > 0 ? kcal / doel : 0)
  const kleur = kcal > doel * 1.1 ? '#E24B4A' : '#1D9E75'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`${kcal} van ${doel} kcal`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke={`${kleur}20`} strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="7"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="36" y="32" textAnchor="middle" fontSize="12" fontWeight="900" fill={kleur}>{kcal}</text>
      <text x="36" y="45" textAnchor="middle" fontSize="8" fill="#9CA3AF">kcal</text>
    </svg>
  )
}

// ── Mini progress bar ─────────────────────────────────────────

function ProgressBar({ waarde, max, kleur }: { waarde: number; max: number; kleur: string }) {
  const pct = Math.min(100, max > 0 ? (waarde / max) * 100 : 0)
  return (
    <div style={{ height: 5, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: kleur,
          borderRadius: 100,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  )
}

// ── Interfaces ────────────────────────────────────────────────

interface VandaagItem {
  key: string
  label: string
  emoji: string
  href: string
  gedaan: boolean
}

interface ScoresData {
  water_ml: number
  water_doel_ml: number
  slaap_uren: number | null
  stemming_waarde: number | null
  focus_minuten: number
  meditatie_minuten: number
}

interface VoedingLog {
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
}

// ── Component ─────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [scores, setScores] = useState<ScoresData>({
    water_ml: 0,
    water_doel_ml: WATER_DOEL_ML,
    slaap_uren: null,
    stemming_waarde: null,
    focus_minuten: 0,
    meditatie_minuten: 0,
  })
  const [voedingTotaal, setVoedingTotaal] = useState({
    calorieen: 0,
    eiwitten_g: 0,
    koolhydraten_g: 0,
    vetten_g: 0,
  })
  const [vandaagItems, setVandaagItems] = useState<VandaagItem[]>([
    { key: 'stemming',     label: 'Stemming',    emoji: '😊', href: '/stemming',     gedaan: false },
    { key: 'slaap',        label: 'Slaap',       emoji: '😴', href: '/slaap',        gedaan: false },
    { key: 'water',        label: 'Water',        emoji: '💧', href: '/water',        gedaan: false },
    { key: 'sport',        label: 'Bewegen',      emoji: '🏃', href: '/sport',        gedaan: false },
    { key: 'meditatie',    label: 'Meditatie',    emoji: '🧘', href: '/meditatie',    gedaan: false },
    { key: 'dankbaarheid', label: 'Dankbaarheid', emoji: '🙏', href: '/dankbaarheid', gedaan: false },
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

      const [readinessRes, vandaagRes, gewoontesRes, voedingRes] = await Promise.allSettled([
        authFetch('/api/readiness').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/vandaag').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/streak').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/voeding').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      if (readinessRes.status === 'fulfilled' && readinessRes.value) {
        const d = readinessRes.value as { score?: number; readiness?: number }
        const s = d.score ?? d.readiness ?? null
        if (typeof s === 'number') setReadiness(Math.round(s))
      }

      if (vandaagRes.status === 'fulfilled' && vandaagRes.value) {
        const d = vandaagRes.value as {
          checklist?: Array<{ id: string; status: string }>
          scores?: ScoresData
        }
        const gedaanSet = new Set(
          (d.checklist ?? []).filter(i => i.status === 'gedaan').map(i => i.id)
        )
        setVandaagItems(prev => prev.map(item => ({ ...item, gedaan: gedaanSet.has(item.key) })))
        if (d.scores) setScores(d.scores)
      }

      if (gewoontesRes.status === 'fulfilled' && gewoontesRes.value) {
        const d = gewoontesRes.value as { streak?: number }
        setStreak(d.streak ?? 0)
      }

      if (voedingRes.status === 'fulfilled' && voedingRes.value) {
        const d = voedingRes.value as { logs?: VoedingLog[] }
        const logs = d.logs ?? []
        setVoedingTotaal({
          calorieen: Math.round(logs.reduce((s, l) => s + (l.calorieen ?? 0), 0)),
          eiwitten_g: Math.round(logs.reduce((s, l) => s + (l.eiwitten_g ?? 0), 0)),
          koolhydraten_g: Math.round(logs.reduce((s, l) => s + (l.koolhydraten_g ?? 0), 0)),
          vetten_g: Math.round(logs.reduce((s, l) => s + (l.vetten_g ?? 0), 0)),
        })
      }
    }

    laad()
  }, [router])

  const kleur = scoreKleur(readiness)
  const label = scoreLabel(readiness)
  const gradient = scoreGradient(readiness)
  const gedaanCount = vandaagItems.filter(i => i.gedaan).length
  const sportGedaan = vandaagItems.find(i => i.key === 'sport')?.gedaan ?? false

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
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, fontWeight: 400, color: 'var(--mf-green)' }}>
          MentaForce
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>{nlDatumKort()}</span>
        <div
          aria-label="Profielmenu"
          style={{ width: 34, height: 34, borderRadius: '50%', background: kleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => router.push('/instellingen')}
        >
          {initialen(naam) || '?'}
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '72px 16px 120px' }}>

        {/* ── SECTION 1 — READINESS HERO ── */}
        <section
          className="mf-grain"
          style={{
            borderRadius: 28,
            background: gradient,
            border: `1.5px solid ${kleur}22`,
            boxShadow: `0 8px 40px ${kleur}15, 0 2px 8px ${kleur}08`,
            marginBottom: 12,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ height: 5, background: `linear-gradient(90deg, ${kleur}, ${kleur}50)`, width: '100%' }} />
          <div
            style={{
              padding: '24px 24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: kleur, opacity: 0.85, marginBottom: 16 }}>
              READINESS VANDAAG
            </p>
            <div className="mf-animate-breathe mf-animate-glow" style={{ display: 'inline-block' }}>
              <ReadinessRing score={readiness} />
            </div>
            <p className="mf-display" style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: kleur, marginTop: 10, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              {label}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/slaap" className="mf-pill"><span>😴</span> Slaap</Link>
              <Link href="/stemming" className="mf-pill"><span>😊</span> Stemming</Link>
              <Link href="/checkin" className="mf-pill"><span>⚡</span> Stress</Link>
            </div>
            <Link
              href="/checkin"
              style={{ marginTop: 20, width: '100%', background: kleur, color: 'white', borderRadius: 14, padding: '13px 24px', fontSize: 14, fontWeight: 700, textAlign: 'center', boxShadow: `0 4px 20px ${kleur}35`, letterSpacing: '-0.01em', display: 'block', textDecoration: 'none' }}
            >
              {readiness === null ? 'Log vandaag om je score te berekenen' : 'Start je dag →'}
            </Link>
          </div>
        </section>

        {/* ── SECTION 2 — BENTO: MENTAAL + FYSIEK ── */}
        <div
          className="mf-animate-slide-up"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
        >
          {/* Mentaal */}
          <Link href="/stemming" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 14px 12px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🧠 Mentaal</span>
                <span style={{ fontSize: 13, color: 'var(--text-4)' }}>›</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Stemming</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#185FA5' }}>
                      {scores.stemming_waarde != null ? `${scores.stemming_waarde}/10` : '—'}
                    </span>
                  </div>
                  <ProgressBar waarde={scores.stemming_waarde ?? 0} max={10} kleur="#185FA5" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Meditatie</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#8B5CF6' }}>
                      {scores.meditatie_minuten > 0 ? `${scores.meditatie_minuten}m` : '—'}
                    </span>
                  </div>
                  <ProgressBar waarde={scores.meditatie_minuten} max={20} kleur="#8B5CF6" />
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--mf-green)', fontWeight: 700 }}>Details →</span>
            </div>
          </Link>

          {/* Fysiek */}
          <Link href="/slaap" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 14px 12px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>💪 Fysiek</span>
                <span style={{ fontSize: 13, color: 'var(--text-4)' }}>›</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>💧 Water</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0EA5E9' }}>
                      {scores.water_ml > 0 ? `${Math.round(scores.water_ml / 250)} gl` : '—'}
                    </span>
                  </div>
                  <ProgressBar waarde={scores.water_ml} max={scores.water_doel_ml || WATER_DOEL_ML} kleur="#0EA5E9" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>😴 Slaap</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#8B5CF6' }}>
                      {scores.slaap_uren != null ? `${scores.slaap_uren}u` : '—'}
                    </span>
                  </div>
                  <ProgressBar waarde={scores.slaap_uren ?? 0} max={9} kleur="#8B5CF6" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>🏃 Sport</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: sportGedaan ? '#D1FAE5' : '#F3F4F6',
                    color: sportGedaan ? '#059669' : '#9CA3AF',
                  }}>
                    {sportGedaan ? 'Gedaan ✓' : 'Open'}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--mf-green)', fontWeight: 700 }}>Details →</span>
            </div>
          </Link>
        </div>

        {/* ── SECTION 3 — VOEDING ── */}
        <Link href="/voeding" style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
          <div
            className="mf-animate-slide-up mf-stagger-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🍎 Voeding</span>
              <span style={{ fontSize: 11, color: 'var(--mf-green)', fontWeight: 700 }}>Loggen →</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CalorieRingMini kcal={voedingTotaal.calorieen} doel={CALORIE_DOEL} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Eiwit',   waarde: voedingTotaal.eiwitten_g,     max: 56,  kleur: '#E24B4A' },
                  { label: 'Koolh.',  waarde: voedingTotaal.koolhydraten_g, max: 275, kleur: '#F59E0B' },
                  { label: 'Vet',     waarde: voedingTotaal.vetten_g,       max: 78,  kleur: '#8B5CF6' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: m.kleur }}>
                        {m.waarde > 0 ? `${m.waarde}g` : '—'}
                      </span>
                    </div>
                    <ProgressBar waarde={m.waarde} max={m.max} kleur={m.kleur} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* ── SECTION 4 — STREAK + PATRONEN ── */}
        <div
          className="mf-animate-slide-up mf-stagger-1"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}
        >
          <div style={{
            borderRadius: 18,
            background: streak >= 30
              ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
              : streak > 0
              ? 'linear-gradient(135deg, #FFF7ED, #FFEDD5)'
              : 'var(--bg-card)',
            border: streak > 0 ? '1.5px solid rgba(186,117,23,0.22)' : '1px solid var(--border)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: streak > 0 ? 'var(--shadow-amber-glow)' : 'var(--shadow-xs)',
          }}>
            <span className={streak > 0 ? 'mf-animate-flame' : ''} style={{ fontSize: 28 }}>
              {streak >= 30 ? '🏆' : streak > 0 ? '🔥' : '💪'}
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: streak > 0 ? '#92400E' : 'var(--text-1)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                {streak}
              </div>
              <div style={{ fontSize: 10, color: streak > 0 ? '#B45309' : 'var(--text-4)', fontWeight: 600 }}>
                {streak === 1 ? 'dag op rij' : streak > 1 ? 'dagen op rij' : 'start vandaag'}
              </div>
            </div>
          </div>

          <Link href="/patronen" style={{ textDecoration: 'none' }}>
            <div style={{ borderRadius: 18, background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #A7F3D0', padding: '14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <span style={{ fontSize: 22, marginBottom: 6 }}>🔬</span>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-green-dark)', lineHeight: 1.3 }}>Jouw patronen</div>
              <div style={{ fontSize: 10, color: '#15785A', marginTop: 3 }}>Bekijk trends →</div>
            </div>
          </Link>
        </div>

        {/* ── SECTION 5 — VANDAAG CHECKLIST ── */}
        <section
          className="mf-animate-slide-up mf-stagger-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Vandaag</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: gedaanCount === vandaagItems.length ? 'var(--mf-green)' : 'var(--text-4)' }}>
              {gedaanCount}/{vandaagItems.length}
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 100, background: 'var(--bg-subtle)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(gedaanCount / vandaagItems.length) * 100}%`, background: 'linear-gradient(90deg, var(--mf-green), var(--mf-green-mid))', borderRadius: 100, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
          {vandaagItems.map(item => (
            <Link key={item.key} href={item.href} className={`mf-check-row${item.gedaan ? ' done' : ''}`}>
              <span className="mf-check-bubble">
                {item.gedaan ? <span style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>✓</span> : null}
              </span>
              <span style={{ fontSize: 14, fontWeight: item.gedaan ? 600 : 500, color: item.gedaan ? 'var(--mf-green)' : 'var(--text-2)', flex: 1, textDecoration: item.gedaan ? 'line-through' : 'none', textDecorationColor: 'rgba(29,158,117,0.4)' }}>
                {item.emoji} {item.label}
              </span>
              {!item.gedaan && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>›</span>}
            </Link>
          ))}
        </section>

        {/* ── SECTION 6 — SNEL LOGGEN ── */}
        <section className="mf-animate-slide-up mf-stagger-3">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-4)', marginBottom: 12 }}>
            Snel loggen
          </p>
          <div className="mf-scroll-row">
            {snelLog.map(actie => (
              <Link key={actie.href} href={actie.href} className="mf-scroll-item" style={{ textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 18px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-xs)', minWidth: 80, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
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
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--mf-green-light), rgba(29,158,117,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, lineHeight: 1 }}>
                    {actie.emoji}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
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
