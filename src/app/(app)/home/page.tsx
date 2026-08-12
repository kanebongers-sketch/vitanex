'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Apple, Dumbbell, Moon, Footprints, Brain, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { scoreNiveau } from '@/lib/pijlers/score'
import type { PijlerOverzicht } from '@/lib/pijlers/pijlers-server'
import { RetentieBalk } from '@/components/home/RetentieBalk'
import { TrendsBlok } from '@/components/home/TrendsBlok'
import { VitaInzicht } from '@/components/home/VitaInzicht'

// De consumenten-home. Bewust gefocust op de VIJF echte pijlers (niet tien dunne
// tegels): dagscore als held, Vita's cross-pijler-inzicht als slim hart, de
// daglus (streak + check-in) als reden om terug te komen.

interface Tegel {
  label: string
  route: string
  Icon: LucideIcon
  /** Pijlersleutel voor de score, of 'mentaal' (samengesteld), of null (geen score). */
  bron: string | null
}

const TEGELS: readonly Tegel[] = [
  { label: 'Voeding', route: '/voeding', Icon: Apple, bron: 'voeding' },
  { label: 'Training', route: '/sport', Icon: Dumbbell, bron: 'beweging' },
  { label: 'Slaap', route: '/slaap', Icon: Moon, bron: 'slaap' },
  { label: 'Stappen', route: '/stappen', Icon: Footprints, bron: null },
  { label: 'Mentaal welzijn', route: '/welzijn', Icon: Brain, bron: 'mentaal' },
]

function groetVoor(uur: number): string {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

/** Mentaal welzijn = gemiddelde van de beschikbare stemming/stress-scores. */
function mentaalScore(scores: Map<string, number | null>): number | null {
  const vals = ['stemming', 'stress'].map((k) => scores.get(k) ?? null).filter((v): v is number => typeof v === 'number')
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function tegelScore(t: Tegel, scores: Map<string, number | null>): number | null {
  if (t.bron === null) return null
  if (t.bron === 'mentaal') return mentaalScore(scores)
  return scores.get(t.bron) ?? null
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

  // Dagscore = gemiddelde van álle gemeten pijlers (ontkoppeld van de tegels).
  const alleScores = [...scores.values()].filter((s): s is number => typeof s === 'number')
  const dagscore = alleScores.length > 0 ? Math.round(alleScores.reduce((a, b) => a + b, 0) / alleScores.length) : null
  const niveau = scoreNiveau(dagscore)

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 96px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-4)', margin: '0 0 2px' }}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 style={{ fontSize: 27, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 18px', letterSpacing: '-0.02em' }}>{groetVoor(new Date().getHours())}, {voornaam || '…'}</h1>

        {/* Held: dagscore */}
        <section aria-label="Dagscore" style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 22, padding: '22px 24px', marginBottom: 14 }}>
          <DagscoreRing score={dagscore} kleur={niveau.kleur} size={104} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Dagscore</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>{niveau.label}</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 0' }}>
              {laden ? 'laden…' : dagscore !== null ? `${alleScores.length} van ${scores.size} pijlers gemeten vandaag` : 'Log iets om je dag in beeld te brengen'}
            </p>
          </div>
        </section>

        {/* Dagelijkse lus: streak + check-in */}
        <RetentieBalk />

        {/* Vita's cross-pijler-inzicht (alleen bij een echt signaal) */}
        <VitaInzicht />

        {/* Vraag Vita */}
        <Link href="/coach" aria-label="Open Vita, je coach"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--brand-soft, var(--mentaforce-primary-light))', border: '1px solid var(--brand, var(--mentaforce-primary))', borderRadius: 16, padding: '14px 16px', marginBottom: 24 }}>
          <span style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--brand, var(--mentaforce-primary))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Sparkles size={20} style={{ color: 'var(--bg-app)' }} aria-hidden />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--brand, var(--mentaforce-primary))' }}>Vraag Vita</span>
            <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)' }}>Je persoonlijke coach — vraag wat je maar wilt</span>
          </span>
          <ChevronRight size={18} aria-hidden style={{ color: 'var(--brand, var(--mentaforce-primary))', flexShrink: 0 }} />
        </Link>

        {/* De vijf pijlers */}
        <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Jouw pijlers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {TEGELS.map((t) => {
            const score = tegelScore(t, scores)
            const tnv = scoreNiveau(score)
            const heeftScore = t.bron !== null
            return (
              <Link key={t.route} href={t.route} aria-label={t.label}
                style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 116 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ width: 42, height: 42, borderRadius: 13, background: heeftScore && score !== null ? tnv.zacht : 'var(--bg-subtle)', display: 'grid', placeItems: 'center' }}>
                    <t.Icon size={21} aria-hidden style={{ color: heeftScore && score !== null ? tnv.kleur : 'var(--text-3)' }} />
                  </span>
                  <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)' }} />
                </span>
                <span style={{ marginTop: 'auto' }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>{t.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: score !== null ? tnv.kleur : 'var(--text-4)', fontWeight: 600, marginTop: 1 }}>
                    {score !== null ? `${score} · ${tnv.label}` : heeftScore ? 'Nog niet gemeten' : 'Openen'}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        {/* Zichtbare vooruitgang: trends */}
        <div style={{ marginTop: 24 }}>
          <TrendsBlok />
        </div>
      </main>
    </div>
  )
}

function DagscoreRing({ score, kleur, size = 84 }: { score: number | null; kleur: string; size?: number }) {
  const c = size / 2
  const r = c - 8
  const circ = 2 * Math.PI * r
  const pct = score !== null ? Math.min(1, Math.max(0, score / 100)) : 0
  const font = Math.round(size * 0.26)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={score !== null ? `Dagscore ${score} van 100` : 'Dagscore nog niet gemeten'} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="9" />
      <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: kleur, transition: 'stroke-dasharray 0.8s var(--ease, ease)' }} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + font / 3} textAnchor="middle" fontSize={font} fontWeight="900" style={{ fill: 'var(--text-1)' }}>{score !== null ? score : '–'}</text>
    </svg>
  )
}
