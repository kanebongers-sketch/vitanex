'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Apple, Moon, Footprints, Zap, Activity, Smile, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { scoreNiveau, naarCijfer } from '@/lib/pijlers/score'
import { PIJLERS, type PijlerKey } from '@/lib/pijlers/pijlers'
import type { PijlerOverzicht } from '@/lib/pijlers/pijlers-server'
import type { CSSProperties } from 'react'
import { RetentieBalk } from '@/components/home/RetentieBalk'
import { TrendsBlok } from '@/components/home/TrendsBlok'
import { useVitaInzicht } from '@/components/home/VitaInzicht'

// ── Eén card-taal voor de hele home ─────────────────────────────────────────
// De home voelde "chaotisch" doordat elk blok zijn eigen radius, rand en accent
// had. Deze constanten zijn de enige bron: zelfde radius, rand en sectie-kop
// overal. Rust ontstaat door herhaling, niet door variatie.
const CARD: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 18,
}
const SECTIE_KOP: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: 'var(--text-4)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 10px',
}

// De consumenten-home. Bewust gefocust op de VIJF echte pijlers (niet tien dunne
// tegels): dagscore als held, Vita's cross-pijler-inzicht als slim hart, de
// daglus (streak + check-in) als reden om terug te komen.

// De vijf tegels zijn vervangen door de zes canonieke pijlers: elk met een eigen
// kleur, elk met zijn rapportcijfer. Zo telt álles zichtbaar mee — óók je stappen
// (via Beweging) — en heeft elke pijler zijn eigen herkenbare identiteit.
const PIJLER_ICON: Record<string, LucideIcon> = {
  Zap, Moon, Activity, Smile, Footprints, Apple,
}

/** Waar een pijler-tegel heen linkt: naar de log-pagina waar die bestaat. */
const PIJLER_ROUTE: Record<PijlerKey, string> = {
  energie: '/pijler/energie',
  slaap: '/slaap',
  stress: '/stress',
  stemming: '/stemming',
  beweging: '/stappen',
  voeding: '/voeding',
}

function groetVoor(uur: number): string {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

/** Rapportcijfer als NL-tekst: "7,4", "10", of "–" bij geen data. */
function cijferTekst(score: number | null): string {
  const c = naarCijfer(score)
  if (c === null) return '–'
  return c.toLocaleString('nl-NL', { minimumFractionDigits: c === 10 ? 0 : 1, maximumFractionDigits: 1 })
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
      <main style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 96px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Kop */}
        <header>
          <p style={{ fontSize: 13, color: 'var(--text-4)', margin: '0 0 2px' }}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>{groetVoor(new Date().getHours())}, {voornaam || '…'}</h1>
        </header>

        {/* Anker: dagscore + de daglus (streak + check-in) in één kaart */}
        <section aria-label="Vandaag" style={{ ...CARD }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 22px' }}>
            <DagscoreRing score={dagscore} kleur={niveau.kleur} size={100} />
            <div style={{ minWidth: 0 }}>
              <p style={{ ...SECTIE_KOP, margin: 0 }}>Dagscore</p>
              <p style={{ fontSize: 21, fontWeight: 900, color: 'var(--text-1)', margin: '4px 0 0', letterSpacing: '-0.01em' }}>{niveau.label}</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 0', lineHeight: 1.4 }}>
                {laden ? 'laden…' : dagscore !== null ? `${alleScores.length} van ${scores.size} pijlers gemeten vandaag` : 'Log iets om je dag in beeld te brengen'}
              </p>
            </div>
          </div>
          <RetentieBalk />
        </section>

        {/* De zes pijlers — elk zijn eigen kleur, rapportcijfer en voortgang */}
        <section aria-label="Jouw pijlers">
          <h2 style={SECTIE_KOP}>Jouw pijlers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 12 }}>
            {PIJLERS.map((p) => {
              const score = scores.get(p.key) ?? null
              const tnv = scoreNiveau(score)
              const Icon = PIJLER_ICON[p.icoon] ?? Sparkles
              const gemeten = score !== null
              return (
                <Link key={p.key} href={PIJLER_ROUTE[p.key]} aria-label={`${p.label}${gemeten ? `, cijfer ${cijferTekst(score)} van 10 — ${tnv.label}` : ', nog niet gemeten'}`}
                  style={{ ...CARD, textDecoration: 'none', padding: '15px 15px 16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 118 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Icon size={17} aria-hidden style={{ color: p.kleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-1)' }}>{p.label}</span>
                    </span>
                    <span aria-hidden style={{ fontSize: 22, fontWeight: 900, color: gemeten ? 'var(--text-1)' : 'var(--text-4)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {gemeten ? cijferTekst(score) : '–'}
                    </span>
                  </span>
                  <span style={{ marginTop: 'auto', display: 'block' }}>
                    <span aria-hidden style={{ display: 'block', height: 6, borderRadius: 999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${gemeten ? Math.max(5, Math.min(100, score)) : 0}%`, background: p.kleur, borderRadius: 999, transition: 'width 0.6s var(--ease, ease)' }} />
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: gemeten ? 'var(--text-3)' : 'var(--text-4)', fontWeight: 600, marginTop: 7 }}>
                      {gemeten ? tnv.label : 'Nog niet gemeten'}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Vita — één kaart: toont een echt inzicht als dat er is, anders de coach */}
        <VitaKaart />

        {/* Zichtbare vooruitgang: trends */}
        <TrendsBlok />
      </main>
    </div>
  )
}

/** Eén Vita-kaart: een concreet data-inzicht als dat er is, altijd tikbaar naar de coach. */
function VitaKaart() {
  const inzicht = useVitaInzicht()
  return (
    <Link href="/coach" aria-label={inzicht ? 'Praat met Vita over dit inzicht' : 'Open Vita, je coach'}
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, background: 'var(--brand-soft, var(--mentaforce-primary-light))', border: '1px solid var(--brand, var(--mentaforce-primary))', borderRadius: 18, padding: '15px 16px' }}>
      <span style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--brand, var(--mentaforce-primary))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Sparkles size={20} style={{ color: 'var(--bg-app)' }} aria-hidden />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--brand, var(--mentaforce-primary))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{inzicht?.label ?? 'Vraag Vita'}</span>
        <span style={{ display: 'block', fontSize: 13, color: inzicht ? 'var(--text-1)' : 'var(--text-3)', lineHeight: 1.45, marginTop: 1 }}>
          {inzicht ? `${inzicht.emoji} ${inzicht.tekst}` : 'Je persoonlijke coach — vraag wat je maar wilt'}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden style={{ color: 'var(--brand, var(--mentaforce-primary))', flexShrink: 0 }} />
    </Link>
  )
}

function DagscoreRing({ score, kleur, size = 84 }: { score: number | null; kleur: string; size?: number }) {
  const c = size / 2
  const r = c - 8
  const circ = 2 * Math.PI * r
  const pct = score !== null ? Math.min(1, Math.max(0, score / 100)) : 0
  const font = Math.round(size * 0.3)
  const cijfer = naarCijfer(score)
  const tekst = cijfer === null ? '–' : cijfer.toLocaleString('nl-NL', { minimumFractionDigits: cijfer === 10 ? 0 : 1, maximumFractionDigits: 1 })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={cijfer !== null ? `Dagscore ${tekst} van 10` : 'Dagscore nog niet gemeten'} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="9" />
      <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: kleur, transition: 'stroke-dasharray 0.8s var(--ease, ease)' }} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + font / 3} textAnchor="middle" fontSize={font} fontWeight="900" style={{ fill: 'var(--text-1)' }}>{tekst}</text>
    </svg>
  )
}
