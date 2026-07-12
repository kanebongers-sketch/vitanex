'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaIntakeGesprek — de gebruiker-onboarding als een gesprek met Vita.
// Geen formulier: Vita leert de gebruiker kennen. Na elk antwoord reageert ze
// kort en warm, dan komt de volgende vraag. Strikt navy + cyan; PandaFace is
// het enige meerkleurige element. Rustige fade/translate, reduced-motion-safe.
//
// Deze component rendert de PRESENTATIE. Alle data-saves + auth leven in
// page.tsx (container) en komen als props binnen — er gaat hier niets verloren.
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import {
  Mars, Venus, Transgender, CircleDashed, ArrowRight,
  Building2, Check, Sparkles,
} from 'lucide-react'
import type { GezondheidProfiel } from '@/lib/health/gezondheid-berekeningen'
import type { OnboardingAiAnalyse } from '@/app/api/onboarding/analyse/route'
import type { GebrForm } from './IntakeStappen'
import { LichaamStap, DoelStap, DoelenPayoff } from './IntakeStappen'
import type { BaselineMeting } from './BaselineMetingStap'
import { BaselineMetingStap } from './BaselineMetingStap'
import VitaBubbel from '@/components/vita/VitaBubbel'
import { VitaKaartKeuze, VitaVeld, VitaInput, GesprekKnoppen, type KaartOptie } from './VitaKeuze'
import { GesprekStyles } from './VitaGesprekStyles'

// ─── Stappen ──────────────────────────────────────────────────────────────────
export type IntakeStap = 'welkom' | 'profiel' | 'eerste-meting' | 'lichaam' | 'doel' | 'klaar'
export const INTAKE_STAPPEN: IntakeStap[] = ['welkom', 'profiel', 'eerste-meting', 'lichaam', 'doel', 'klaar']

// Stappen die in de subtiele voortgangsindicatie meetellen (welkom/klaar niet).
const VOORTGANG_STAPPEN: IntakeStap[] = ['profiel', 'eerste-meting', 'lichaam', 'doel']

const GESLACHT_OPTIES: readonly KaartOptie<'man' | 'vrouw' | 'anders' | 'zeg_ik_niet'>[] = [
  { value: 'man', titel: 'Man', Icon: Mars },
  { value: 'vrouw', titel: 'Vrouw', Icon: Venus },
  { value: 'anders', titel: 'Anders', Icon: Transgender },
  { value: 'zeg_ik_niet', titel: 'Zeg ik liever niet', Icon: CircleDashed },
]

// ────────────────────────────────────────────────────────────────────────────
// Subtiele voortgangsindicatie: kleine cyan-segmentjes, geen %-badge.
// ────────────────────────────────────────────────────────────────────────────
function Voortgang({ stap }: { stap: IntakeStap }) {
  const actiefIndex = VOORTGANG_STAPPEN.indexOf(stap)
  if (actiefIndex < 0) return null
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={VOORTGANG_STAPPEN.length}
      aria-valuenow={actiefIndex + 1}
      aria-label={`Stap ${actiefIndex + 1} van ${VOORTGANG_STAPPEN.length}`}
      style={{ display: 'flex', gap: 6, marginBottom: 24 }}
    >
      {VOORTGANG_STAPPEN.map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            height: 3, flex: 1, borderRadius: 9999,
            background: i <= actiefIndex ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
            transition: 'background 0.4s var(--ease)',
          }}
        />
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Props — alles wat de container (page.tsx) aanlevert. Data-saves blijven daar.
// ════════════════════════════════════════════════════════════════════════════
export interface VitaIntakeGesprekProps {
  stap: IntakeStap
  setStap: (s: IntakeStap) => void
  naam: string
  gebr: GebrForm
  setGebr: Dispatch<SetStateAction<GebrForm>>
  baseline: BaselineMeting
  setBaseline: Dispatch<SetStateAction<BaselineMeting>>
  maxGeboortedatum: string
  aiAnalyse: OnboardingAiAnalyse | null
  aiBezig: boolean
  bezig: boolean
  fout: string | null
  hrCodeBedrijf: string
  bouwProfiel: () => GezondheidProfiel
  onStartMeting: () => void
  onAfronden: () => void
  hrSlot: ReactNode
}

export default function VitaIntakeGesprek(props: VitaIntakeGesprekProps) {
  const {
    stap, setStap, naam, gebr, setGebr, baseline, setBaseline, maxGeboortedatum,
    aiAnalyse, aiBezig, bezig, fout, hrCodeBedrijf, bouwProfiel, onStartMeting, onAfronden, hrSlot,
  } = props

  const displayNaam = gebr.naam || naam

  return (
    <main className="vita-intake">
      <GesprekStyles />
      <div className="vita-intake-kaart mf-grain">
        {/* Woordmerk met cyaan accent */}
        <header className="vita-merk">
          <span className="vita-merk-woord">
            MENTAFORCE<span className="vita-merk-stip" aria-hidden>.</span>
          </span>
          <span className="vita-merk-badge">Intake met Vita</span>
        </header>

        <Voortgang stap={stap} />

        {fout && (
          <div role="alert" className="vita-fout">{fout}</div>
        )}

        {stap === 'welkom' && (
          <WelkomStap naam={displayNaam} onStart={() => setStap('profiel')} />
        )}

        {stap === 'profiel' && (
          <ProfielStap
            gebr={gebr}
            setGebr={setGebr}
            naam={displayNaam}
            onTerug={() => setStap('welkom')}
            onVolgende={() => setStap('eerste-meting')}
          />
        )}

        {stap === 'eerste-meting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VitaBubbel emotion="curious" animate>
              Nu wil ik écht weten hoe het met je gaat, {displayNaam || 'even'}. Vijftien korte vragen —
              geen goed of fout, gewoon eerlijk. Hiermee maak ik jouw persoonlijke startfoto.
            </VitaBubbel>
            <BaselineMetingStap
              meting={baseline}
              setMeting={setBaseline}
              onTerug={() => setStap('profiel')}
              onVolgende={onStartMeting}
              onSlaan={() => setStap('lichaam')}
              bezig={aiBezig}
            />
          </div>
        )}

        {stap === 'lichaam' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VitaBubbel emotion="calm" animate>
              Fijn, dank je. Om jouw water-, stappen- en caloriedoelen kloppend te maken help
              een paar cijfers me enorm. Alles is optioneel en blijft strikt tussen ons.
            </VitaBubbel>
            <LichaamStap
              gebr={gebr}
              setGebr={setGebr}
              maxGeboortedatum={maxGeboortedatum}
              onTerug={() => setStap('eerste-meting')}
              onVolgende={() => setStap('doel')}
              hrSlot={hrSlot}
            />
          </div>
        )}

        {stap === 'doel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VitaBubbel emotion="motivated" animate>
              Bijna klaar. Vertel me waar je naartoe wilt — dan stem ik je schema, voeding en
              mijn coaching daarop af.
            </VitaBubbel>
            <DoelStap
              gebr={gebr}
              setGebr={setGebr}
              onTerug={() => setStap('lichaam')}
              onVolgende={onAfronden}
              analyse={aiAnalyse}
            />
          </div>
        )}

        {stap === 'klaar' && (
          <KlaarStap
            naam={displayNaam}
            aiAnalyse={aiAnalyse}
            profiel={bouwProfiel()}
            heeftStartmeting={Boolean(gebr.gewicht_kg)}
            hrCodeBedrijf={hrCodeBedrijf}
            bezig={bezig}
          />
        )}
      </div>
    </main>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// WELKOM — Vita stelt zich voor
// ════════════════════════════════════════════════════════════════════════════
function WelkomStap({ naam, onStart }: { naam: string; onStart: () => void }) {
  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <VitaBubbel emotion="proud" animate size={60}>
        {naam ? (
          <>Hoi {naam}, wat leuk dat je er bent. Ik ben <strong>Vita</strong>, en vanaf nu loop
          ik met je mee.</>
        ) : (
          <>Hoi, wat leuk dat je er bent. Ik ben <strong>Vita</strong>, en vanaf nu loop ik met
          je mee.</>
        )}
      </VitaBubbel>

      <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-2)' }}>
        Geen lange vragenlijst. We hebben even een gesprekje — over hoe je je voelt, hoe je slaapt
        en waar je naartoe wilt. Daarna weet ik precies hoe ik je kan helpen.
      </p>

      <ul className="vita-punten">
        {[
          'Een persoonlijke startfoto van jouw welzijn',
          'Water-, stappen- en caloriedoelen op maat',
          'Optioneel: koppelen aan je werkgever',
        ].map(t => (
          <li key={t}>
            <span className="vita-punt-check" aria-hidden><Check size={13} strokeWidth={2.5} /></span>
            {t}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" onClick={onStart} className="vita-knop vita-knop-primary vita-knop-blok">
          Begin het gesprek <ArrowRight size={17} strokeWidth={2.25} aria-hidden />
        </button>
        <p style={{ fontSize: 12.5, color: 'var(--text-4)', textAlign: 'center' }}>
          Ongeveer 5 minuten · eenmalig · altijd bij te stellen
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PROFIEL — naam + geslacht, conversationeel
// ════════════════════════════════════════════════════════════════════════════
function ProfielStap({
  gebr, setGebr, naam, onTerug, onVolgende,
}: {
  gebr: GebrForm
  setGebr: Dispatch<SetStateAction<GebrForm>>
  naam: string
  onTerug: () => void
  onVolgende: () => void
}) {
  const heeftNaam = gebr.naam.trim().length > 0
  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <VitaBubbel emotion="curious" animate>
        Zullen we beginnen bij het begin? Hoe mag ik je noemen?
      </VitaBubbel>

      <VitaVeld label="Jouw naam" htmlFor="vita-naam">
        <VitaInput
          id="vita-naam"
          value={gebr.naam}
          onChange={e => setGebr(f => ({ ...f, naam: e.target.value }))}
          placeholder="Bijv. Sam"
          autoFocus
          autoComplete="given-name"
        />
      </VitaVeld>

      {heeftNaam && (
        <div className="mf-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <VitaBubbel emotion="supportive" animate>
            Leuk je te ontmoeten, {gebr.naam.trim()}. Nog één ding zodat ik je scores kloppend maak —
            volledig optioneel.
          </VitaBubbel>
          <VitaVeld label="Wat past het best bij jou?" sub="Alleen voor nauwkeurige berekeningen — nooit gedeeld met HR">
            <VitaKaartKeuze
              legenda="Geslacht"
              opties={GESLACHT_OPTIES}
              waarde={gebr.geslacht}
              onKies={v => setGebr(f => ({ ...f, geslacht: v }))}
              kolommen={2}
            />
          </VitaVeld>
        </div>
      )}

      <GesprekKnoppen
        onTerug={onTerug}
        onVolgende={onVolgende}
        volgendeDisabled={!heeftNaam}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// KLAAR — Vita verwelkomt persoonlijk + berekende doelen
// ════════════════════════════════════════════════════════════════════════════
function KlaarStap({
  naam, aiAnalyse, profiel, heeftStartmeting, hrCodeBedrijf, bezig,
}: {
  naam: string
  aiAnalyse: OnboardingAiAnalyse | null
  profiel: GezondheidProfiel
  heeftStartmeting: boolean
  hrCodeBedrijf: string
  bezig: boolean
}) {
  const samenvatting = useMemo(() => {
    const items: { Icon: typeof Sparkles; tekst: string }[] = []
    if (aiAnalyse) items.push({ Icon: Sparkles, tekst: `Vitality Score: ${aiAnalyse.vitality_score}/100` })
    if (heeftStartmeting) items.push({ Icon: Check, tekst: 'Startmeting opgeslagen' })
    items.push(
      hrCodeBedrijf
        ? { Icon: Building2, tekst: `Gekoppeld aan ${hrCodeBedrijf}` }
        : { Icon: Check, tekst: 'Persoonlijk account aangemaakt' },
    )
    return items
  }, [aiAnalyse, heeftStartmeting, hrCodeBedrijf])

  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <VitaBubbel emotion="proud" animate size={60}>
        {naam ? <>Klaar, {naam}!</> : <>Klaar!</>} Ik ken je nu een stuk beter. Vanaf nu loop ik met
        je mee — elke dag een beetje.
      </VitaBubbel>

      {aiAnalyse?.narratief && (
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.65 }}>
          {aiAnalyse.narratief}
        </p>
      )}

      <DoelenPayoff profiel={profiel} />

      <ul className="vita-samenvatting">
        {samenvatting.map((item, i) => (
          <li key={i}>
            <span className="vita-samenvatting-icoon" aria-hidden>
              <item.Icon size={15} strokeWidth={2} />
            </span>
            {item.tekst}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => { window.location.href = '/home' }}
        disabled={bezig}
        className="vita-knop vita-knop-primary vita-knop-blok"
      >
        {bezig ? 'Bezig…' : 'Naar mijn dashboard'} <ArrowRight size={17} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  )
}
