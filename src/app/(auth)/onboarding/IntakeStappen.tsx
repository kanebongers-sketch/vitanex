'use client'

// ════════════════════════════════════════════════════════════════════════════
// Intake-stappen voor het Vita-gesprek (rol 'gebruiker'):
//   - LichaamStap  — geboortedatum, lengte, gewicht, vetpercentage (+ HR-slot)
//   - DoelStap     — activiteitsniveau, fitnessdoel, streefgewicht (+ AI pre-fill)
//   - DoelenPayoff — berekende dagdoelen voor het klaar-scherm
//
// Strikt navy + cyan (tokens uit globals.css), toetsenbord + cyan focus-ring.
// BaselineMetingStap leeft in BaselineMetingStap.tsx.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Droplet, Footprints, Flame } from 'lucide-react'
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
} from '@/lib/health/gezondheid-berekeningen'
import type { OnboardingAiAnalyse } from '@/app/api/onboarding/analyse/route'
import { VitaVeld, VitaInput, VitaKaartKeuze, GesprekKnoppen, type KaartOptie } from './VitaKeuze'

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

// ─── BMI-strookje (twee-tonig: cyan accent + neutrale tekst) ─────────────────
function BmiStrook({ lengteCm, gewichtKg }: { lengteCm: string; gewichtKg: string }) {
  if (!lengteCm || !gewichtKg) return null
  const h = parseInt(lengteCm) / 100
  const w = parseFloat(gewichtKg.replace(',', '.'))
  if (!h || !w) return null
  const bmi = w / (h * h)
  const label =
    bmi < 18.5 ? 'Ondergewicht' :
    bmi < 25   ? 'Gezond gewicht' :
    bmi < 30   ? 'Overgewicht' :
                 'Obesitas'
  return (
    <div
      style={{
        padding: '9px 14px', borderRadius: 10, marginTop: -4, marginBottom: 4,
        background: 'var(--bg-subtle)', border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
        BMI: <strong style={{ color: 'var(--text-1)' }}>{bmi.toFixed(1)}</strong>
      </span>
      <span
        style={{
          fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 9999,
          background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
        }}
      >
        {label}
      </span>
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
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.45,
          background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
        }}
      >
        Nooit gedeeld met HR — alleen voor jouw persoonlijke dashboard.
      </div>

      <VitaVeld label="Geboortedatum" htmlFor="vita-geboortedatum">
        <VitaInput
          id="vita-geboortedatum"
          type="date"
          value={gebr.geboortedatum}
          onChange={e => setGebr(f => ({ ...f, geboortedatum: e.target.value }))}
          max={maxGeboortedatum}
        />
      </VitaVeld>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <VitaVeld label="Lengte (cm)" htmlFor="vita-lengte">
          <VitaInput
            id="vita-lengte" type="number" inputMode="numeric"
            value={gebr.lengte_cm}
            onChange={e => setGebr(f => ({ ...f, lengte_cm: e.target.value }))}
            placeholder="175" min={100} max={250}
          />
        </VitaVeld>
        <VitaVeld label="Gewicht (kg)" htmlFor="vita-gewicht">
          <VitaInput
            id="vita-gewicht" type="number" inputMode="decimal"
            value={gebr.gewicht_kg}
            onChange={e => setGebr(f => ({ ...f, gewicht_kg: e.target.value }))}
            placeholder="70" min={30} max={300} step={0.1}
          />
        </VitaVeld>
      </div>

      <BmiStrook lengteCm={gebr.lengte_cm} gewichtKg={gebr.gewicht_kg} />

      <VitaVeld label="Vetpercentage (%)" sub="Bijv. van een slimme weegschaal — laat leeg als je het niet weet" htmlFor="vita-vet">
        <VitaInput
          id="vita-vet" type="number" inputMode="decimal"
          value={gebr.vetpercentage}
          onChange={e => setGebr(f => ({ ...f, vetpercentage: e.target.value }))}
          placeholder="bijv. 22" min={3} max={70} step={0.1}
        />
      </VitaVeld>

      {hrSlot}

      <GesprekKnoppen onTerug={onTerug} onVolgende={onVolgende} />
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

  const activiteitOpties: KaartOptie<Activiteitsniveau>[] = ACTIVITEIT_VOLGORDE.map(niveau => ({
    value: niveau,
    titel: ACTIVITEIT_CONFIG[niveau].label,
    sub: ACTIVITEIT_CONFIG[niveau].sub,
    aanbevolen: analyse?.activiteitsniveau_suggestie === niveau,
  }))

  const doelOpties: KaartOptie<FitnessDoel>[] = DOEL_VOLGORDE.map(doel => ({
    value: doel,
    titel: DOEL_CONFIG[doel].label,
    sub: DOEL_CONFIG[doel].sub,
    aanbevolen: analyse?.fitness_doel_suggestie === doel,
  }))

  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {eersteMotivator && (
        <div
          style={{
            padding: '11px 14px', borderRadius: 12,
            background: 'var(--mentaforce-primary-light)',
            border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)',
            fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--mentaforce-primary)' }}>Jouw waarom:</strong> {eersteMotivator}
        </div>
      )}

      <VitaVeld label="Hoe actief ben je?" sub="Inclusief werk en sport">
        <VitaKaartKeuze
          legenda="Activiteitsniveau"
          opties={activiteitOpties}
          waarde={gebr.activiteitsniveau}
          onKies={v => setGebr(f => ({ ...f, activiteitsniveau: v }))}
          kolommen={1}
        />
      </VitaVeld>

      <VitaVeld label="Wat wil je bereiken?">
        <VitaKaartKeuze
          legenda="Fitnessdoel"
          opties={doelOpties}
          waarde={gebr.fitness_doel}
          onKies={v => setGebr(f => ({ ...f, fitness_doel: v }))}
          kolommen={2}
        />
      </VitaVeld>

      {toontStreefgewicht && (
        <div className="mf-fade-in">
          <VitaVeld
            label="Streefgewicht (kg)"
            sub={gebr.fitness_doel === 'afvallen' ? 'Naar welk gewicht wil je toe?' : 'Welk gewicht wil je bereiken?'}
            htmlFor="vita-streefgewicht"
          >
            <VitaInput
              id="vita-streefgewicht" type="number" inputMode="decimal"
              value={gebr.streefgewicht_kg}
              onChange={e => setGebr(f => ({ ...f, streefgewicht_kg: e.target.value }))}
              placeholder="bijv. 68" min={30} max={300} step={0.1}
            />
          </VitaVeld>
        </div>
      )}

      {/* Verbeterpunten-strip */}
      {analyse?.top_verbeterpunten && analyse.top_verbeterpunten.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11, fontWeight: 800, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
            }}
          >
            Jouw top verbeterpunten
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analyse.top_verbeterpunten.map(vp => (
              <div
                key={vp.pijler}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                }}
              >
                <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2, textTransform: 'capitalize' }}>
                  {vp.pijler}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{vp.eerste_stap}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <GesprekKnoppen onTerug={onTerug} onVolgende={onVolgende} volgendeLabel="Rond mijn intake af" />
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
    <div
      style={{
        padding: '18px', borderRadius: 18, textAlign: 'left',
        background: 'var(--bg-subtle)',
        border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 24%, transparent)',
      }}
    >
      <p
        style={{
          fontSize: 11, fontWeight: 800, color: 'var(--mentaforce-primary)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
        }}
      >
        Jouw persoonlijke dagdoelen
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: macros ? 14 : 0 }}>
        <Pil Icon={Droplet} waarde={`${water.toLocaleString('nl-NL')} ml`} label="water" />
        <Pil Icon={Footprints} waarde={stappenLabel} label="stappen" />
        {calorie !== null && (
          <Pil Icon={Flame} waarde={`${calorie.toLocaleString('nl-NL')} kcal`} label="per dag" />
        )}
      </div>

      {macros && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <MacroVak label="Eiwit" waarde={`${macros.eiwit_g}g`} />
          <MacroVak label="Koolh." waarde={`${macros.koolhydraten_g}g`} />
          <MacroVak label="Vet" waarde={`${macros.vet_g}g`} />
        </div>
      )}

      <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 14 }}>
        Deze doelen pas ik automatisch aan zodra je meer bijhoudt. Je kunt ze altijd zelf instellen.
      </p>
    </div>
  )
}

function Pil({ Icon, waarde, label }: { Icon: typeof Droplet; waarde: string; label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9999,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}
    >
      <span aria-hidden style={{ color: 'var(--mentaforce-primary)', display: 'inline-flex' }}>
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{waarde}</span>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

function MacroVak({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div
      style={{
        padding: '9px 6px', borderRadius: 12, textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--mentaforce-primary)' }}>{waarde}</p>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{label}</p>
    </div>
  )
}
