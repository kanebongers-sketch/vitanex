'use client'

import { Plus, X } from 'lucide-react'

// Een lijst losse zinnen (opstelling, stappen) met toevoegen en weghalen.

interface LijstVeldProps {
  titel: string
  waarden: string[]
  max: number
  maxTekens: number
  genummerd?: boolean
  onWijzig: (waarden: string[]) => void
}

export function LijstVeld({ titel, waarden, max, maxTekens, genummerd, onWijzig }: LijstVeldProps) {
  return (
    <fieldset className="club-coach-editor-groep">
      <legend className="club-coach-kop">{titel}</legend>
      {waarden.map((w, i) => (
        <div key={i} className="club-coach-editor-zin">
          {genummerd && <span className="club-coach-editor-nummer" aria-hidden>{i + 1}</span>}
          <textarea
            className="club-invoer"
            rows={2}
            aria-label={`${titel} ${i + 1}`}
            value={w}
            maxLength={maxTekens}
            onChange={(e) => onWijzig(waarden.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`${titel} ${i + 1} weghalen`} onClick={() => onWijzig(waarden.filter((_, j) => j !== i))}>
            <X aria-hidden size={15} />
          </button>
        </div>
      ))}
      {waarden.length < max && (
        <button type="button" className="club-knop club-knop--klein" onClick={() => onWijzig([...waarden, ''])}>
          <Plus aria-hidden size={15} /> Regel toevoegen
        </button>
      )}
    </fieldset>
  )
}
