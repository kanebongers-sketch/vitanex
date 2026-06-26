'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import {
  Smile, Moon, Droplets, Dumbbell, Leaf, Heart,
  CheckCircle2, Circle, BarChart2, ChevronRight,
  Utensils, Flame,
} from 'lucide-react'

/* ── helpers ── */
function nlDatum(): string {
  return new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Geen data'
  if (score >= 80) return 'Uitstekend'
  if (score >= 60) return 'Goed'
  if (score >= 40) return 'Matig'
  return 'Rust nodig'
}

function scoreKleur(score: number | null): string {
  if (score === null) return 'var(--text-4)'
  if (score >= 80) return 'var(--mf-green)'
  if (score >= 60) return 'var(--mf-blue)'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

/* ── readiness ring ── */
function ReadinessRing({ score }: { score: number | null }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const pct = score ?? 0
  const kleur = scoreKleur(score)
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={r} fill="none" stroke={`${kleur}20`} strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r} fill="none"
        stroke={kleur} strokeWidth="10"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {score !== null ? (
        <>
          <text x="64" y="59" textAnchor="middle" fontSize="30" fontWeight="700" fill={kleur}>{score}</text>
          <text x="64" y="74" textAnchor="middle" fontSize="10" fill="var(--text-4)" fontWeight="500">/100</text>
        </>
      ) : (
        <text x="64" y="68" textAnchor="middle" fontSize="11" fill="var(--text-4)">Geen data</text>
      )}
    </svg>
  )
}

/* ── stat pill ── */
function StatPill({ label, waarde, kleur }: { label: string; waarde: string; kleur: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      padding: '10px 14px',
      background: 'var(--bg-app)',
      borderRadius: 10,
      border: '1px solid var(--border)',
      flex: 1,
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: kleur, letterSpacing: '-0.02em' }}>{waarde}</span>
    </div>
  )
}

/* ── check item ── */
const CHECKLIST_ICONEN: Record<string, React.ElementType> = {
  stemming:     Smile,
  slaap:        Moon,
  water:        Droplets,
  sport:        Dumbbell,
  meditatie:    Leaf,
  dankbaarheid: Heart,
}

interface CheckItem { key: string; label: string; href: string; gedaan: boolean }

/* ── main ── */
export default function DashboardPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [slaap, setSlaap] = useState<number | null>(null)
  const [stemming, setStemming] = useState<number | null>(null)
  const [calorieen, setCalorieen] = useState(0)
  const [eiwitten, setEiwitten] = useState(0)
  const [koolhydraten, setKoolhydraten] = useState(0)
  const [vetten, setVetten] = useState(0)
  const [sportGedaan, setSportGedaan] = useState(false)
  const [sportMinuten, setSportMinuten] = useState(0)

  const CALORIE_DOEL = 2000

  const [checklist, setChecklist] = useState<CheckItem[]>([
    { key: 'stemming',     label: 'Stemming',     href: '/stemming',     gedaan: false },
    { key: 'slaap',        label: 'Slaap',        href: '/slaap',        gedaan: false },
    { key: 'water',        label: 'Water',        href: '/water',        gedaan: false },
    { key: 'sport',        label: 'Bewegen',      href: '/sport',        gedaan: false },
    { key: 'meditatie',    label: 'Meditatie',    href: '/meditatie',    gedaan: false },
    { key: 'dankbaarheid', label: 'Dankbaarheid', href: '/dankbaarheid', gedaan: false },
  ])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam, onboarding_voltooid').eq('id', user.id).single()
      if (!profiel?.onboarding_voltooid) { router.replace('/onboarding'); return }
      setNaam(profiel?.naam ?? '')
      setLaden(false)

      const [readinessRes, vandaagRes, streakRes, voedingRes] = await Promise.allSettled([
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
          scores?: { slaap_uren?: number | null; stemming_waarde?: number | null; sport_minuten?: number | null }
        }
        const gedaanSet = new Set((d.checklist ?? []).filter(i => i.status === 'gedaan').map(i => i.id))
        setChecklist(prev => prev.map(item => ({ ...item, gedaan: gedaanSet.has(item.key) })))
        setSportGedaan(gedaanSet.has('sport'))
        if (d.scores) {
          setSlaap(d.scores.slaap_uren ?? null)
          setStemming(d.scores.stemming_waarde ?? null)
          setSportMinuten(d.scores.sport_minuten ?? 0)
        }
      }

      if (voedingRes.status === 'fulfilled' && voedingRes.value) {
        const d = voedingRes.value as { logs?: Array<{ calorieen?: number | null; eiwitten_g?: number | null }> }
        const logs = d.logs ?? []
        setCalorieen(Math.round(logs.reduce((s, l) => s + (l.calorieen ?? 0), 0)))
        setEiwitten(Math.round(logs.reduce((s, l) => s + (l.eiwitten_g ?? 0), 0)))
        setKoolhydraten(Math.round(logs.reduce((s: number, l: { koolhydraten_g?: number | null }) => s + (l.koolhydraten_g ?? 0), 0)))
        setVetten(Math.round(logs.reduce((s: number, l: { vetten_g?: number | null }) => s + (l.vetten_g ?? 0), 0)))
      }

      if (streakRes.status === 'fulfilled' && streakRes.value) {
        const d = streakRes.value as { streak?: number }
        setStreak(d.streak ?? 0)
      }
    }
    laad()
  }, [router])

  const voornaam = naam.split(' ')[0] || 'je'
  const gedaanCount = checklist.filter(i => i.gedaan).length
  const kleur = scoreKleur(readiness)

  if (laden) {
    return (
      <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
        <Navbar />
      </div>
    )
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500, marginBottom: 4, letterSpacing: '0.01em' }}>
            {nlDatum()}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
            Goedemorgen, {voornaam}
          </h1>
        </div>

        {/* Readiness card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 20px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <ReadinessRing score={readiness} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
              Readiness
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: kleur, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
              {scoreLabel(readiness)}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatPill label="Streak" waarde={`${streak}d`} kleur="var(--mf-amber)" />
              <StatPill label="Slaap" waarde={slaap !== null ? `${slaap}u` : '—'} kleur="var(--mf-purple)" />
              <StatPill label="Stemming" waarde={stemming !== null ? `${stemming}/5` : '—'} kleur="var(--mf-blue)" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/checkin"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'var(--mf-green)',
            borderRadius: 12,
            textDecoration: 'none',
            marginBottom: 24,
            boxShadow: '0 2px 12px rgba(29,158,117,0.28)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
            {readiness === null ? 'Log vandaag om je score te berekenen' : 'Start check-in'}
          </span>
          <ChevronRight size={16} strokeWidth={2} style={{ color: 'white', opacity: 0.8 }} />
        </Link>

        {/* Vandaag checklist */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 10,
        }}>
          <div style={{
            padding: '14px 16px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              Vandaag
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: gedaanCount === checklist.length ? 'var(--mf-green)' : 'var(--text-4)',
            }}>
              {gedaanCount}/{checklist.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--border)' }}>
            <div style={{
              height: '100%',
              width: `${(gedaanCount / checklist.length) * 100}%`,
              background: 'var(--mf-green)',
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>

          {checklist.map((item, i) => {
            const Icon = CHECKLIST_ICONEN[item.key] ?? Circle
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px',
                  borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(128,128,128,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                {/* Icoon embleem met transparant vinkje overlay */}
                <div style={{
                  position: 'relative', width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: item.gedaan ? 'rgba(29,158,117,0.12)' : 'rgba(128,128,128,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  <Icon size={15} strokeWidth={1.8} style={{ color: item.gedaan ? 'var(--mf-green)' : 'var(--text-3)', opacity: item.gedaan ? 0.3 : 1 }} />
                  {item.gedaan && (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 32 32" fill="none">
                      <polyline points="8,16 13,21 24,11" stroke="var(--mf-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: item.gedaan ? 'var(--text-4)' : 'var(--text-1)',
                  flex: 1,
                  textDecoration: item.gedaan ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                  letterSpacing: '-0.01em',
                }}>
                  {item.label}
                </span>
                {!item.gedaan && (
                  <ChevronRight size={13} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Voeding + Training */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

          {/* Voeding */}
          <Link href="/voeding" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                transition: 'border-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(29,158,117,0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(29,158,117,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={13} strokeWidth={1.8} style={{ color: 'var(--mf-green)' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>Voeding</span>
              </div>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: calorieen > 0 ? 'var(--text-1)' : 'var(--text-4)', letterSpacing: '-0.03em' }}>
                {calorieen > 0 ? calorieen : '—'}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--text-4)', fontWeight: 500 }}>
                {calorieen > 0 ? `van ${CALORIE_DOEL} kcal` : 'kcal vandaag'}
              </p>
              {calorieen > 0 && (
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (calorieen / CALORIE_DOEL) * 100)}%`, background: 'var(--mf-green)', borderRadius: 100 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: 'Eiwit',  waarde: eiwitten,     kleur: 'var(--mf-red)'    },
                  { label: 'Koolh.', waarde: koolhydraten, kleur: 'var(--mf-amber)'  },
                  { label: 'Vet',    waarde: vetten,       kleur: 'var(--mf-purple)' },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1, background: 'var(--bg-app)', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: m.waarde > 0 ? m.kleur : 'var(--text-4)' }}>
                      {m.waarde > 0 ? `${m.waarde}g` : '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: 9, color: 'var(--text-4)', fontWeight: 500, marginTop: 1 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>

          {/* Training */}
          <Link href="/sport" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                transition: 'border-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = sportGedaan ? 'rgba(29,158,117,0.4)' : 'rgba(128,128,128,0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: sportGedaan ? 'rgba(29,158,117,0.10)' : 'rgba(128,128,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={13} strokeWidth={1.8} style={{ color: sportGedaan ? 'var(--mf-green)' : 'var(--text-4)' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>Training</span>
              </div>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: sportGedaan ? 'var(--mf-green)' : 'var(--text-4)', letterSpacing: '-0.03em' }}>
                {sportMinuten > 0 ? `${sportMinuten}m` : sportGedaan ? '✓' : '—'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-4)', fontWeight: 500 }}>
                {sportGedaan ? 'voltooid vandaag' : 'nog niet gelogd'}
              </p>
              {sportGedaan && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={11} strokeWidth={2} style={{ color: 'var(--mf-amber)' }} />
                  <span style={{ fontSize: 10, color: 'var(--mf-amber)', fontWeight: 600 }}>Actief</span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Week snapshot */}
        <Link href="/inzichten" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(29,158,117,0.3)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(29,158,117,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart2 size={15} strokeWidth={1.8} style={{ color: 'var(--mf-green)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Week inzichten</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-4)' }}>Trends & patronen</p>
              </div>
            </div>
            <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-4)' }} />
          </div>
        </Link>

      </main>
    </div>
  )
}
