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
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

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
  const { t } = useVertaling()
  if (!lengteCm || !gewichtKg) return null
  const h = parseInt(lengteCm) / 100
  const w = parseFloat(gewichtKg.replace(',', '.'))
  if (!h || !w) return null
  const bmi = w / (h * h)
  const label =
    bmi < 18.5 ? t('account.intake.bmi.onder') :
    bmi < 25   ? t('account.intake.bmi.gezond') :
    bmi < 30   ? t('account.intake.bmi.over') :
                 t('account.intake.bmi.obesitas')
  return (
    <div
      style={{
        padding: '9px 14px', borderRadius: 10, marginTop: -4, marginBottom: 4,
        background: 'var(--bg-subtle)', border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
        {t('account.intake.bmiLabel')} <strong style={{ color: 'var(--text-1)' }}>{bmi.toFixed(1)}</strong>
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
  const { t } = useVertaling()
  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.45,
          background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
        }}
      >
        {t('account.intake.nooitGedeeld')}
      </div>

      <VitaVeld label={t('account.intake.geboortedatum')} htmlFor="vita-geboortedatum">
        <VitaInput
          id="vita-geboortedatum"
          type="date"
          value={gebr.geboortedatum}
          onChange={e => setGebr(f => ({ ...f, geboortedatum: e.target.value }))}
          max={maxGeboortedatum}
        />
      </VitaVeld>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <VitaVeld label={t('account.intake.lengte')} htmlFor="vita-lengte">
          <VitaInput
            id="vita-lengte" type="number" inputMode="numeric"
            value={gebr.lengte_cm}
            onChange={e => setGebr(f => ({ ...f, lengte_cm: e.target.value }))}
            placeholder="175" min={100} max={250}
          />
        </VitaVeld>
        <VitaVeld label={t('account.intake.gewicht')} htmlFor="vita-gewicht">
          <VitaInput
            id="vita-gewicht" type="number" inputMode="decimal"
            value={gebr.gewicht_kg}
            onChange={e => setGebr(f => ({ ...f, gewicht_kg: e.target.value }))}
            placeholder="70" min={30} max={300} step={0.1}
          />
        </VitaVeld>
      </div>

      <BmiStrook lengteCm={gebr.lengte_cm} gewichtKg={gebr.gewicht_kg} />

      <VitaVeld label={t('account.intake.vet')} sub={t('account.intake.vetSub')} htmlFor="vita-vet">
        <VitaInput
          id="vita-vet" type="number" inputMode="decimal"
          value={gebr.vetpercentage}
          onChange={e => setGebr(f => ({ ...f, vetpercentage: e.target.value }))}
          placeholder={t('account.intake.bijvoorbeeld', { waarde: 22 })} min={3} max={70} step={0.1}
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
  const { t } = useVertaling()
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
    titel: t(`account.intake.activiteit.${niveau}.titel`),
    sub: t(`account.intake.activiteit.${niveau}.sub`),
    aanbevolen: analyse?.activiteitsniveau_suggestie === niveau,
  }))

  const doelOpties: KaartOptie<FitnessDoel>[] = DOEL_VOLGORDE.map(doel => ({
    value: doel,
    titel: t(`account.intake.doel.${doel}.titel`),
    sub: t(`account.intake.doel.${doel}.sub`),
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
          <strong style={{ color: 'var(--mentaforce-primary)' }}>{t('account.intake.waarom')}</strong> {eersteMotivator}
        </div>
      )}

      <VitaVeld label={t('account.intake.hoeActief')} sub={t('account.intake.hoeActiefSub')}>
        <VitaKaartKeuze
          legenda={t('account.intake.activiteitsniveau')}
          opties={activiteitOpties}
          waarde={gebr.activiteitsniveau}
          onKies={v => setGebr(f => ({ ...f, activiteitsniveau: v }))}
          kolommen={1}
        />
      </VitaVeld>

      <VitaVeld label={t('account.intake.watBereiken')}>
        <VitaKaartKeuze
          legenda={t('account.intake.fitnessdoel')}
          opties={doelOpties}
          waarde={gebr.fitness_doel}
          onKies={v => setGebr(f => ({ ...f, fitness_doel: v }))}
          kolommen={2}
        />
      </VitaVeld>

      {toontStreefgewicht && (
        <div className="mf-fade-in">
          <VitaVeld
            label={t('account.intake.streefgewicht')}
            sub={gebr.fitness_doel === 'afvallen' ? t('account.intake.streefAfvallen') : t('account.intake.streefAankomen')}
            htmlFor="vita-streefgewicht"
          >
            <VitaInput
              id="vita-streefgewicht" type="number" inputMode="decimal"
              value={gebr.streefgewicht_kg}
              onChange={e => setGebr(f => ({ ...f, streefgewicht_kg: e.target.value }))}
              placeholder={t('account.intake.bijvoorbeeld', { waarde: 68 })} min={30} max={300} step={0.1}
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
            {t('account.intake.verbeterpunten')}
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

      <GesprekKnoppen onTerug={onTerug} onVolgende={onVolgende} volgendeLabel={t('account.intake.afronden')} />
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
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]

  const stappenLabel = stappen.toLocaleString(locale)

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
        {t('account.intake.dagdoelen')}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: macros ? 14 : 0 }}>
        <Pil Icon={Droplet} waarde={`${water.toLocaleString(locale)} ml`} label={t('account.intake.water')} />
        <Pil Icon={Footprints} waarde={stappenLabel} label={t('account.intake.stappen')} />
        {calorie !== null && (
          <Pil Icon={Flame} waarde={`${calorie.toLocaleString(locale)} kcal`} label={t('account.intake.perDag')} />
        )}
      </div>

      {macros && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <MacroVak label={t('account.intake.eiwit')} waarde={`${macros.eiwit_g}g`} />
          <MacroVak label={t('account.intake.koolhydraten')} waarde={`${macros.koolhydraten_g}g`} />
          <MacroVak label={t('account.intake.vetMacro')} waarde={`${macros.vet_g}g`} />
        </div>
      )}

      <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 14 }}>
        {t('account.intake.doelenUitleg')}
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
