import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CoachFase } from '@/lib/lifeos/pt-coaching/coach-overzicht'

// De vorm van een PT'er in het coach-overzicht: een rustige regel (kop plus
// eventueel acties), daaronder een open formulier en een uitklap met de details.
// Puur en zonder hooks, zodat de server (eigenaren) en de client (beheerder,
// met acties) dezelfde opbouw gebruiken.

interface Props {
  fase: CoachFase
  kop: ReactNode
  samenvatting: string
  inhoud: ReactNode
  acties?: ReactNode
  formulier?: ReactNode
  extra?: ReactNode
}

export function CoachRijOpbouw({ fase, kop, samenvatting, inhoud, acties, formulier, extra }: Props) {
  return (
    <li className="ptd-coachrij" data-fase={fase}>
      <div className="ptd-coachrij-kop">
        {kop}
        {acties ? <div className="ptd-coachrij-acties">{acties}</div> : null}
      </div>
      {formulier ? <div className="ptd-coachrij-form">{formulier}</div> : null}
      <details className="ptd-coachrij-meer">
        <summary>
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden className="ptd-coachrij-pijl" />
          {samenvatting}
        </summary>
        <div className="ptd-coachrij-inhoud">
          {extra}
          {inhoud}
        </div>
      </details>
    </li>
  )
}
