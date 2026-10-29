'use client'

import { useId } from 'react'
import { GRENS_EIWIT, GRENS_KCAL, GRENS_KH, GRENS_VET } from '@/lib/club/voeding/model'
import { afwijkingTekst } from '@/lib/club/voeding/rekenhulp'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

// De vier dagdoelen als invoer, met een hint als de macro's niet optellen tot de kcal.

export interface DoelTekst {
  kcal: string
  eiwitG: string
  koolhydratenG: string
  vetG: string
}

interface DoelenVeldenProps {
  waarde: DoelTekst
  onWijzig: (waarde: DoelTekst) => void
  /** In een sjabloon mogen de dagdoelen leeg blijven. */
  optioneel?: boolean
}

const VELDEN = [
  { veld: 'kcal', macro: 'kcal', eenheid: 'kcal', grens: GRENS_KCAL },
  { veld: 'eiwitG', macro: 'eiwit', eenheid: 'g', grens: GRENS_EIWIT },
  { veld: 'koolhydratenG', macro: 'koolhydraten', eenheid: 'g', grens: GRENS_KH },
  { veld: 'vetG', macro: 'vet', eenheid: 'g', grens: GRENS_VET },
] as const

function getal(s: string): number {
  return s.trim() === '' ? Number.NaN : Number(s)
}

export function DoelenVelden({ waarde, onWijzig, optioneel }: DoelenVeldenProps) {
  const id = useId()
  const taal = useTaal()
  const t = useTekst(VOEDING)
  const compleet = VELDEN.every((v) => Number.isFinite(getal(waarde[v.veld])))
  const hint = compleet ? afwijkingTekst({ kcal: getal(waarde.kcal), eiwitG: getal(waarde.eiwitG), koolhydratenG: getal(waarde.koolhydratenG), vetG: getal(waarde.vetG) }, taal) : null
  return (
    <div className="club-voeding-blok">
      <div className="club-voeding-velden">
        {VELDEN.map((v) => (
          <label key={v.veld} className="club-veld">
            <span>{t.macro[v.macro]}</span>
            <span className="club-voeding-eenheid">
              <input
                className="club-invoer"
                type="number"
                inputMode="numeric"
                required={!optioneel}
                min={v.grens.min}
                max={v.grens.max}
                step={1}
                value={waarde[v.veld]}
                aria-describedby={hint ? `${id}-hint` : undefined}
                onChange={(e) => onWijzig({ ...waarde, [v.veld]: e.target.value })}
              />
              <em aria-hidden>{v.eenheid}</em>
            </span>
          </label>
        ))}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="club-voeding-hint club-voeding-hint--let-op">
          {hint} {t.doelen.rekenhint}
        </p>
      )}
      {optioneel && <p className="club-voeding-hint">{t.doelen.optioneel}</p>}
    </div>
  )
}
