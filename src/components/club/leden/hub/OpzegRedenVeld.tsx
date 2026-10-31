'use client'

import { useId } from 'react'
import { OPZEG_REDENEN, TOELICHTING_MAX, isOpzegReden, zonderToelichting, type OpzegReden } from '@/lib/club/behoud/opzegreden'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'

// De reden bij opzeggen of stoppen: verplicht uit een vaste lijst, met een
// optionele toelichting. Bij gezondheid alleen de categorie (geen tekstveld).

interface OpzegRedenVeldProps {
  reden: OpzegReden | ''
  toelichting: string
  onReden: (reden: OpzegReden | '') => void
  onToelichting: (tekst: string) => void
}

export function OpzegRedenVeld({ reden, toelichting, onReden, onToelichting }: OpzegRedenVeldProps) {
  const w = useTekst(BEHOUD_DATA).opzeg
  const id = useId()
  const gezondheid = reden !== '' && zonderToelichting(reden)
  return (
    <fieldset className="club-lidhub-opzeg">
      <legend className="club-leden-subkop">{w.kop}</legend>
      <label className="club-veld" htmlFor={`${id}-reden`}>
        <span>{w.reden}</span>
        <select
          id={`${id}-reden`}
          className="club-invoer"
          required
          value={reden}
          onChange={(e) => onReden(isOpzegReden(e.target.value) ? e.target.value : '')}
          aria-describedby={gezondheid ? `${id}-uitleg` : undefined}
        >
          <option value="">{w.kies}</option>
          {OPZEG_REDENEN.map((r) => <option key={r} value={r}>{w.redenen[r]}</option>)}
        </select>
      </label>
      {gezondheid ? (
        <p id={`${id}-uitleg`} className="club-hint">{w.gezondheidUitleg}</p>
      ) : (
        <label className="club-veld" htmlFor={`${id}-toelichting`}>
          <span>{w.toelichting}</span>
          <textarea id={`${id}-toelichting`} className="club-invoer" rows={2} maxLength={TOELICHTING_MAX} value={toelichting} onChange={(e) => onToelichting(e.target.value)} />
        </label>
      )}
    </fieldset>
  )
}
