'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import {
  ACTIVITEIT_CONFIG,
  DOEL_CONFIG,
  effectieveDoelen,
  type Activiteitsniveau,
  type FitnessDoel,
} from '@/lib/gezondheid-berekeningen'

interface Props {
  userId: string
}

interface Melding {
  type: 'success' | 'error'
  tekst: string
}

/** Parseert een tekstveld naar een positief geheel getal, of null bij leeg/ongeldig. */
function parseGetalOfNull(waarde: string): number | null {
  const opgeschoond = waarde.trim()
  if (opgeschoond === '') return null
  const n = Number(opgeschoond)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

/** Parseert een gewicht/lengte-tekstveld naar een positief getal, of null. */
function parseDecimaalOfNull(waarde: string): number | null {
  const opgeschoond = waarde.trim().replace(',', '.')
  if (opgeschoond === '') return null
  const n = Number(opgeschoond)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

const VELD_STIJL: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '0.7rem 0.9rem',
  fontSize: '0.875rem',
  outline: 'none',
  background: 'var(--bg-app)',
  color: 'var(--text-1)',
}

const SECTIE_STIJL: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
}

const LABEL_STIJL: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--text-3)',
  display: 'block',
  marginBottom: 6,
}

export default function GezondheidDoelen({ userId }: Props) {
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding | null>(null)

  // Profielvelden (tekst voor invoer, null-baar in DB)
  const [gewicht, setGewicht] = useState('')
  const [lengte, setLengte] = useState('')
  const [geboortedatum, setGeboortedatum] = useState('')
  const [activiteit, setActiviteit] = useState<Activiteitsniveau | ''>('')
  const [fitnessDoel, setFitnessDoel] = useState<FitnessDoel | ''>('')
  const [streefgewicht, setStreefgewicht] = useState('')

  // Overschrijfbare doelen — leeg = automatisch (NULL in DB)
  const [waterDoel, setWaterDoel] = useState('')
  const [stappenDoel, setStappenDoel] = useState('')
  const [calorieDoel, setCalorieDoel] = useState('')

  useEffect(() => {
    async function laad() {
      const { data } = await supabase
        .from('profiles')
        .select('gewicht_kg, lengte_cm, geboortedatum, activiteitsniveau, fitness_doel, streefgewicht_kg, water_doel_ml, stappen_doel, calorie_doel')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setGewicht(data.gewicht_kg != null ? String(data.gewicht_kg) : '')
        setLengte(data.lengte_cm != null ? String(data.lengte_cm) : '')
        setGeboortedatum(data.geboortedatum ?? '')
        setActiviteit((data.activiteitsniveau as Activiteitsniveau) ?? '')
        setFitnessDoel((data.fitness_doel as FitnessDoel) ?? '')
        setStreefgewicht(data.streefgewicht_kg != null ? String(data.streefgewicht_kg) : '')
        setWaterDoel(data.water_doel_ml != null ? String(data.water_doel_ml) : '')
        setStappenDoel(data.stappen_doel != null ? String(data.stappen_doel) : '')
        setCalorieDoel(data.calorie_doel != null ? String(data.calorie_doel) : '')
      }
      setLaden(false)
    }
    laad()
  }, [userId])

  // Live preview van de automatisch berekende doelen op basis van de huidige invoer.
  const autoPreview = effectieveDoelen({
    gewicht_kg: parseDecimaalOfNull(gewicht),
    lengte_cm: parseDecimaalOfNull(lengte),
    geboortedatum: geboortedatum.trim() === '' ? null : geboortedatum,
    geslacht: null,
    activiteitsniveau: activiteit === '' ? null : activiteit,
    fitness_doel: fitnessDoel === '' ? null : fitnessDoel,
    // Geen overschrijvingen meegeven → toont de pure auto-waarde.
    water_doel_ml: null,
    stappen_doel: null,
    calorie_doel: null,
  })

  async function opslaan() {
    setBezig(true)
    setMelding(null)

    const update = {
      gewicht_kg: parseDecimaalOfNull(gewicht),
      lengte_cm: parseDecimaalOfNull(lengte),
      activiteitsniveau: activiteit === '' ? null : activiteit,
      fitness_doel: fitnessDoel === '' ? null : fitnessDoel,
      streefgewicht_kg: parseDecimaalOfNull(streefgewicht),
      water_doel_ml: parseGetalOfNull(waterDoel),
      stappen_doel: parseGetalOfNull(stappenDoel),
      calorie_doel: parseGetalOfNull(calorieDoel),
    }

    const { error } = await supabase.from('profiles').update(update).eq('id', userId)

    if (error) {
      setMelding({ type: 'error', tekst: 'Opslaan mislukt. Probeer opnieuw.' })
    } else {
      setMelding({ type: 'success', tekst: 'Gezondheid & doelen bijgewerkt.' })
      setTimeout(() => setMelding(null), 3000)
    }
    setBezig(false)
  }

  if (laden) {
    return (
      <section className="rounded-2xl p-6" style={SECTIE_STIJL}>
        <div className="flex justify-center py-6">
          <div className="mf-spinner" />
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Profiel & lichaam */}
      <section className="rounded-2xl p-6" style={SECTIE_STIJL}>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Gezondheidsprofiel</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
          Deze gegevens bepalen automatisch je water-, stappen- en calorie-doelen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label style={LABEL_STIJL}>Gewicht (kg)</label>
            <input type="number" inputMode="decimal" min={1} value={gewicht}
              onChange={e => setGewicht(e.target.value)} placeholder="bijv. 75" style={VELD_STIJL} />
          </div>
          <div>
            <label style={LABEL_STIJL}>Lengte (cm)</label>
            <input type="number" inputMode="decimal" min={1} value={lengte}
              onChange={e => setLengte(e.target.value)} placeholder="bijv. 178" style={VELD_STIJL} />
          </div>
          <div>
            <label style={LABEL_STIJL}>Streefgewicht (kg)</label>
            <input type="number" inputMode="decimal" min={1} value={streefgewicht}
              onChange={e => setStreefgewicht(e.target.value)} placeholder="optioneel" style={VELD_STIJL} />
          </div>
          {geboortedatum && (
            <div>
              <label style={LABEL_STIJL}>Geboortedatum</label>
              <input type="text" value={geboortedatum} disabled style={{ ...VELD_STIJL, opacity: 0.6 }} />
            </div>
          )}
        </div>

        {/* Activiteitsniveau */}
        <div className="mb-5">
          <label style={LABEL_STIJL}>Activiteitsniveau</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(ACTIVITEIT_CONFIG) as Activiteitsniveau[]).map(niveau => {
              const cfg = ACTIVITEIT_CONFIG[niveau]
              const actief = activiteit === niveau
              return (
                <button key={niveau} type="button" onClick={() => setActiviteit(niveau)}
                  className="text-left rounded-xl border p-3 transition"
                  style={{
                    borderColor: actief ? 'var(--mf-green)' : 'var(--border)',
                    background: actief ? 'var(--mf-green-light)' : 'transparent',
                  }}>
                  <p className="text-sm font-medium" style={{ color: actief ? 'var(--mf-green-dark)' : 'var(--text-1)' }}>{cfg.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{cfg.sub}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fitnessdoel */}
        <div>
          <label style={LABEL_STIJL}>Fitnessdoel</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(DOEL_CONFIG) as FitnessDoel[]).map(d => {
              const cfg = DOEL_CONFIG[d]
              const actief = fitnessDoel === d
              return (
                <button key={d} type="button" onClick={() => setFitnessDoel(d)}
                  className="text-left rounded-xl border p-3 transition"
                  style={{
                    borderColor: actief ? cfg.kleur : 'var(--border)',
                    background: actief ? 'var(--bg-subtle)' : 'transparent',
                  }}>
                  <p className="text-sm font-medium" style={{ color: actief ? cfg.kleur : 'var(--text-1)' }}>{cfg.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{cfg.sub}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Doelen overschrijven */}
      <section className="rounded-2xl p-6" style={SECTIE_STIJL}>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Dagdoelen</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
          Laat leeg om automatisch te berekenen, of vul een eigen waarde in om te overschrijven.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label style={LABEL_STIJL}>Waterdoel (ml)</label>
            <input type="number" inputMode="numeric" min={1} value={waterDoel}
              onChange={e => setWaterDoel(e.target.value)}
              placeholder={`Auto: ${autoPreview.water_doel_ml} ml`} style={VELD_STIJL} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
              {waterDoel.trim() === ''
                ? `Automatisch: ${autoPreview.water_doel_ml} ml per dag`
                : 'Handmatig ingesteld'}
            </p>
          </div>

          <div>
            <label style={LABEL_STIJL}>Stappendoel</label>
            <input type="number" inputMode="numeric" min={1} value={stappenDoel}
              onChange={e => setStappenDoel(e.target.value)}
              placeholder={`Auto: ${autoPreview.stappen_doel}`} style={VELD_STIJL} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
              {stappenDoel.trim() === ''
                ? `Automatisch: ${autoPreview.stappen_doel.toLocaleString('nl-NL')} stappen per dag`
                : 'Handmatig ingesteld'}
            </p>
          </div>

          <div>
            <label style={LABEL_STIJL}>Caloriedoel (kcal)</label>
            <input type="number" inputMode="numeric" min={1} value={calorieDoel}
              onChange={e => setCalorieDoel(e.target.value)}
              placeholder={autoPreview.calorie_doel != null ? `Auto: ${autoPreview.calorie_doel} kcal` : 'Vul gewicht & lengte in voor auto'}
              style={VELD_STIJL} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
              {calorieDoel.trim() !== ''
                ? 'Handmatig ingesteld'
                : autoPreview.calorie_doel != null
                  ? `Automatisch: ${autoPreview.calorie_doel.toLocaleString('nl-NL')} kcal per dag`
                  : 'Vul gewicht, lengte en geboortedatum in om automatisch te berekenen'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button variant="primary" onClick={opslaan} loading={bezig}>
            {bezig ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </Button>
          {melding && (
            <p className="text-sm" style={{ color: melding.type === 'success' ? 'var(--mf-green-dark)' : 'var(--mf-red)' }}>
              {melding.tekst}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
