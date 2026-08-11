'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Apple, Dumbbell, Moon, Activity, Smile, Brain, Wind, Footprints, ClipboardCheck, BookOpen, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { scoreNiveau } from '@/lib/pijlers/score'
import type { PijlerOverzicht } from '@/lib/pijlers/pijlers-server'
import { RetentieBalk } from '@/components/home/RetentieBalk'
import { TrendsBlok } from '@/components/home/TrendsBlok'

// De consumenten-home: een tegel-grid (Apple-Health-stijl) met de dagscore en een
// Vita-knop bovenaan. De founder-cockpit (werk-OS) is verhuisd naar /kanebongers.

interface Tegel {
  label: string
  route: string
  Icon: LucideIcon
  pijler: string | null // koppelt aan een pijler-score als die bestaat
}

const TEGELS: readonly Tegel[] = [
  { label: 'Voeding', route: '/voeding', Icon: Apple, pijler: 'voeding' },
  { label: 'Training', route: '/sport', Icon: Dumbbell, pijler: 'beweging' },
  { label: 'Slaap', route: '/slaap', Icon: Moon, pijler: 'slaap' },
  { label: 'Stress', route: '/stress', Icon: Activity, pijler: 'stress' },
  { label: 'Stemming', route: '/stemming', Icon: Smile, pijler: 'stemming' },
  { label: 'Meditatie', route: '/meditatie', Icon: Brain, pijler: null },
  { label: 'Ademhaling', route: '/ademhaling', Icon: Wind, pijler: null },
  { label: 'Stappen', route: '/stappen', Icon: Footprints, pijler: null },
  { label: 'Check-in', route: '/checkin', Icon: ClipboardCheck, pijler: null },
  { label: 'Dagboek', route: '/journal', Icon: BookOpen, pijler: null },
]

function groetVoor(uur: number): string {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

export default function HomePage() {
  const router = useRouter()
  const [voornaam, setVoornaam] = useState('')
  const [scores, setScores] = useState<Map<string, number | null>>(new Map())
  const [laden, setLaden] = useState(true)

  const laad = useCallback((): Promise<void> => {
    return supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      return supabase.from('profiles').select('naam, onboarding_voltooid').eq('id', data.user.id).single()
        .then(({ data: profiel }) => {
          if (!profiel?.onboarding_voltooid) { router.replace('/onboarding'); return }
          setVoornaam((profiel?.naam ?? '').split(' ')[0] || 'jij')
          return authFetch('/api/pijlers')
            .then((res) => (res.ok ? res.json() as Promise<PijlerOverzicht> : null))
            .then((ov) => { if (ov) setScores(new Map(ov.pijlers.map((p) => [p.key, p.score]))) })
            .catch(() => { /* dagscore valt netjes terug op "nog niet gemeten" */ })
            .finally(() => setLaden(false))
        })
    }).catch(() => setLaden(false))
  }, [router])

  useEffect(() => { void laad() }, [laad])

  const metScore = TEGELS.map((t) => (t.pijler ? scores.get(t.pijler) ?? null : null)).filter((s): s is number => typeof s === 'number')
  const dagscore = metScore.length > 0 ? Math.round(metScore.reduce((a, b) => a + b, 0) / metScore.length) : null
  const niveau = scoreNiveau(dagscore)

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 96px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-4)', margin: '0 0 2px' }}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 18px', letterSpacing: '-0.02em' }}>{groetVoor(new Date().getHours())}, {voornaam || '…'}</h1>

        {/* Dagelijkse lus: streak + check-in — de reden om terug te komen */}
        <RetentieBalk />

        {/* Dagscore + Vita */}
        <section aria-label="Vandaag" style={{ display: 'flex', gap: 14, alignItems: 'stretch', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
            <DagscoreRing score={dagscore} kleur={niveau.kleur} />
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>Dagscore</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', margin: '2px 0 0' }}>{niveau.label}</p>
              {laden && <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0' }}>laden…</p>}
            </div>
          </div>
          <Link href="/coach" aria-label="Open Vita, je coach"
            style={{ flex: '1 1 160px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--brand-soft, var(--mentaforce-primary-light))', border: '1px solid var(--brand, var(--mentaforce-primary))', borderRadius: 18, padding: 18 }}>
            <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--brand, var(--mentaforce-primary))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Sparkles size={22} style={{ color: 'var(--bg-app)' }} aria-hidden />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--brand, var(--mentaforce-primary))' }}>Vraag Vita</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>Je persoonlijke coach</span>
            </span>
          </Link>
        </section>

        {/* Categorie-tegels */}
        <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Jouw gezondheid</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {TEGELS.map((t) => {
            const score = t.pijler ? scores.get(t.pijler) ?? null : null
            const tnv = scoreNiveau(score)
            return (
              <Link key={t.route} href={t.route} aria-label={t.label}
                style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 104 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: t.pijler && score !== null ? tnv.zacht : 'var(--bg-subtle)', display: 'grid', placeItems: 'center' }}>
                    <t.Icon size={20} aria-hidden style={{ color: t.pijler && score !== null ? tnv.kleur : 'var(--text-3)' }} />
                  </span>
                  <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)' }} />
                </span>
                <span style={{ marginTop: 'auto' }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>{t.label}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: score !== null ? tnv.kleur : 'var(--text-4)', fontWeight: 600 }}>
                    {score !== null ? `${score} · ${tnv.label}` : 'Openen'}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        {/* Zichtbare vooruitgang: een echte trend-grafiek (nu slaap) */}
        <div style={{ marginTop: 24 }}>
          <TrendsBlok />
        </div>
      </main>
    </div>
  )
}

function DagscoreRing({ score, kleur }: { score: number | null; kleur: string }) {
  const r = 34, circ = 2 * Math.PI * r
  const pct = score !== null ? Math.min(1, Math.max(0, score / 100)) : 0
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={score !== null ? `Dagscore ${score} van 100` : 'Dagscore nog niet gemeten'} style={{ flexShrink: 0 }}>
      <circle cx="42" cy="42" r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" style={{ stroke: kleur, transition: 'stroke-dasharray 0.8s var(--ease, ease)' }} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fontSize="20" fontWeight="900" style={{ fill: 'var(--text-1)' }}>{score !== null ? score : '–'}</text>
    </svg>
  )
}
