'use client'

import type { Sluiting } from '@/lib/club/sluiting/model'
import { perMaand } from '@/lib/club/sluiting/regels'
import { maandNaam } from '@/lib/club/cijfers/maand'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'
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
  const taal = useTaal()
  const t = useTekst(SLUITING).beheer
  if (groepen.length === 0) {
    return (
      <p className="club-leeg">{t.leeg(jaar)}</p>
    )
  }
  return (
    <div className="club-sluiting-jaar">
      {groepen.map((g) => (
        <section key={g.maand} className="club-sluiting-maand" aria-labelledby={`maand-${g.maand}`}>
          <h2 id={`maand-${g.maand}`} className="club-sluiting-maandkop">
            {maandNaam(`${jaar}-${String(g.maand).padStart(2, '0')}`, taal).replace(` ${jaar}`, '')} <span>{g.sluitingen.length}</span>
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
