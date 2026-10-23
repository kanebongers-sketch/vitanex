import type { InputHTMLAttributes, ReactNode } from 'react'

// Een invoerveld met label, hulptekst en foutmelding, gekoppeld via
// aria-describedby zodat een schermlezer de melding voorleest.

interface VeldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  hint?: ReactNode
  fout?: string
  /** Tekst die aan het begin in het veld staat, zoals "aiyourgym.com/". */
  voor?: string
  /** Tekst die aan het eind in het veld staat, zoals ".aiyourgym.com". */
  achter?: string
  status?: ReactNode
}

export function Veld({ id, label, hint, fout, voor, achter, status, ...input }: VeldProps) {
  const beschrijving = [hint ? `${id}-hint` : null, fout ? `${id}-fout` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="aan-veld" data-fout={fout ? 'ja' : undefined}>
      <label htmlFor={id} className="aan-label">
        {label}
      </label>
      <div className="aan-invoer">
        {voor && (
          <span className="aan-voor" aria-hidden="true">
            {voor}
          </span>
        )}
        <input id={id} aria-invalid={fout ? true : undefined} aria-describedby={beschrijving} {...input} />
        {achter && (
          <span className="aan-achter" aria-hidden="true">
            {achter}
          </span>
        )}
      </div>
      {status}
      {hint && (
        <p id={`${id}-hint`} className="aan-hint">
          {hint}
        </p>
      )}
      {fout && (
        <p id={`${id}-fout`} className="aan-fout" role="alert">
          {fout}
        </p>
      )}
    </div>
  )
}
