'use client'

import { useId, useState, type CSSProperties, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { huidigUurNL } from '@/lib/utils/date-nl'

// Presentationeel: één snelle maaltijd toevoegen. Het weet niet waar de maaltijd
// heen gaat of hoe hij wordt opgeslagen — de container doet de POST en zegt met
// een boolean of het lukte. Alleen dán legen we de velden; mislukt het, dan houdt
// de gebruiker zijn ingevoerde maaltijd in plaats van 'm kwijt te zijn.

export interface MaaltijdInvoer {
  maaltijd_type: string
  omschrijving: string
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
}

interface MaaltijdKeuze {
  key: string
  label: string
}

// Bewust dezelfde sleutels als de voeding-pagina, zodat een cockpit-maaltijd
// daar onder het juiste moment verschijnt.
const MAALTIJDEN: readonly MaaltijdKeuze[] = [
  { key: 'ontbijt', label: 'Ontbijt' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'diner', label: 'Diner' },
  { key: 'avondsnack', label: 'Snack' },
]

/** Kiest een zinnig standaard-moment op basis van het uur (NL-tijd). */
function standaardMaaltijd(): string {
  const uur = huidigUurNL()
  if (uur < 11) return 'ontbijt'
  if (uur < 15) return 'lunch'
  if (uur < 21) return 'diner'
  return 'avondsnack'
}

/** Leeg veld → null; anders een eindig, niet-negatief getal (of null). */
function parseGetal(waarde: string): number | null {
  if (waarde.trim() === '') return null
  const n = Number(waarde)
  return Number.isFinite(n) && n >= 0 ? n : null
}

interface VoedingToevoegenProps {
  bezig: boolean
  onToevoeg: (invoer: MaaltijdInvoer) => Promise<boolean>
}

export function VoedingToevoegen({ bezig, onToevoeg }: VoedingToevoegenProps) {
  const idBasis = useId()
  const [maaltijdType, setMaaltijdType] = useState(standaardMaaltijd)
  const [omschrijving, setOmschrijving] = useState('')
  const [kcal, setKcal] = useState('')
  const [eiwit, setEiwit] = useState('')
  const [koolhydraten, setKoolhydraten] = useState('')
  const [vet, setVet] = useState('')

  const kanVerzenden = omschrijving.trim().length > 0 && !bezig

  const versturen = async (e: FormEvent) => {
    e.preventDefault()
    if (!kanVerzenden) return

    const gelukt = await onToevoeg({
      maaltijd_type: maaltijdType,
      omschrijving: omschrijving.trim(),
      calorieen: parseGetal(kcal),
      eiwitten_g: parseGetal(eiwit),
      koolhydraten_g: parseGetal(koolhydraten),
      vetten_g: parseGetal(vet),
    })

    if (gelukt) {
      setOmschrijving('')
      setKcal('')
      setEiwit('')
      setKoolhydraten('')
      setVet('')
    }
  }

  return (
    <form onSubmit={(e) => void versturen(e)} style={{ display: 'grid', gap: 10 }}>
      <fieldset style={FIELDSET}>
        <legend style={VERBORGEN}>Moment van de dag</legend>
        <div role="group" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MAALTIJDEN.map(({ key, label }) => {
            const actief = key === maaltijdType
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMaaltijdType(key)}
                aria-pressed={actief}
                style={{
                  ...SEGMENT,
                  borderColor: actief ? 'var(--brand)' : 'var(--line-strong)',
                  background: actief ? 'var(--brand-soft)' : 'transparent',
                  color: actief ? 'var(--brand)' : 'var(--text-3)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${idBasis}-oms`} style={VERBORGEN}>
          Omschrijving van de maaltijd
        </label>
        <input
          id={`${idBasis}-oms`}
          value={omschrijving}
          onChange={(e) => setOmschrijving(e.target.value)}
          placeholder="Wat heb je gegeten?"
          maxLength={200}
          disabled={bezig}
          style={INVOER}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        <GetalVeld id={`${idBasis}-kcal`} label="Calorieën (kcal)" kort="kcal" waarde={kcal} onWijzig={setKcal} bezig={bezig} />
        <GetalVeld id={`${idBasis}-eiwit`} label="Eiwitten (gram)" kort="eiwit" waarde={eiwit} onWijzig={setEiwit} bezig={bezig} />
        <GetalVeld id={`${idBasis}-koolh`} label="Koolhydraten (gram)" kort="koolh" waarde={koolhydraten} onWijzig={setKoolhydraten} bezig={bezig} />
        <GetalVeld id={`${idBasis}-vet`} label="Vetten (gram)" kort="vet" waarde={vet} onWijzig={setVet} bezig={bezig} />
      </div>

      <Knop type="submit" variant="primair" disabled={!kanVerzenden}>
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        Maaltijd loggen
      </Knop>
    </form>
  )
}

interface GetalVeldProps {
  id: string
  label: string
  kort: string
  waarde: string
  onWijzig: (v: string) => void
  bezig: boolean
}

function GetalVeld({ id, label, kort, waarde, onWijzig, bezig }: GetalVeldProps) {
  return (
    <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 10, color: 'var(--text-4)', textAlign: 'center' }}>
        {kort}
      </label>
      <label htmlFor={id} style={VERBORGEN}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={9999}
        value={waarde}
        onChange={(e) => onWijzig(e.target.value)}
        placeholder="—"
        disabled={bezig}
        style={{ ...INVOER, textAlign: 'center', padding: '7px 6px' }}
      />
    </div>
  )
}

const FIELDSET: CSSProperties = { border: 0, padding: 0, margin: 0, minWidth: 0 }

const SEGMENT: CSSProperties = {
  padding: '5px 11px',
  borderRadius: 999,
  border: '1px solid var(--line-strong)',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const INVOER: CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
