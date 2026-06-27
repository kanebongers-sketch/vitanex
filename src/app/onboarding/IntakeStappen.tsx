'use client'

// ════════════════════════════════════════════════════════════════════════════
// Intake-stappen voor de gebruiker-onboarding (rol 'other'). Bevat:
//   - LichaamStap  — geboortedatum, lengte, gewicht, vetpercentage
//   - DoelStap     — activiteitsniveau, fitnessdoel, streefgewicht (+ AI pre-fill)
//   - DoelenPayoff — berekende dagdoelen voor het klaar-scherm
//   - EersteMetingStap — legacy readiness (nog gebruikt door page.tsx)
//
// BaselineMetingStap leeft in BaselineMetingStap.tsx (afgesplitst om onder 800 regels te blijven).
// VoedingStap is verwijderd; die wizard leeft op /voeding.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import {
  ACTIVITEIT_CONFIG,
  DOEL_CONFIG,
  berekenWaterDoelMl,
  standaardStappenDoel,
  berekenCalorieDoel,
  berekenMacros,
  type Activiteitsniveau,
  type FitnessDoel,
  type GezondheidProfiel,
} from '@/lib/gezondheid-berekeningen'
import { Veld, Input, Knop, SkipLink } from './page'
import type { OnboardingAiAnalyse } from '@/app/api/onboarding/analyse/route'

// Re-export types + component from split file so consumers get one import point
export type { BaselineMeting } from './BaselineMetingStap'
export { LEGE_BASELINE, BaselineMetingStap } from './BaselineMetingStap'

// ─── Gedeelde gebruiker-formstate ─────────────────────────────────────────────
export type Dieetvoorkeur =
  | 'geen' | 'vegetarisch' | 'veganistisch' | 'pescotarisch'
  | 'keto' | 'mediterraan' | 'glutenvrij' | 'lactosevrij'

export interface GebrForm {
  naam: string
  geslacht: '' | 'man' | 'vrouw' | 'anders' | 'zeg_ik_niet'
  geboortedatum: string
  lengte_cm: string
  gewicht_kg: string
  vetpercentage: string
  activiteitsniveau: '' | Activiteitsniveau
  fitness_doel: '' | FitnessDoel
  streefgewicht_kg: string
  dieetvoorkeur: '' | Dieetvoorkeur
  allergieen: string[]
  hrCode: string
  hrInzageRapporten: boolean
  hrInzageBestanden: boolean
}

type SetGebr = Dispatch<SetStateAction<GebrForm>>

// ─── Eerste meting (readiness) — bewaard voor dag-readiness elders ──────────
export interface EersteMeting {
  slaap: number | null
  energie: number | null
  stemming: number | null
  geladen: boolean
  score: number | null
}

// ─── Readiness helpers ────────────────────────────────────────────────────────
function berekenReadiness(slaap: number, energie: number, stemming: number): number {
  return 50 + slaap * 20 + energie * 15 + stemming * 15
}

function readinessLabel(score: number): { label: string; uitleg: string; kleur: string } {
  if (score >= 90) return { label: 'Uitstekend', uitleg: 'Je bent top in vorm. Profiteer hiervan.', kleur: 'var(--mf-green, #1D9E75)' }
  if (score >= 75) return { label: 'Goed', uitleg: 'Je hebt een solide basis. Kleine verbeteringen maken het verschil.', kleur: 'var(--mf-blue, #185FA5)' }
  if (score >= 60) return { label: 'Matig', uitleg: 'Ruimte voor verbetering. Let op slaap en herstel.', kleur: 'var(--mf-amber, #BA7517)' }
  return { label: 'Laag', uitleg: 'Je lichaam vraagt aandacht. Neem het rustig aan vandaag.', kleur: 'var(--mf-red, #E24B4A)' }
}

function ReadinessRing({ score, kleur }: { score: number; kleur: string }) {
  const radius = 54
  const omtrek = 2 * Math.PI * radius
  const voortgang = (score / 100) * omtrek
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx={70} cy={70} r={radius} fill="none" stroke="var(--mf-border, #F3F4F6)" strokeWidth={12} />
        <circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={kleur} strokeWidth={12}
          strokeDasharray={`${voortgang} ${omtrek}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
        <text x={70} y={65} textAnchor="middle" fontSize={28} fontWeight={800} fill="var(--mf-heading, #111827)">{score}</text>
        <text x={70} y={85} textAnchor="middle" fontSize={11} fill="var(--mf-text-muted, #9CA3AF)">/100</text>
      </svg>
    </div>
  )
}

function EmojiSchaal({
  vraag, emojis, waarde, onChange,
}: {
  vraag: string; emojis: string[]; waarde: number | null; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mf-text, #374151)', marginBottom: 12 }}>{vraag}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        {emojis.map((emoji, i) => {
          const val = i + 1
          const geselecteerd = waarde === val
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 12,
                border: `2px solid ${geselecteerd ? 'var(--mf-green, #1D9E75)' : 'var(--mf-border, #E5E7EB)'}`,
                background: geselecteerd ? 'var(--mf-green-light, #E1F5EE)' : 'var(--mf-bg-subtle, #F9FAFB)',
                cursor: 'pointer', fontSize: 22, transition: 'all 0.15s',
                transform: geselecteerd ? 'scale(1.12)' : 'scale(1)',
                boxShadow: geselecteerd ? '0 2px 10px rgba(29,158,117,0.22)' : 'none',
              }}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const SLAAP_EMOJIS = ['😫', '😕', '😐', '😊', '🤩']
const ENERGIE_EMOJIS = ['⚡', '⚡⚡', '⚡⚡⚡', '⚡⚡⚡⚡', '⚡⚡⚡⚡⚡']
const STEMMING_EMOJIS = ['😞', '😔', '😐', '🙂', '😄']

/** @deprecated — gebruik BaselineMetingStap in de nieuwe flow; wordt verwijderd na page.tsx refactor */
export function EersteMetingStap({
  meting, setMeting, onVolgende, onTerug, onSlaan, bezig,
}: {
  meting: EersteMeting
  setMeting: Dispatch<SetStateAction<EersteMeting>>
  onVolgende: () => void
  onTerug: () => void
  onSlaan: () => void
  bezig: boolean
}) {
  const alleIngevuld = meting.slaap !== null && meting.energie !== null && meting.stemming !== null

  if (meting.geladen && meting.score !== null) {
    const { label, uitleg, kleur } = readinessLabel(meting.score)
    return (
      <div className="mf-animate-up">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--mf-heading, #111827)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Jouw eerste Readiness Score
          </h2>
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #9CA3AF)' }}>Gebaseerd op slaap, energie en stemming</p>
        </div>
        <div style={{
          padding: '28px 24px', borderRadius: 20,
          background: 'linear-gradient(135deg, #F0FDF8, #EFF6FF)',
          border: `2px solid ${kleur}30`, marginBottom: 20, textAlign: 'center',
        }}>
          <ReadinessRing score={meting.score} kleur={kleur} />
          <div style={{ marginTop: 16 }}>
            <span style={{
              display: 'inline-block', fontSize: 13, fontWeight: 800, padding: '4px 14px',
              borderRadius: 20, background: `${kleur}20`, color: kleur, marginBottom: 8,
            }}>{label}</span>
            <p style={{ fontSize: 14, color: 'var(--mf-text, #4B5563)', lineHeight: 1.5 }}>{uitleg}</p>
          </div>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--mf-bg-subtle, #F9FAFB)', border: '1px solid var(--mf-border, #E5E7EB)', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #6B7280)', lineHeight: 1.6 }}>
            Morgenvroeg vergelijken we dit. Zo zien we hoe je evolueert.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Knop onClick={onVolgende} disabled={bezig}>{bezig ? 'Opslaan...' : 'Verder →'}</Knop>
        </div>
      </div>
    )
  }

  return (
    <div className="mf-animate-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎯</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--mf-heading, #111827)', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Jouw eerste meting
        </h2>
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #9CA3AF)', lineHeight: 1.5 }}>
          Dit duurt 30 seconden. Dan zien we gelijk hoe je je voelt.
        </p>
      </div>
      <EmojiSchaal vraag="Hoe sliep je gisteravond?" emojis={SLAAP_EMOJIS} waarde={meting.slaap} onChange={v => setMeting(m => ({ ...m, slaap: v }))} />
      <EmojiSchaal vraag="Hoe is je energieniveau nu?" emojis={ENERGIE_EMOJIS} waarde={meting.energie} onChange={v => setMeting(m => ({ ...m, energie: v }))} />
      <EmojiSchaal vraag="Hoe voel je je op dit moment?" emojis={STEMMING_EMOJIS} waarde={meting.stemming} onChange={v => setMeting(m => ({ ...m, stemming: v }))} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Knop onClick={onTerug} variant="ghost">← Terug</Knop>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <Knop
            onClick={() => {
              if (meting.slaap === null || meting.energie === null || meting.stemming === null) return
              const score = Math.min(100, berekenReadiness(
                (meting.slaap - 1) / 4, (meting.energie - 1) / 4, (meting.stemming - 1) / 4,
              ))
              setMeting(m => ({ ...m, score: Math.round(score), geladen: true }))
            }}
            disabled={!alleIngevuld}
          >
            Bereken mijn score →
          </Knop>
          <SkipLink onClick={onSlaan} label="Sla meting over" />
        </div>
      </div>
    </div>
  )
}

// ─── Kleine herbruikbare keuzekaart ───────────────────────────────────────────
function KeuzeKaart({
  actief, kleur, titel, sub, onClick, aanbevolen,
}: {
  actief: boolean; kleur: string; titel: string; sub: string; onClick: () => void; aanbevolen?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '13px 15px', borderRadius: 14, transition: 'all 0.14s',
        border: `2px solid ${actief ? kleur : 'var(--mf-border, #E5E7EB)'}`,
        background: actief ? `${kleur}14` : 'var(--mf-surface, white)',
        transform: actief ? 'translateY(-1px)' : 'none',
        boxShadow: actief ? `0 4px 14px ${kleur}26` : 'none',
        position: 'relative',
      }}
    >
      {aanbevolen && (
        <span style={{
          position: 'absolute', top: -8, right: 10,
          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 9999,
          background: 'var(--mf-green, #1D9E75)', color: 'white',
        }}>Aanbevolen</span>
      )}
      <p style={{ fontSize: 14, fontWeight: 700, color: actief ? kleur : 'var(--mf-heading, #111827)', marginBottom: 2 }}>{titel}</p>
      <p style={{ fontSize: 12, color: 'var(--mf-text-muted, #9CA3AF)', lineHeight: 1.35 }}>{sub}</p>
    </button>
  )
}

// ─── BMI-strookje ─────────────────────────────────────────────────────────────
function BmiStrook({ lengteCm, gewichtKg }: { lengteCm: string; gewichtKg: string }) {
  if (!lengteCm || !gewichtKg) return null
  const h = parseInt(lengteCm) / 100
  const w = parseFloat(gewichtKg.replace(',', '.'))
  if (!h || !w) return null
  const bmi = w / (h * h)
  const cat =
    bmi < 18.5 ? { label: 'Ondergewicht', k: 'var(--mf-blue, #378ADD)' } :
    bmi < 25   ? { label: 'Gezond gewicht', k: 'var(--mf-green, #1D9E75)' } :
    bmi < 30   ? { label: 'Overgewicht', k: 'var(--mf-amber, #BA7517)' } :
                 { label: 'Obesitas', k: 'var(--mf-red, #E24B4A)' }
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 10,
      background: 'var(--mf-bg-subtle, #F9FAFB)', border: '1px solid var(--mf-border, #E5E7EB)',
      display: 'flex', justifyContent: 'space-between', marginTop: -8, marginBottom: 12,
    }}>
      <span style={{ fontSize: 13, color: 'var(--mf-text-muted, #6B7280)' }}>BMI: <strong>{bmi.toFixed(1)}</strong></span>
      <span style={{ fontSize: 12, fontWeight: 700, color: cat.k, padding: '2px 8px', borderRadius: 20, background: cat.k + '18' }}>{cat.label}</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAP: LICHAAM — geboortedatum, lengte, gewicht, vetpercentage
// ════════════════════════════════════════════════════════════════════════════
export function LichaamStap({
  gebr, setGebr, maxGeboortedatum, onTerug, onVolgende, hrSlot,
}: {
  gebr: GebrForm; setGebr: SetGebr; maxGeboortedatum: string
  onTerug: () => void; onVolgende: () => void
  hrSlot?: ReactNode
}) {
  return (
    <div className="mf-animate-up">
      <div style={{ fontSize: 28, marginBottom: 10 }}>📏</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--mf-heading, #111827)', marginBottom: 4 }}>Over jouw lichaam</h2>
      <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #9CA3AF)', marginBottom: 16 }}>
        Hiermee berekenen we jouw water-, stappen- en caloriedoelen — <em>optioneel</em>
      </p>

      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--mf-green-light, #E1F5EE)', border: '1px solid var(--mf-green, #1D9E75)40', fontSize: 12, color: 'var(--mf-green-dark, #0F6E56)', marginBottom: 20 }}>
        Nooit gedeeld met HR — alleen voor jouw persoonlijke dashboard
      </div>

      <Veld label="Geboortedatum">
        <Input type="date" value={gebr.geboortedatum} onChange={e => setGebr(f => ({ ...f, geboortedatum: e.target.value }))} max={maxGeboortedatum} />
      </Veld>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Veld label="Lengte (cm)">
          <Input type="number" value={gebr.lengte_cm} onChange={e => setGebr(f => ({ ...f, lengte_cm: e.target.value }))} placeholder="175" min={100} max={250} />
        </Veld>
        <Veld label="Gewicht (kg)">
          <Input type="number" value={gebr.gewicht_kg} onChange={e => setGebr(f => ({ ...f, gewicht_kg: e.target.value }))} placeholder="70" min={30} max={300} step={0.1} />
        </Veld>
      </div>

      <BmiStrook lengteCm={gebr.lengte_cm} gewichtKg={gebr.gewicht_kg} />

      <Veld label="Vetpercentage (%)" sub="Bijv. van een slimme weegschaal — laat leeg als je het niet weet">
        <Input type="number" value={gebr.vetpercentage} onChange={e => setGebr(f => ({ ...f, vetpercentage: e.target.value }))} placeholder="bijv. 22" min={3} max={70} step={0.1} />
      </Veld>

      {hrSlot}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
        <Knop onClick={onTerug} variant="ghost">← Terug</Knop>
        <Knop onClick={onVolgende}>Volgende →</Knop>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAP: DOEL — activiteitsniveau, fitnessdoel, conditioneel streefgewicht
// Accepteert optioneel AI-analyse voor pre-fill en narratief-banner.
// ════════════════════════════════════════════════════════════════════════════
const ACTIVITEIT_VOLGORDE: Activiteitsniveau[] = ['sedentair', 'licht', 'gemiddeld', 'actief', 'zeer_actief']
const DOEL_VOLGORDE: FitnessDoel[] = ['afvallen', 'onderhouden', 'aankomen', 'fitter']

export function DoelStap({
  gebr, setGebr, onTerug, onVolgende, analyse,
}: {
  gebr: GebrForm
  setGebr: SetGebr
  onTerug: () => void
  onVolgende: () => void
  analyse?: OnboardingAiAnalyse | null
}) {
  const toontStreefgewicht = gebr.fitness_doel === 'afvallen' || gebr.fitness_doel === 'aankomen'

  // Pre-fill AI-suggesties eenmalig als velden nog leeg zijn
  useEffect(() => {
    if (!analyse) return
    setGebr(f => ({
      ...f,
      activiteitsniveau: (!f.activiteitsniveau && analyse.activiteitsniveau_suggestie)
        ? analyse.activiteitsniveau_suggestie
        : f.activiteitsniveau,
      fitness_doel: (!f.fitness_doel && analyse.fitness_doel_suggestie)
        ? analyse.fitness_doel_suggestie
        : f.fitness_doel,
    }))
  // Eenmalig bij mount / wanneer analyse binnenkomt
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyse])

  const eersteMotivator = analyse?.voorgestelde_doelen?.[0]?.reden ?? null

  return (
    <div className="mf-animate-up">
      <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--mf-heading, #111827)', marginBottom: 4 }}>Jouw doel</h2>
      <p style={{ fontSize: 13, color: 'var(--mf-text-muted, #9CA3AF)', marginBottom: 16 }}>
        Zo stemmen we jouw schema, voeding en coaching op je af
      </p>

      {/* AI motivator-anker banner */}
      {eersteMotivator && (
        <div style={{
          padding: '10px 14px', borderRadius: 12, marginBottom: 18,
          background: 'var(--mf-green-light, #E1F5EE)', border: '1px solid var(--mf-green, #1D9E75)',
          fontSize: 13, color: 'var(--mf-green-dark, #0F6E56)', lineHeight: 1.5,
        }}>
          <strong>Jouw waarom:</strong> {eersteMotivator}
        </div>
      )}

      {/* AI narratief-banner */}
      {analyse?.narratief && (
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 20,
          background: 'linear-gradient(135deg, #F0FDF8, #EFF6FF)',
          border: '1px solid var(--mf-green, #1D9E75)30',
          fontSize: 13, color: 'var(--mf-text, #374151)', lineHeight: 1.6,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-green-dark, #0F6E56)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Jouw startfoto
          </p>
          {analyse.narratief}
        </div>
      )}

      <Veld label="Hoe actief ben je?" sub="Inclusief werk en sport">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACTIVITEIT_VOLGORDE.map(niveau => {
            const cfg = ACTIVITEIT_CONFIG[niveau]
            const isAanbevolen = analyse?.activiteitsniveau_suggestie === niveau
            return (
              <KeuzeKaart
                key={niveau}
                actief={gebr.activiteitsniveau === niveau}
                kleur="var(--mf-green, #1D9E75)"
                titel={cfg.label}
                sub={cfg.sub}
                aanbevolen={isAanbevolen}
                onClick={() => setGebr(f => ({ ...f, activiteitsniveau: niveau }))}
              />
            )
          })}
        </div>
      </Veld>

      <Veld label="Wat wil je bereiken?">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DOEL_VOLGORDE.map(doel => {
            const cfg = DOEL_CONFIG[doel]
            const isAanbevolen = analyse?.fitness_doel_suggestie === doel
            return (
              <KeuzeKaart
                key={doel}
                actief={gebr.fitness_doel === doel}
                kleur={cfg.kleur}
                titel={cfg.label}
                sub={cfg.sub}
                aanbevolen={isAanbevolen}
                onClick={() => setGebr(f => ({ ...f, fitness_doel: doel }))}
              />
            )
          })}
        </div>
      </Veld>

      {toontStreefgewicht && (
        <div className="mf-animate-up">
          <Veld
            label="Streefgewicht (kg)"
            sub={gebr.fitness_doel === 'afvallen' ? 'Naar welk gewicht wil je toe?' : 'Welk gewicht wil je bereiken?'}
          >
            <Input
              type="number"
              value={gebr.streefgewicht_kg}
              onChange={e => setGebr(f => ({ ...f, streefgewicht_kg: e.target.value }))}
              placeholder="bijv. 68"
              min={30}
              max={300}
              step={0.1}
            />
          </Veld>
        </div>
      )}

      {/* Verbeterpunten-strip */}
      {analyse?.top_verbeterpunten && analyse.top_verbeterpunten.length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Jouw top verbeterpunten
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analyse.top_verbeterpunten.map(vp => (
              <div key={vp.pijler} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'var(--mf-bg-subtle, #F9FAFB)', border: '1px solid var(--mf-border, #E5E7EB)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-heading, #111827)', marginBottom: 2, textTransform: 'capitalize' }}>
                  {vp.pijler}
                </p>
                <p style={{ fontSize: 12, color: 'var(--mf-text-muted, #6B7280)', lineHeight: 1.4 }}>
                  {vp.eerste_stap}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
        <Knop onClick={onTerug} variant="ghost">← Terug</Knop>
        <Knop onClick={onVolgende}>Volgende →</Knop>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAYOFF — berekende doelen-samenvatting voor het 'klaar'-scherm
// ════════════════════════════════════════════════════════════════════════════
export function DoelenPayoff({ profiel }: { profiel: GezondheidProfiel }) {
  const water = berekenWaterDoelMl(profiel.gewicht_kg, profiel.activiteitsniveau)
  const stappen = standaardStappenDoel(profiel.fitness_doel)
  const calorie = berekenCalorieDoel(profiel)
  const macros = berekenMacros(profiel)

  const stappenLabel = stappen.toLocaleString('nl-NL')

  return (
    <div style={{
      padding: '18px 18px 16px', borderRadius: 18, marginBottom: 24, textAlign: 'left',
      background: 'linear-gradient(135deg, #F0FDF8, #EFF6FF)',
      border: '1px solid var(--mf-green, #1D9E75)2E',
    }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-green-dark, #0F6E56)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Jouw persoonlijke dagdoelen
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: macros ? 14 : 0 }}>
        <Pil icoon="💧" waarde={`${water.toLocaleString('nl-NL')} ml`} label="water" kleur="var(--mf-blue, #185FA5)" />
        <Pil icoon="👟" waarde={stappenLabel} label="stappen" kleur="var(--mf-green, #1D9E75)" />
        {calorie !== null && (
          <Pil icoon="🔥" waarde={`${calorie.toLocaleString('nl-NL')} kcal`} label="per dag" kleur="var(--mf-amber, #BA7517)" />
        )}
      </div>

      {macros && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <MacroVak label="Eiwit" waarde={`${macros.eiwit_g}g`} kleur="var(--mf-red, #E24B4A)" />
          <MacroVak label="Koolh." waarde={`${macros.koolhydraten_g}g`} kleur="var(--mf-blue, #185FA5)" />
          <MacroVak label="Vet" waarde={`${macros.vet_g}g`} kleur="var(--mf-amber, #BA7517)" />
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--mf-text-muted, #6B7280)', lineHeight: 1.5, marginTop: 14 }}>
        Deze doelen passen we automatisch aan zodra je meer bijhoudt. Je kunt ze altijd zelf instellen.
      </p>
    </div>
  )
}

function Pil({ icoon, waarde, label, kleur }: { icoon: string; waarde: string; label: string; kleur: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9999,
      background: 'var(--mf-surface, white)', border: `1.5px solid ${kleur}33`,
    }}>
      <span style={{ fontSize: 16 }}>{icoon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: kleur }}>{waarde}</span>
      <span style={{ fontSize: 12, color: 'var(--mf-text-muted, #9CA3AF)' }}>{label}</span>
    </div>
  )
}

function MacroVak({ label, waarde, kleur }: { label: string; waarde: string; kleur: string }) {
  return (
    <div style={{
      padding: '8px 6px', borderRadius: 12, textAlign: 'center',
      background: 'var(--mf-surface, white)', border: '1px solid var(--mf-border, #E5E7EB)',
    }}>
      <p style={{ fontSize: 15, fontWeight: 800, color: kleur }}>{waarde}</p>
      <p style={{ fontSize: 11, color: 'var(--mf-text-muted, #9CA3AF)', marginTop: 1 }}>{label}</p>
    </div>
  )
}
