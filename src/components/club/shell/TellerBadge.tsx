'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { somVan, tellerTekst, type Teller } from '@/lib/club/menu/tellers'

// Een teller als kleine pil naast een naam in het menu. Het getal is voor het
// oog (aria-hidden); een screenreader hoort de zin ("3 open taken vandaag").
// Bij 0 of zonder tellers staat er niets.

interface Props {
  /** Een of meer tellers; op een groep samen opgeteld, met elke zin apart voor de screenreader. */
  tellers: readonly Teller[]
  /** Kleiner, voor de groepen en de onderbalk. */
  klein?: boolean
}

export function TellerBadge({ tellers, klein = false }: Props) {
  const t = useTekst(MENU).tellers
  const tekst = tellerTekst(somVan(tellers))
  if (!tekst) return null
  return (
    <span className={klein ? 'club-teller club-teller--klein' : 'club-teller'}>
      <span aria-hidden>{tekst}</span>
      <span className="club-sr">{`, ${tellers.map((x) => t[x.soort](x.aantal)).join(', ')}`}</span>
    </span>
  )
}
