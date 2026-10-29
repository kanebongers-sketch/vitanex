'use client'

import { KLEUREN, type Kleur } from '@/lib/club/lidmaatschappen/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

// Een kleur uit de vaste lijst, als rij rondjes (radioknoppen, dus met de
// pijltjestoetsen te bedienen). De naam van de kleur staat erbij voor wie
// kleur niet goed ziet.

interface Props {
  naam: string
  waarde: Kleur
  onKies: (k: Kleur) => void
}

export function KleurKiezer({ naam, waarde, onKies }: Props) {
  const t = useTekst(LIDMAATSCHAPPEN)
  return (
    <fieldset className="club-lidm-kleuren">
      <legend className="club-label">{t.kleur(t.kleuren[waarde])}</legend>
      <div className="club-lidm-kleurrij">
        {KLEUREN.map((k) => (
          <label key={k} className="club-lidm-kleur" data-kleur={k} title={t.kleuren[k]}>
            <input type="radio" name={naam} value={k} checked={waarde === k} onChange={() => onKies(k)} />
            <span className="club-sr">{t.kleuren[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
