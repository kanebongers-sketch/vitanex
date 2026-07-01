'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef, type ElementType, type FocusEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/ui/Ring'
import { CoachNudgeBanner } from '@/components/coach/CoachNudgeBanner'
import VitaDagstart from '@/components/vita/VitaDagstart'
import type { LucideIcon } from 'lucide-react'
import {
  Smile, Moon, Droplets, Dumbbell, Leaf, Heart,
  Circle, BarChart2, ChevronRight, Check,
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

/* Her-fetch op tab-focus enkel als de data ouder is dan deze TTL (perf). */
const REFETCH_TTL_MS = 2_000

/* ── readiness ring ── */
function ReadinessRing({ score }: { score: number | null }) {
  const kleur = scoreKleur(score)
  const label = score !== null
    ? `Readiness ${score} van 100 — ${scoreLabel(score)}`
    : 'Readiness: geen data'
  return (
    <Ring value={score ?? 0} ariaLabel={label} size={128} thickness={10} color={kleur}>
      {score !== null ? (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: kleur }}>{score}</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>/100</span>
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Geen data</span>
      )}
    </Ring>
  )
}

/* ── stat pill ── */
function StatPill({ label, waarde, kleur }: { label: string; waarde: string; kleur: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      padding: '10px 14px',
      background: 'var(--bg-subtle)',
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
const CHECKLIST_ICONEN: Record<string, LucideIcon> = {
  stemming:     Smile,
  slaap:        Moon,
  water:        Droplets,
  sport:        Dumbbell,
  meditatie:    Leaf,
  dankbaarheid: Heart,
}

interface CheckItem { key: string; label: string; href: string; gedaan: boolean }

/* Hover + focus geven dezelfde, ontworpen randkleur — ook per toetsenbord. */
function setBorder(target: EventTarget & HTMLElement, kleur: string) {
  target.style.borderColor = kleur
}

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

  /* Tijdstip van de laatste succesvolle data-load — voor de TTL-debounce. */
  const laatsteLoad = useRef(0)

  const [checklist, setChecklist] = useState<CheckItem[]>([
    { key: 'stemming',     label: 'Stemming',     href: '/stemming',     gedaan: false },
    { key: 'slaap',        label: 'Slaap',        href: '/slaap',        gedaan: false },
    { key: 'water',        label: 'Water',        href: '/water',        gedaan: false },
    { key: 'sport',        label: 'Bewegen',      href: '/sport',        gedaan: false },
    { key: 'meditatie',    label: 'Meditatie',    href: '/meditatie',    gedaan: false },
    { key: 'dankbaarheid', label: 'Dankbaarheid', href: '/dankbaarheid', gedaan: false },
  ])

  const laad = useCallback(async () => {
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
      type VLog = { calorieen?: number | null; eiwitten_g?: number | null; koolhydraten_g?: number | null; vetten_g?: number | null }
      const d = voedingRes.value as { logs?: VLog[] }
      const logs = d.logs ?? []
      setCalorieen(Math.round(logs.reduce((s, l) => s + (l.calorieen ?? 0), 0)))
      setEiwitten(Math.round(logs.reduce((s, l) => s + (l.eiwitten_g ?? 0), 0)))
      setKoolhydraten(Math.round(logs.reduce((s, l) => s + (l.koolhydraten_g ?? 0), 0)))
      setVetten(Math.round(logs.reduce((s, l) => s + (l.vetten_g ?? 0), 0)))
    }

    if (streakRes.status === 'fulfilled' && streakRes.value) {
      const d = streakRes.value as { streak?: number }
      setStreak(d.streak ?? 0)
    }

    laatsteLoad.current = Date.now()
  }, [router])

  useEffect(() => {
    laad()
    const handleVisibility = () => {
      // Alleen her-fetchen bij terugkeer als de data ouder is dan de TTL.
      if (document.visibilityState === 'visible' && Date.now() - laatsteLoad.current > REFETCH_TTL_MS) {
        laad()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [laad])

  const voornaam = naam.split(' ')[0] || 'je'
  const gedaanCount = checklist.filter(i => i.gedaan).length
  const alGedaan = gedaanCount === checklist.length
  const kleur = scoreKleur(readiness)

  /* Het dagafsluit-ritueel (dankbaarheid/reflectie) — echte data uit de checklist,
     niet verzonnen. Vita gebruikt dit om 's avonds gepast uit te nodigen. */
  const reflectieGedaan = checklist.find(i => i.key === 'dankbaarheid')?.gedaan ?? false

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
      <main className="mf-dash">

        {/* Datum */}
        <p style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {nlDatum()}
        </p>

        {/* Vita's tijdsbewuste dagstart/dagafsluiting — draagt de begroeting */}
        <VitaDagstart
          voornaam={voornaam}
          readiness={readiness}
          gedaanCount={gedaanCount}
          totaal={checklist.length}
          streak={streak}
          reflectieGedaan={reflectieGedaan}
        />

        {/* Proactieve coach-nudge */}
        <CoachNudgeBanner />

        <div className="mf-dash-grid">
          <div>

        {/* Readiness card */}
        <Card style={{
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
        </Card>

        {/* CTA */}
        <Link
          href="/checkin"
          className="mf-pressable mf-cta"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'var(--mentaforce-primary)',
            borderRadius: 'var(--radius-btn)',
            textDecoration: 'none',
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--bg-app)', letterSpacing: '-0.01em' }}>
            {readiness === null ? 'Log vandaag om je score te berekenen' : 'Start check-in'}
          </span>
          <ChevronRight size={16} strokeWidth={2} aria-hidden style={{ color: 'var(--bg-app)', opacity: 0.8 }} />
        </Link>

        {/* Vandaag checklist */}
        <Card style={{ overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            padding: '14px 16px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              Vandaag
            </span>
            {alGedaan ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--mf-green)' }}>
                <Check size={13} strokeWidth={2.6} aria-hidden /> Klaar
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>
                {gedaanCount}/{checklist.length}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-label="Voltooide taken vandaag"
            aria-valuenow={gedaanCount}
            aria-valuemin={0}
            aria-valuemax={checklist.length}
            aria-valuetext={`${gedaanCount} van ${checklist.length} voltooid`}
            style={{ height: 2, background: 'var(--border)' }}
          >
            <div
              className="mf-checklist-fill"
              style={{
                height: '100%',
                width: '100%',
                transformOrigin: 'left center',
                transform: `scaleX(${gedaanCount / checklist.length})`,
                background: 'var(--mentaforce-primary)',
              }}
            />
          </div>

          {checklist.map((item, i) => {
            const Icon = CHECKLIST_ICONEN[item.key] ?? Circle
            return (
              <Link
                key={item.key}
                href={item.href}
                className="mf-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px',
                  borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                }}
              >
                {/* Icoon embleem met transparant vinkje overlay */}
                <div style={{
                  position: 'relative', width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: item.gedaan ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} strokeWidth={1.8} aria-hidden style={{ color: item.gedaan ? 'var(--mentaforce-primary)' : 'var(--text-3)', opacity: item.gedaan ? 0.3 : 1 }} />
                  {item.gedaan && (
                    <Check
                      size={18}
                      strokeWidth={2.4}
                      role="img"
                      aria-label="Voltooid"
                      style={{ position: 'absolute', color: 'var(--mentaforce-primary)' }}
                    />
                  )}
                </div>

                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: item.gedaan ? 'var(--text-3)' : 'var(--text-1)',
                  flex: 1,
                  textDecoration: item.gedaan ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                  letterSpacing: '-0.01em',
                }}>
                  {item.label}
                </span>
                {!item.gedaan && (
                  <ChevronRight size={13} strokeWidth={2} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                )}
              </Link>
            )
          })}
        </Card>

          </div>
          <div>

        {/* Voeding + Training */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

          {/* Voeding */}
          <Link href="/voeding" style={{ textDecoration: 'none' }}>
            <Card
              interactive
              style={{ padding: '14px 16px', transition: 'border-color 0.12s var(--ease)' }}
              onMouseEnter={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--mentaforce-primary)')}
              onMouseLeave={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
              onFocus={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--mentaforce-primary)')}
              onBlur={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={13} strokeWidth={1.8} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
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
                  <div style={{ height: '100%', width: `${Math.min(100, (calorieen / CALORIE_DOEL) * 100)}%`, background: 'var(--mentaforce-primary)', borderRadius: 100 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: 'Eiwit',  waarde: eiwitten,     kleur: 'var(--mf-red)'    },
                  { label: 'Koolh.', waarde: koolhydraten, kleur: 'var(--mf-amber)'  },
                  { label: 'Vet',    waarde: vetten,       kleur: 'var(--mf-purple)' },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: m.waarde > 0 ? m.kleur : 'var(--text-4)' }}>
                      {m.waarde > 0 ? `${m.waarde}g` : '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: 9, color: 'var(--text-4)', fontWeight: 500, marginTop: 1 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Link>

          {/* Training */}
          <Link href="/sport" style={{ textDecoration: 'none' }}>
            <Card
              interactive
              style={{ padding: '14px 16px', transition: 'border-color 0.12s var(--ease)' }}
              onMouseEnter={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, sportGedaan ? 'var(--mentaforce-primary)' : 'var(--border-strong)')}
              onMouseLeave={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
              onFocus={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, sportGedaan ? 'var(--mentaforce-primary)' : 'var(--border-strong)')}
              onBlur={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: sportGedaan ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={13} strokeWidth={1.8} aria-hidden style={{ color: sportGedaan ? 'var(--mentaforce-primary)' : 'var(--text-4)' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>Training</span>
              </div>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: sportGedaan ? 'var(--mentaforce-primary)' : 'var(--text-4)', letterSpacing: '-0.03em' }}>
                {sportMinuten > 0
                  ? `${sportMinuten}m`
                  : sportGedaan
                    ? <Check size={22} strokeWidth={2.6} role="img" aria-label="Voltooid" />
                    : '—'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-4)', fontWeight: 500 }}>
                {sportGedaan ? 'voltooid vandaag' : 'nog niet gelogd'}
              </p>
              {sportGedaan && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={11} strokeWidth={2} aria-hidden style={{ color: 'var(--mf-amber)' }} />
                  <span style={{ fontSize: 10, color: 'var(--mf-amber)', fontWeight: 600 }}>Actief</span>
                </div>
              )}
            </Card>
          </Link>
        </div>

        {/* Week snapshot */}
        <Link href="/inzichten" style={{ textDecoration: 'none' }}>
          <Card
            interactive
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              transition: 'border-color 0.12s var(--ease)',
            }}
            onMouseEnter={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--mentaforce-primary)')}
            onMouseLeave={(e: MouseEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
            onFocus={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--mentaforce-primary)')}
            onBlur={(e: FocusEvent<HTMLDivElement>) => setBorder(e.currentTarget, 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--mentaforce-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart2 size={15} strokeWidth={1.8} aria-hidden style={{ color: 'var(--mentaforce-primary)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Week inzichten</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>Trends &amp; patronen</p>
              </div>
            </div>
            <ChevronRight size={14} strokeWidth={2} aria-hidden style={{ color: 'var(--text-4)' }} />
          </Card>
        </Link>

          </div>
        </div>

      </main>

      <style>{`
        .mf-dash { max-width: 600px; margin: 0 auto; padding: 40px 20px 100px; }
        @media (min-width: 1024px) {
          .mf-dash { max-width: 960px; padding-top: 48px; }
          .mf-dash-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 16px; align-items: start; }
        }
        .mf-row { transition: background 0.12s var(--ease); }
        .mf-row:hover, .mf-row:focus-visible { background: var(--bg-subtle); }
        .mf-checklist-fill { transition: transform 0.5s var(--ease); transform-origin: left center; }
        @media (prefers-reduced-motion: reduce) {
          .mf-row { transition: none; }
          .mf-checklist-fill { transition: none; }
        }
      `}</style>
    </div>
  )
}
