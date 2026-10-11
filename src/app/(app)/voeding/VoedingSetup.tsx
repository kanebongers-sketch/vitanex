'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import {
  ACTIVITEIT_CONFIG,
  DOEL_CONFIG,
  type Activiteitsniveau,
  type FitnessDoel,
  type Geslacht,
} from '@/lib/health/gezondheid-berekeningen'

// ── Berekeningen (inline, geen geboortedatum nodig) ───────────────────────────

function berekenBMRInline(g: number, l: number, a: number, geslacht: string): number {
  const offset = geslacht === 'man' ? 5 : geslacht === 'vrouw' ? -161 : -78
  return Math.round(10 * g + 6.25 * l - 5 * a + offset)
}

function berekenTDEEInline(g: number, l: number, a: number, geslacht: string, act: Activiteitsniveau): number {
  return Math.round(berekenBMRInline(g, l, a, geslacht) * ACTIVITEIT_CONFIG[act].multiplier)
}

function bepaalActiviteitsniveau(werktype: string, sport: number): Activiteitsniveau {
  if (werktype === 'kantoor') {
    if (sport === 0) return 'sedentair'
    if (sport <= 2) return 'licht'
    if (sport <= 4) return 'gemiddeld'
    return 'actief'
  }
  if (werktype === 'licht') {
    if (sport === 0) return 'licht'
    if (sport <= 2) return 'gemiddeld'
    if (sport <= 4) return 'actief'
    return 'zeer_actief'
  }
  return sport >= 5 ? 'zeer_actief' : 'actief'
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Labels staan in het woordenboek: lichaam.voedingSetup.geslacht.<value>. */
const GESLACHT_OPTIES: Geslacht[] = ['man', 'vrouw', 'anders']

/** Labels: lichaam.voedingSetup.werk.<value>.label/sub. */
const WERK_OPTIES = [
  { value: 'kantoor', icon: '💼' },
  { value: 'licht',   icon: '🚶' },
  { value: 'fysiek',  icon: '🏗️' },
]

/** Labels: lichaam.voedingSetup.sport.s<value> (+ Sub). */
const SPORT_OPTIES = [0, 1, 3, 5] as const

/** Naam en beschrijving: lichaam.voedingSetup.schema.<id>.naam/beschrijving. */
interface SchemaOptie {
  id: string
  icon: string
  bgGlyph: string
  fitness_doel: FitnessDoel
  dieetvoorkeur?: string
  manueel?: true
  kleur: string
  kleurLight: string
}

const SCHEMA_OPTIES: SchemaOptie[] = [
  {
    id: 'afvallen', icon: '🔥', bgGlyph: '🔥',
    fitness_doel: 'afvallen',
    kleur: 'var(--mf-red)', kleurLight: 'var(--mf-red-light)',
  },
  {
    id: 'spiermassa', icon: '💪', bgGlyph: '💪',
    fitness_doel: 'aankomen',
    kleur: 'var(--mf-purple)', kleurLight: 'var(--mf-purple-light)',
  },
  {
    id: 'cardio', icon: '❤️', bgGlyph: '❤️',
    fitness_doel: 'fitter',
    kleur: 'var(--mf-red)', kleurLight: 'var(--mf-red-light)',
  },
  {
    id: 'onderhouden', icon: '⚖️', bgGlyph: '⚖️',
    fitness_doel: 'onderhouden',
    kleur: 'var(--mf-blue)', kleurLight: 'var(--mf-blue-light)',
  },
  {
    id: 'eiwitrijk', icon: '🥩', bgGlyph: '🥩',
    fitness_doel: 'afvallen', dieetvoorkeur: 'eiwitrijk',
    kleur: 'var(--mf-amber)', kleurLight: 'var(--mf-amber-light)',
  },
  {
    id: 'clean', icon: '🌱', bgGlyph: '🌱',
    fitness_doel: 'fitter', dieetvoorkeur: 'gebalanceerd',
    kleur: 'var(--mf-green)', kleurLight: 'var(--mf-green-light)',
  },
  {
    id: 'manueel', icon: '🎛️', bgGlyph: '🎛️',
    fitness_doel: 'onderhouden', manueel: true,
    kleur: 'var(--text-3)', kleurLight: 'var(--bg-subtle)',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void
  onOverslaan: () => void
}

export default function VoedingSetup({ onComplete, onOverslaan }: Props) {
  const { t } = useVertaling()
  const [stap, setStap]     = useState(1)
  const [laden, setLaden]   = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout]     = useState<string | null>(null)

  // Stap 1
  const [gewicht,     setGewicht]     = useState('')
  const [lengte,      setLengte]      = useState('')
  const [leeftijd,    setLeeftijd]    = useState('')
  const [geslacht,    setGeslacht]    = useState<Geslacht>('man')
  const [doelgewicht, setDoelgewicht] = useState('')

  // Stap 2
  const [werktype,     setWerktype]     = useState('kantoor')
  const [sportPerWeek, setSportPerWeek] = useState(1)

  // Stap 3
  const [gekozenSchema, setGekozenSchema] = useState<string | null>(null)
  const [eiwitPct,      setEiwitPct]      = useState(30)
  const [vetPct,        setVetPct]        = useState(30)
  const koolhPct = Math.max(0, 100 - eiwitPct - vetPct)

  // Prefill vanuit profiel
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLaden(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('gewicht_kg, lengte_cm, streefgewicht_kg, geslacht, geboortedatum, activiteitsniveau')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        if (data.gewicht_kg)       setGewicht(String(data.gewicht_kg))
        if (data.lengte_cm)        setLengte(String(data.lengte_cm))
        if (data.streefgewicht_kg) setDoelgewicht(String(data.streefgewicht_kg))
        if (data.geslacht)         setGeslacht(data.geslacht as Geslacht)
        if (data.geboortedatum) {
          const jaar = new Date(data.geboortedatum).getFullYear()
          setLeeftijd(String(new Date().getFullYear() - jaar))
        }
        const sportMap: Record<string, number> = { sedentair: 0, licht: 1, gemiddeld: 3, actief: 3, zeer_actief: 5 }
        if (data.activiteitsniveau) setSportPerWeek(sportMap[data.activiteitsniveau] ?? 1)
      }
      setLaden(false)
    })
  }, [])

  const activiteitsniveau = useMemo(
    () => bepaalActiviteitsniveau(werktype, sportPerWeek),
    [werktype, sportPerWeek],
  )

  const tdee = useMemo(() => {
    const g = parseFloat(gewicht), l = parseFloat(lengte), a = parseInt(leeftijd)
    if (!g || !l || !a || g <= 0 || l <= 0 || a <= 0) return null
    return berekenTDEEInline(g, l, a, geslacht, activiteitsniveau)
  }, [gewicht, lengte, leeftijd, geslacht, activiteitsniveau])

  const schemaKcal = (_s: SchemaOptie): number | null => tdee

  const schemaMacros = (s: SchemaOptie) => {
    const kcal = schemaKcal(s)
    const g = parseFloat(gewicht)
    if (!kcal) return null
    if (s.manueel) {
      return {
        eiwit: Math.round(kcal * eiwitPct / 100 / 4),
        koolh: Math.round(kcal * koolhPct / 100 / 4),
        vet:   Math.round(kcal * vetPct   / 100 / 9),
      }
    }
    if (!g) return null
    const cfg = DOEL_CONFIG[s.fitness_doel]
    const eiwit = Math.round(g * cfg.eiwit_g_per_kg)
    const vet   = Math.round(g * cfg.vet_g_per_kg)
    return { eiwit, koolh: Math.max(0, Math.round((kcal - eiwit * 4 - vet * 9) / 4)), vet }
  }

  const kanVerder = (): boolean => {
    if (stap === 1) return parseFloat(gewicht) > 0 && parseFloat(lengte) > 0 && parseInt(leeftijd) > 0
    if (stap === 2) return true
    if (stap === 3) return gekozenSchema !== null && (gekozenSchema !== 'manueel' || koolhPct >= 0)
    return false
  }

  const slaOp = async () => {
    const schema = SCHEMA_OPTIES.find(s => s.id === gekozenSchema)
    if (!schema) return
    setOpslaan(true); setFout(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('lichaam.voedingSetup.nietIngelogd'))
      const geboortejaar = new Date().getFullYear() - parseInt(leeftijd)
      const { error } = await supabase.from('profiles').update({
        gewicht_kg:       parseFloat(gewicht),
        lengte_cm:        parseFloat(lengte),
        streefgewicht_kg: parseFloat(doelgewicht) || null,
        geslacht,
        geboortedatum:    `${geboortejaar}-06-15`,
        activiteitsniveau,
        fitness_doel:     schema.fitness_doel,
        dieetvoorkeur:    schema.dieetvoorkeur ?? null,
        calorie_doel:     tdee ?? null,
      }).eq('id', user.id)
      if (error) throw error
      onComplete()
    } catch (e) {
      setFout((e as Error).message || t('lichaam.voeding.opslaanMislukt'))
    } finally {
      setOpslaan(false)
    }
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const numInput = (label: string, value: string, onChange: (v: string) => void, suffix: string, placeholder: string) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && stap === 1 && kanVerder()) setStap(2) }}
          placeholder={placeholder}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 20, fontWeight: 700, color: 'var(--text-1)', minWidth: 0, width: '100%' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600, flexShrink: 0 }}>{suffix}</span>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={onOverslaan}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 14 }}>
            {t('lichaam.voedingSetup.overslaan')} →
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {t('lichaam.voedingSetup.titel')}
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
            {t('lichaam.voedingSetup.intro')}
          </p>
        </div>

        {/* Stap indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: stap === n ? 'var(--mf-green)' : stap > n ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                color: stap === n ? 'var(--bg-app)' : stap > n ? 'var(--mf-green)' : 'var(--text-3)',
              }}>
                {stap > n ? '✓' : n}
              </div>
              {n < 3 && <div style={{ height: 2, width: 36, background: stap > n ? 'var(--mf-green)' : 'var(--border)' }} />}
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
            {t(stap === 1 ? 'lichaam.voedingSetup.stapLichaam' : stap === 2 ? 'lichaam.voedingSetup.stapWerk' : 'lichaam.voedingSetup.stapSchema')}
          </span>
        </div>

        {/* ── Stap 1: Lichaam ── */}
        {stap === 1 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>{t('lichaam.voedingSetup.stapLichaam')}</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>{t('lichaam.voedingSetup.geslachtLabel')}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {GESLACHT_OPTIES.map(g => (
                <button key={g} onClick={() => setGeslacht(g)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: geslacht === g ? 'var(--mf-green)' : 'var(--bg-card)',
                    color: geslacht === g ? 'var(--bg-app)' : 'var(--text-2)',
                    border: `1.5px solid ${geslacht === g ? 'var(--mf-green)' : 'var(--border)'}`,
                  }}>
                  {t(`lichaam.voedingSetup.geslacht.${g}`)}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {numInput(t('lichaam.voedingSetup.gewicht'), gewicht, setGewicht, 'kg', '75')}
              {numInput(t('lichaam.voedingSetup.lengte'), lengte, setLengte, 'cm', '175')}
              {numInput(t('lichaam.voedingSetup.leeftijd'), leeftijd, setLeeftijd, t('lichaam.voedingSetup.jaar'), '30')}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              {t('lichaam.voedingSetup.doelgewicht')} <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>{t('lichaam.voedingSetup.optioneel')}</span>
            </label>
            <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <input
                type="number" value={doelgewicht} onChange={e => setDoelgewicht(e.target.value)}
                placeholder={t('lichaam.voedingSetup.doelPlaceholder')}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 600 }}>kg</span>
            </div>
          </div>
        )}

        {/* ── Stap 2: Werk & sport ── */}
        {stap === 2 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>{t('lichaam.voedingSetup.stapWerk')}</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>{t('lichaam.voedingSetup.overdag')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {WERK_OPTIES.map(w => (
                <button key={w.value} onClick={() => setWerktype(w.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: 'var(--bg-card)', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${werktype === w.value ? 'var(--mf-green)' : 'transparent'}`,
                    boxShadow: 'var(--shadow-xs)', transition: 'border-color 0.12s var(--ease)',
                  }}>
                  <span style={{ fontSize: 22 }}>{w.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: werktype === w.value ? 700 : 500, color: werktype === w.value ? 'var(--mf-green)' : 'var(--text-1)' }}>{t(`lichaam.voedingSetup.werk.${w.value}.label`)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t(`lichaam.voedingSetup.werk.${w.value}.sub`)}</div>
                  </div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>{t('lichaam.voedingSetup.hoeVaak')}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {SPORT_OPTIES.map(s => (
                <button key={s} onClick={() => setSportPerWeek(s)}
                  style={{
                    flex: 1, padding: '12px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: sportPerWeek === s ? 'var(--mf-green)' : 'var(--bg-card)',
                    color: sportPerWeek === s ? 'var(--bg-app)' : 'var(--text-2)',
                    border: `1.5px solid ${sportPerWeek === s ? 'var(--mf-green)' : 'var(--border)'}`,
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t(`lichaam.voedingSetup.sport.s${s}`)}</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{t(`lichaam.voedingSetup.sport.s${s}Sub`)}</div>
                </button>
              ))}
            </div>

            {tdee ? (
              <div style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-green-dark)', marginBottom: 6 }}>
                  {t('lichaam.voedingSetup.tdee')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: 'var(--mf-green)', letterSpacing: '-0.03em' }}>{tdee}</span>
                  <span style={{ fontSize: 15, color: 'var(--mf-green)', fontWeight: 600 }}>{t('lichaam.voedingSetup.kcalDag')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {t('lichaam.voedingSetup.activiteitsniveau')} <strong>{t(`lichaam.activiteit.${activiteitsniveau}.label`)}</strong>
                  <span style={{ color: 'var(--text-3)' }}> · {t(`lichaam.activiteit.${activiteitsniveau}.sub`)}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
                {t('lichaam.voedingSetup.vulStap1')}
              </div>
            )}
          </div>
        )}

        {/* ── Stap 3: Schema kiezen ── */}
        {stap === 3 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t('lichaam.voedingSetup.kiesSchema')}</h2>
            {tdee && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>
                {t('lichaam.voedingSetup.gebaseerdOp')} <strong style={{ color: 'var(--text-2)' }}>{tdee} {t('lichaam.voedingSetup.kcalDag')}</strong>
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SCHEMA_OPTIES.map(s => {
                const kcal   = schemaKcal(s)
                const macros = schemaMacros(s)
                const actief = gekozenSchema === s.id
                const isVolleBreedte = s.manueel

                return (
                  <button
                    key={s.id}
                    onClick={() => setGekozenSchema(s.id)}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      display: 'flex', flexDirection: 'column', gap: 6,
                      padding: isVolleBreedte ? '20px 20px' : '16px 14px',
                      background: actief ? s.kleurLight : 'var(--bg-card)',
                      borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${actief ? s.kleur : 'var(--border)'}`,
                      boxShadow: actief
                        ? `0 0 0 3px color-mix(in srgb, ${s.kleur} 15%, transparent)`
                        : 'var(--shadow-xs)',
                      transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease), box-shadow 0.15s var(--ease)',
                      gridColumn: isVolleBreedte ? 'span 2' : undefined,
                    }}
                  >
                    {/* Transparante achtergrond-watermark */}
                    <span aria-hidden style={{
                      position: 'absolute', right: -6, top: -6,
                      fontSize: 80, lineHeight: 1, opacity: 0.07,
                      pointerEvents: 'none', userSelect: 'none',
                      filter: 'grayscale(0.2)',
                    }}>
                      {s.bgGlyph}
                    </span>

                    {/* Card content */}
                    <div style={{ position: 'relative' }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: actief ? s.kleur : 'var(--text-1)', lineHeight: 1.2, marginBottom: 4 }}>
                        {t(`lichaam.voedingSetup.schema.${s.id}.naam`)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 8 }}>
                        {t(`lichaam.voedingSetup.schema.${s.id}.beschrijving`)}
                      </div>

                      {/* Manuele macro sliders (alleen als geselecteerd) */}
                      {s.manueel && actief && (
                        <div style={{ marginBottom: 12 }}>
                          {[
                            { label: t('lichaam.voeding.macro.eiwit'), pct: eiwitPct, setPct: setEiwitPct, kleur: 'var(--mf-red)', kcalPerG: 4 },
                            { label: t('lichaam.voeding.macro.vet'),   pct: vetPct,   setPct: setVetPct,   kleur: 'var(--mf-purple)', kcalPerG: 9 },
                            { label: t('lichaam.voeding.macro.koolhydraten'), pct: koolhPct, setPct: null,  kleur: 'var(--mf-amber)', kcalPerG: 4 },
                          ].map(m => (
                            <div key={m.label} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{m.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: m.kleur }}>
                                  {m.pct}%
                                  {kcal && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>
                                    {Math.round(kcal * m.pct / 100 / m.kcalPerG)}g
                                  </span>}
                                </span>
                              </div>
                              {m.setPct ? (
                                <input
                                  type="range" min={10} max={60} step={5} value={m.pct}
                                  onChange={e => m.setPct!(parseInt(e.target.value))}
                                  onClick={e => e.stopPropagation()}
                                  style={{ width: '100%', accentColor: m.kleur, cursor: 'pointer' }}
                                />
                              ) : (
                                <div style={{ height: 4, borderRadius: 4, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%', width: '100%', background: m.kleur, borderRadius: 4,
                                    transform: `scaleX(${Math.max(0, m.pct) / 100})`,
                                    transformOrigin: 'left center',
                                    transition: 'transform 0.2s var(--ease)',
                                  }} />
                                </div>
                              )}
                            </div>
                          ))}
                          {koolhPct < 0 && (
                            <p style={{ fontSize: 11, color: 'var(--mf-red)', margin: '4px 0 0', fontWeight: 600 }}>
                              {t('lichaam.voedingSetup.teVeel')}
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '8px 0 0', lineHeight: 1.4 }}>
                            {t('lichaam.voedingSetup.indicatief')}
                          </p>
                        </div>
                      )}

                      {/* Kcal + macro preview */}
                      {kcal && !(s.manueel && !actief) && (
                        <div style={{
                          padding: '8px 12px', borderRadius: 8,
                          background: actief ? `color-mix(in srgb, ${s.kleur} 10%, transparent)` : 'var(--bg-subtle)',
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: actief ? s.kleur : 'var(--text-1)' }}>
                            {kcal} {t('lichaam.voedingSetup.kcalDag')}
                          </div>
                          {macros && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'flex', gap: 10 }}>
                              <span>{t('lichaam.voedingSetup.letterE')} <strong style={{ color: 'var(--mf-red)' }}>{macros.eiwit}g</strong></span>
                              <span>{t('lichaam.voedingSetup.letterK')} <strong style={{ color: 'var(--mf-amber)' }}>{macros.koolh}g</strong></span>
                              <span>{t('lichaam.voedingSetup.letterV')} <strong style={{ color: 'var(--mf-purple)' }}>{macros.vet}g</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manuele kaart: kcal hint als niet geselecteerd */}
                      {s.manueel && !actief && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)' }}>
                          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                            {tdee ? t('lichaam.voedingSetup.manueelHint', { kcal: tdee }) : t('lichaam.voedingSetup.selecteer')}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {fout && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 10, fontSize: 13, color: 'var(--mf-red)' }}>
            {fout}
          </div>
        )}

        {/* Navigatie */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {stap > 1 && (
            <button onClick={() => setStap(s => s - 1)}
              style={{ flex: 1, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600, background: 'var(--bg-subtle)', color: 'var(--text-2)', border: 'none', cursor: 'pointer' }}>
              {t('lichaam.voedingSetup.vorige')}
            </button>
          )}
          {stap < 3 ? (
            <button onClick={() => setStap(s => s + 1)} disabled={!kanVerder()}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600, border: 'none',
                background: kanVerder() ? 'var(--mf-green)' : 'var(--text-4)',
                color: kanVerder() ? 'var(--bg-app)' : 'var(--text-3)',
                cursor: kanVerder() ? 'pointer' : 'not-allowed',
              }}>
              {t('lichaam.voedingSetup.volgende')}
            </button>
          ) : (
            <button onClick={slaOp} disabled={!kanVerder() || opslaan}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
                background: kanVerder() ? 'var(--mf-green)' : 'var(--text-4)',
                color: kanVerder() ? 'var(--bg-app)' : 'var(--text-3)',
                cursor: kanVerder() ? 'pointer' : 'not-allowed',
              }}>
              {opslaan ? t('lichaam.voeding.opslaanBezig') : `✅ ${t('lichaam.voedingSetup.start')}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
