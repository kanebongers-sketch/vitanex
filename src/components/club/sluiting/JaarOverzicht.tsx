'use client'

import type { Sluiting } from '@/lib/club/sluiting/model'
import { perMaand } from '@/lib/club/sluiting/regels'
import { MAAND_NAAM } from '@/lib/club/sluiting/weergave'
import { SluitingRegel } from './SluitingRegel'

// Het jaar als lijst per maand: alleen maanden waarin iets afwijkt.

interface Props {
  jaar: number
  sluitingen: readonly Sluiting[]
  geraakt: Readonly<Record<string, number>>
  vandaag: string
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function JaarOverzicht({ jaar, sluitingen, geraakt, vandaag, onKlaar }: Props) {
  const groepen = perMaand(sluitingen)
  if (groepen.length === 0) {
    return (
      <p className="club-leeg">
        Nog geen sluitingsdagen in {jaar}. Voeg de feestdagen in een keer toe, of zet een losse dag erbij.
      </p>
    )
  }
  return (
    <div className="club-sluiting-jaar">
      {groepen.map((g) => (
        <section key={g.maand} className="club-sluiting-maand" aria-labelledby={`maand-${g.maand}`}>
          <h2 id={`maand-${g.maand}`} className="club-sluiting-maandkop">
            {MAAND_NAAM[g.maand - 1]} <span>{g.sluitingen.length}</span>
          </h2>
          <ul className="club-sluiting-lijst">
            {g.sluitingen.map((s) => (
              <SluitingRegel key={s.id} sluiting={s} geraakt={geraakt[s.id] ?? 0} verleden={s.datum < vandaag} onKlaar={onKlaar} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
