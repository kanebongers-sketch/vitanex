'use client'

import { KLEUREN, KLEUR_LABEL, type Kleur } from '@/lib/club/lidmaatschappen/model'

// Een kleur uit de vaste lijst, als rij rondjes (radioknoppen, dus met de
// pijltjestoetsen te bedienen). De naam van de kleur staat erbij voor wie
// kleur niet goed ziet.

interface Props {
  naam: string
  waarde: Kleur
  onKies: (k: Kleur) => void
}

export function KleurKiezer({ naam, waarde, onKies }: Props) {
  return (
    <fieldset className="club-lidm-kleuren">
      <legend className="club-label">Kleur: {KLEUR_LABEL[waarde]}</legend>
      <div className="club-lidm-kleurrij">
        {KLEUREN.map((k) => (
          <label key={k} className="club-lidm-kleur" data-kleur={k} title={KLEUR_LABEL[k]}>
            <input type="radio" name={naam} value={k} checked={waarde === k} onChange={() => onKies(k)} />
            <span className="club-sr">{KLEUR_LABEL[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
