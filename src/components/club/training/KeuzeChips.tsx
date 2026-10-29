'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

interface KeuzeChipsProps<T extends string | number> {
  legend: string
  opties: readonly T[]
  labels: Record<T, string>
  gekozen: readonly T[]
  onWissel: (waarde: T) => void
  /** Een keuze (radio-gedrag) in plaats van meerdere. */
  enkel?: boolean
}

/** Een rij keuzeknoppen (aria-pressed). Groot genoeg voor een tablet aan de balie. */
export function KeuzeChips<T extends string | number>({ legend, opties, labels, gekozen, onWissel, enkel }: KeuzeChipsProps<T>) {
  const t = useTekst(CLUB_TRAINING).keuze
  return (
    <fieldset className="club-training-fieldset">
      <legend className="club-label">{legend}{enkel ? '' : t.meerdere}</legend>
      <div className="club-training-chips">
        {opties.map((o) => (
          <button key={String(o)} type="button" className="club-training-keuze" aria-pressed={gekozen.includes(o)} onClick={() => onWissel(o)}>
            {labels[o]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Wissel een waarde in een lijst (immutable). */
export function wissel<T>(lijst: readonly T[], waarde: T): T[] {
  return lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde]
}
