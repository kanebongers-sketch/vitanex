'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import {
  ACTIVITEIT_CONFIG,
  DOEL_CONFIG,
  type Activiteitsniveau,
  type FitnessDoel,
  type Geslacht,
} from '@/lib/gezondheid-berekeningen'

// ── Berekeningen (inline — client-only, geen geboortedatum nodig) ─────────────

function berekenBMRInline(gewicht: number, lengte: number, leeftijd: number, geslacht: string): number {
  const basis = 10 * gewicht + 6.25 * lengte - 5 * leeftijd
  const offset = geslacht === 'man' ? 5 : geslacht === 'vrouw' ? -161 : -78
  return Math.round(basis + offset)
}

function berekenTDEEInline(gewicht: number, lengte: number, leeftijd: number, geslacht: string, activiteit: Activiteitsniveau): number {
  const bmr = berekenBMRInline(gewicht, lengte, leeftijd, geslacht)
  return Math.round(bmr * ACTIVITEIT_CONFIG[activiteit].multiplier)
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

const GESLACHT_OPTIES: { value: Geslacht; label: string }[] = [
  { value: 'man',   label: 'Man' },
  { value: 'vrouw', label: 'Vrouw' },
  { value: 'anders', label: 'Anders' },
]

const WERK_OPTIES = [
  { value: 'kantoor', icon: '💼', label: 'Kantoor / zittend', sub: 'Bureau, auto, weinig bewegen' },
  { value: 'licht',   icon: '🚶', label: 'Licht actief', sub: 'Leraar, winkelier, verpleging' },
  { value: 'fysiek',  icon: '🏗️', label: 'Fysiek werk', sub: 'Bouw, horeca, bezorger' },
]

const SPORT_OPTIES = [
  { value: 0, label: '0×',   sub: 'Niet / nauwelijks' },
  { value: 1, label: '1–2×', sub: 'Per week' },
  { value: 3, label: '3–4×', sub: 'Per week' },
  { value: 5, label: '5+×',  sub: 'Per week' },
]

interface SchemaOptie {
  id: string
  icon: string
  naam: string
  sub: string
  fitness_doel: FitnessDoel
  dieetvoorkeur?: string
}

const SCHEMA_OPTIES: SchemaOptie[] = [
  { id: 'afvallen',   icon: '🔥', naam: 'Vet verbranden',      sub: 'Calorietekort + hoog eiwit',  fitness_doel: 'afvallen' },
  { id: 'spiermassa', icon: '💪', naam: 'Spiermassa opbouwen', sub: 'Surplus + maximaal eiwit',    fitness_doel: 'aankomen' },
  { id: 'cardio',     icon: '❤️', naam: 'Cardio & Conditie',   sub: 'Energie voor uithoudingssport', fitness_doel: 'fitter' },
  { id: 'onderhouden',icon: '⚖️', naam: 'Gewicht onderhouden', sub: 'Caloriebalans, stabiel blijven', fitness_doel: 'onderhouden' },
  { id: 'eiwitrijk',  icon: '🥩', naam: 'Eiwitrijk',           sub: 'Hoog eiwit, laag koolhydraat', fitness_doel: 'afvallen', dieetvoorkeur: 'eiwitrijk' },
  { id: 'clean',      icon: '🌱', naam: 'Clean Eating',        sub: 'Gevarieerd & onbewerkt',       fitness_doel: 'fitter',   dieetvoorkeur: 'gebalanceerd' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void
  onOverslaan: () => void
}

export default function VoedingSetup({ onComplete, onOverslaan }: Props) {
  const [stap, setStap] = useState(1)
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  // Stap 1
  const [gewicht,    setGewicht]    = useState('')
  const [lengte,     setLengte]     = useState('')
  const [leeftijd,   setLeeftijd]   = useState('')
  const [geslacht,   setGeslacht]   = useState<Geslacht>('man')
  const [doelgewicht, setDoelgewicht] = useState('')

  // Stap 2
  const [werktype,    setWerktype]    = useState('kantoor')
  const [sportPerWeek, setSportPerWeek] = useState(1)

  // Stap 3
  const [gekozenSchema, setGekozenSchema] = useState<string | null>(null)

  // Prefill vanuit bestaand profiel
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLaden(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('gewicht_kg, lengte_cm, streefgewicht_kg, geslacht, geboortedatum, activiteitsniveau')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        if (data.gewicht_kg)    setGewicht(String(data.gewicht_kg))
        if (data.lengte_cm)     setLengte(String(data.lengte_cm))
        if (data.streefgewicht_kg) setDoelgewicht(String(data.streefgewicht_kg))
        if (data.geslacht)      setGeslacht(data.geslacht as Geslacht)
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

  const schemaKcal = (s: SchemaOptie): number | null =>
    tdee ? tdee + DOEL_CONFIG[s.fitness_doel].calorie_aanpassing : null

  const schemaMacros = (s: SchemaOptie) => {
    const kcal = schemaKcal(s)
    const g = parseFloat(gewicht)
    if (!kcal || !g) return null
    const cfg = DOEL_CONFIG[s.fitness_doel]
    const eiwit = Math.round(g * cfg.eiwit_g_per_kg)
    const vet   = Math.round(g * cfg.vet_g_per_kg)
    const koolh = Math.max(0, Math.round((kcal - eiwit * 4 - vet * 9) / 4))
    return { eiwit, vet, koolh }
  }

  const kanVerder = (): boolean => {
    if (stap === 1) return parseFloat(gewicht) > 0 && parseFloat(lengte) > 0 && parseInt(leeftijd) > 0
    if (stap === 2) return true
    if (stap === 3) return gekozenSchema !== null
    return false
  }

  const slaOp = async () => {
    const schema = SCHEMA_OPTIES.find(s => s.id === gekozenSchema)
    if (!schema) return
    setOpslaan(true); setFout(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

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
      }).eq('id', user.id)
      if (error) throw error
      onComplete()
    } catch (e) {
      setFout((e as Error).message || 'Opslaan mislukt')
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

  const numInput = (
    label: string, value: string, onChange: (v: string) => void, suffix: string, placeholder: string,
  ) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={onOverslaan}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 14 }}>
            Sla over →
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Voeding instellen
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
            Stel in voor een persoonlijk calorie- en macrodoel
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
                color: stap === n ? '#fff' : stap > n ? 'var(--mf-green)' : 'var(--text-3)',
              }}>
                {stap > n ? '✓' : n}
              </div>
              {n < 3 && <div style={{ height: 2, width: 36, background: stap > n ? 'var(--mf-green)' : 'var(--border)' }} />}
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
            {stap === 1 ? 'Jouw lichaam' : stap === 2 ? 'Werk & sport' : 'Kies schema'}
          </span>
        </div>

        {/* ── Stap 1: Lichaam ── */}
        {stap === 1 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>Jouw lichaam</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Geslacht</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {GESLACHT_OPTIES.map(g => (
                <button key={g.value} onClick={() => setGeslacht(g.value)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: geslacht === g.value ? 'var(--mf-green)' : 'var(--bg-card, #fff)',
                    color: geslacht === g.value ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${geslacht === g.value ? 'var(--mf-green)' : 'var(--border)'}`,
                  }}>
                  {g.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {numInput('Gewicht', gewicht, setGewicht, 'kg', '75')}
              {numInput('Lengte', lengte, setLengte, 'cm', '175')}
              {numInput('Leeftijd', leeftijd, setLeeftijd, 'jaar', '30')}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              Doelgewicht <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optioneel)</span>
            </label>
            <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <input
                type="number" value={doelgewicht} onChange={e => setDoelgewicht(e.target.value)}
                placeholder="Bijv. 70"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 600 }}>kg</span>
            </div>
          </div>
        )}

        {/* ── Stap 2: Werk & sport ── */}
        {stap === 2 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>Werk & sport</h2>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Wat doe je overdag?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {WERK_OPTIES.map(w => (
                <button key={w.value} onClick={() => setWerktype(w.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: 'var(--bg-card, #fff)', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${werktype === w.value ? 'var(--mf-green)' : 'transparent'}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'border-color 0.12s',
                  }}>
                  <span style={{ fontSize: 22 }}>{w.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: werktype === w.value ? 700 : 500, color: werktype === w.value ? 'var(--mf-green)' : 'var(--text-1)' }}>{w.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Hoe vaak sport je per week?</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {SPORT_OPTIES.map(s => (
                <button key={s.value} onClick={() => setSportPerWeek(s.value)}
                  style={{
                    flex: 1, padding: '12px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: sportPerWeek === s.value ? 'var(--mf-green)' : 'var(--bg-card, #fff)',
                    color: sportPerWeek === s.value ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${sportPerWeek === s.value ? 'var(--mf-green)' : 'var(--border)'}`,
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{s.sub}</div>
                </button>
              ))}
            </div>

            {/* Live TDEE preview */}
            {tdee ? (
              <div style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-green-dark)', marginBottom: 6 }}>
                  Jouw dagelijkse energiebehoefte (TDEE)
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--mf-green)', letterSpacing: '-0.03em' }}>{tdee}</span>
                  <span style={{ fontSize: 15, color: 'var(--mf-green)', fontWeight: 600 }}>kcal/dag</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Activiteitsniveau: <strong>{ACTIVITEIT_CONFIG[activiteitsniveau].label}</strong>
                  <span style={{ color: 'var(--text-3)' }}> · {ACTIVITEIT_CONFIG[activiteitsniveau].sub}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
                Vul stap 1 volledig in om je TDEE te berekenen
              </div>
            )}
          </div>
        )}

        {/* ── Stap 3: Schema kiezen ── */}
        {stap === 3 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Kies je voedingsschema</h2>
            {tdee && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>
                Gebaseerd op jouw behoefte van <strong style={{ color: 'var(--text-2)' }}>{tdee} kcal/dag</strong>
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SCHEMA_OPTIES.map(s => {
                const kcal   = schemaKcal(s)
                const macros = schemaMacros(s)
                const actief = gekozenSchema === s.id
                const aanp   = DOEL_CONFIG[s.fitness_doel].calorie_aanpassing
                return (
                  <button key={s.id} onClick={() => setGekozenSchema(s.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 14px',
                      background: actief ? 'var(--mf-green-light)' : 'var(--bg-card, #fff)',
                      borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${actief ? 'var(--mf-green)' : 'var(--border)'}`,
                      boxShadow: actief ? '0 0 0 3px rgba(29,158,117,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 26 }}>{s.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: actief ? 'var(--mf-green-dark)' : 'var(--text-1)', lineHeight: 1.2 }}>{s.naam}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{s.sub}</div>
                    {kcal && (
                      <div style={{
                        marginTop: 4, padding: '6px 10px', borderRadius: 8,
                        background: actief ? 'rgba(29,158,117,0.15)' : 'var(--bg-subtle)',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: actief ? 'var(--mf-green)' : 'var(--text-1)' }}>
                          {kcal} kcal
                          {aanp !== 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 3, fontWeight: 400 }}>
                              ({aanp > 0 ? '+' : ''}{aanp})
                            </span>
                          )}
                        </div>
                        {macros && (
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                            E {macros.eiwit}g · K {macros.koolh}g · V {macros.vet}g
                          </div>
                        )}
                      </div>
                    )}
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
              Vorige
            </button>
          )}
          {stap < 3 ? (
            <button onClick={() => setStap(s => s + 1)} disabled={!kanVerder()}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 600, border: 'none',
                background: kanVerder() ? 'var(--mf-green)' : 'var(--text-4)',
                color: kanVerder() ? '#fff' : 'var(--text-3)',
                cursor: kanVerder() ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
              }}>
              Volgende
            </button>
          ) : (
            <button onClick={slaOp} disabled={!kanVerder() || opslaan}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
                background: kanVerder() ? 'var(--mf-green)' : 'var(--text-4)',
                color: kanVerder() ? '#fff' : 'var(--text-3)',
                cursor: kanVerder() ? 'pointer' : 'not-allowed',
              }}>
              {opslaan ? 'Opslaan...' : '✅ Start met tracken'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
