// De eerlijke stand van lidgeld boven plannen en kortingen: in schaduwmodus of
// met incasso uit wordt er niets geincasseerd. Kane ziet ook wanneer lidgeld bij
// deze sportschool nog uit staat (alleen voor het master account zichtbaar).

'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

export interface LidgeldInfo {
  schaduw: boolean
  incassoAan: boolean
  /** Lidgeld staat bij deze sportschool uit; alleen Kane ziet dit om te testen. */
  alleenKane: boolean
}

export function LidgeldMelding({ schaduw, incassoAan, alleenKane }: LidgeldInfo) {
  const t = useTekst(BETALEN).lidgeld
  const tekst = schaduw ? t.schaduw : t.incassoUit
  return (
    <div className="club-lidgeld-meldingen">
      {(schaduw || !incassoAan) && (
        <p className="club-lidgeld-melding" role="note">
          <strong>{schaduw ? t.schaduwKop : t.lidgeldKop}</strong>
          <span>{tekst}</span>
        </p>
      )}
      {alleenKane && (
        <p className="club-lidgeld-melding" role="note">
          <strong>{t.alleenJijKop}</strong>
          <span>{t.alleenJij}</span>
        </p>
      )}
    </div>
  )
}
