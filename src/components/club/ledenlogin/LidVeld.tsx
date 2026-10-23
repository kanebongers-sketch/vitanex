'use client'

import type { InputHTMLAttributes } from 'react'

// Een invoerveld van de inlog van de ledenapp (e-mailadres of wachtwoord), met
// label, optionele uitleg en een verwijzing naar de foutmelding van het formulier.

export const LID_FOUT_ID = 'lid-inlog-fout'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  id: string
  label: string
  waarde: string
  onWaarde: (w: string) => void
  /** Uitleg onder het label (voorgelezen bij het veld). */
  hint?: string
  /** Er staat een foutmelding: het veld wordt als ongeldig gemeld en verwijst ernaar. */
  fout: boolean
}

export function LidVeld({ id, label, waarde, onWaarde, hint, fout, ...rest }: Props) {
  const hintId = `${id}-hint`
  const beschrijving = [hint ? hintId : null, fout ? LID_FOUT_ID : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="club-mijn-email">
      <label htmlFor={id}>{label}</label>
      {hint ? <p id={hintId} className="club-mijn-veld-hint">{hint}</p> : null}
      <input id={id} aria-invalid={fout || undefined} aria-describedby={beschrijving} value={waarde} onChange={(e) => onWaarde(e.target.value)} {...rest} />
    </div>
  )
}

/** De foutmelding onder een inlogformulier (een plek, voorgelezen zodra hij verschijnt). */
export function LidFout({ fout }: { fout: string | null }) {
  return <div aria-live="assertive">{fout ? <p id={LID_FOUT_ID} className="club-mijn-inlog-fout" role="alert">{fout}</p> : null}</div>
}
