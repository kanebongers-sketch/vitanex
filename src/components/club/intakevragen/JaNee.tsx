'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

interface JaNeeProps {
  label: string
  /** null = nog niet beantwoord. */
  waarde: boolean | null
  onKies: (ja: boolean) => void
  /** Ja is een signaal (gezondheidsvragen): kleur het als let op. */
  jaLetOp?: boolean
}

/** Een vraag met Nee en Ja als knoppen (aria-pressed), op een regel. */
export function JaNee({ label, waarde, onKies, jaLetOp }: JaNeeProps) {
  const t = useTekst(INTAKE).janee
  return (
    <div className="club-intakevragen-janee">
      <span>{label}</span>
      <span className="club-segment" role="group" aria-label={label}>
        <button type="button" aria-pressed={waarde === false} onClick={() => onKies(false)}>{t.nee}</button>
        <button type="button" aria-pressed={waarde === true} onClick={() => onKies(true)} className={jaLetOp && waarde === true ? 'club-training-ja' : ''}>{t.ja}</button>
      </span>
    </div>
  )
}
