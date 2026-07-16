'use client'

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import {
  isTrainingSoort,
  SOORT_LABEL,
  TRAINING_SOORTEN,
  type Rpe,
  type TrainingSoort,
} from '@/lib/lifeos/training/training'
import { RpeKiezer } from './RpeKiezer'

// Loggen in twee tikken: soort kiezen, loggen. De rest is optioneel — en dat is
// het ontwerp, niet de luie versie ervan. Wie zijn duur niet weet, hoort hem
// niet te hoeven verzinnen om zijn training kwijt te kunnen.
//
// Alleen `soort` is verplicht: zonder soort is er niets te loggen. Duur en RPE
// mogen leeg blijven; ze gaan dan als `null` mee — "niet gemeten", niet 0.

export interface LogInvoer {
  soort: TrainingSoort
  duurMinuten: number | null
  rpe: Rpe | null
}

interface LogFormulierProps {
  onLog: (invoer: LogInvoer) => void
  bezig: boolean
}

export function LogFormulier({ onLog, bezig }: LogFormulierProps) {
  const [soort, setSoort] = useState<TrainingSoort>('kracht')
  const [duur, setDuur] = useState('')
  const [rpe, setRpe] = useState<Rpe | null>(null)

  const duurGetal = leesDuur(duur)
  const duurOnzin = duur.trim().length > 0 && duurGetal === null

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig || duurOnzin) return
    onLog({ soort, duurMinuten: duurGetal, rpe })
    // De soort blijft staan: je logt meestal hetzelfde soort opnieuw. De
    // cijfers niet — die horen bij die ene sessie en mogen nooit per ongeluk
    // meeliften naar de volgende.
    setDuur('')
    setRpe(null)
  }

  return (
    <form onSubmit={verstuur} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 6, flex: '1 1 140px', minWidth: 0 }}>
          <label htmlFor="training-soort" style={LABEL}>
            Soort
          </label>
          <select
            id="training-soort"
            value={soort}
            // Narrowen, niet casten — ook al vullen we de opties zelf. Een cast
            // hier zou stil blijven werken als het type ooit uitbreidt en de
            // opties niet meeveranderen.
            onChange={(e) => {
              if (isTrainingSoort(e.target.value)) setSoort(e.target.value)
            }}
            style={INVOER}
          >
            {TRAINING_SOORTEN.map((s) => (
              <option key={s} value={s}>
                {SOORT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6, flex: '0 1 110px', minWidth: 0 }}>
          <label htmlFor="training-duur" style={LABEL}>
            Duur (min)
          </label>
          <input
            id="training-duur"
            type="text"
            inputMode="numeric"
            value={duur}
            onChange={(e) => setDuur(e.target.value)}
            placeholder="Mag leeg"
            aria-invalid={duurOnzin}
            aria-describedby={duurOnzin ? 'training-duur-fout' : undefined}
            style={{
              ...INVOER,
              fontFamily: 'var(--font-mono)',
              borderColor: duurOnzin ? 'var(--status-laag)' : 'var(--line)',
            }}
          />
        </div>
      </div>

      {duurOnzin ? (
        <p id="training-duur-fout" style={{ margin: 0, fontSize: 12, color: 'var(--status-laag)' }}>
          Duur is een heel aantal minuten tussen 1 en 1440, of leeg.
        </p>
      ) : null}

      <RpeKiezer legenda="RPE — hoe zwaar voelde het? (optioneel)" waarde={rpe} onKies={setRpe} />

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Knop type="submit" variant="primair" disabled={bezig || duurOnzin}>
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
          Loggen
        </Knop>
      </div>
    </form>
  )
}

/**
 * Leest het duurveld. Leeg → null ("niet gemeten"), onzin → null én
 * `duurOnzin` hierboven, zodat een typfout een zichtbare fout wordt in plaats
 * van een stil weggevallen getal.
 */
function leesDuur(ruw: string): number | null {
  const tekst = ruw.trim()
  if (tekst.length === 0) return null
  if (!/^\d{1,4}$/.test(tekst)) return null
  const getal = Number(tekst)
  return getal >= 1 && getal <= 1440 ? getal : null
}

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const INVOER: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '8px 11px',
  borderRadius: 9,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}
