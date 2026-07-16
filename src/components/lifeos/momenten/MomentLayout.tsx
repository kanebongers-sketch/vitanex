import type { ReactNode } from 'react'

interface MomentLayoutProps {
  /** De ene kaart die dit moment draagt. Precies één — dat is het punt. */
  dragend: ReactNode
  /** 2-4 ondersteunende kaarten. Meer past niet in één blik. */
  steun: ReactNode
  /** Volle band die de rest verbindt (Vita). Niet elk moment heeft er een. */
  verbindt?: ReactNode
  /** De lade: alles wat bereikbaar moet zijn, maar niet zichtbaar. */
  lade: ReactNode
}

/**
 * De compositie van één moment.
 *
 * De slots zijn geen stijlkeuze maar een constructie: je kúnt geen tweede
 * dragende kaart toevoegen zonder dit bestand aan te passen. Zo blijft de
 * belofte uit het README — één blik, geen 23-widget-muur — afdwingbaar in
 * plaats van een afspraak die de eerste de beste PR sloopt.
 *
 * Server Component: er zit geen state in, alleen indeling. De momentkeuze zelf
 * is het client-eiland (`MomentWissel`).
 */
export function MomentLayout({ dragend, steun, verbindt, lade }: MomentLayoutProps) {
  return (
    <div className="os-moment">
      <div className="os-bento">
        {/* Mobiel staat de dragende kaart eerst in de DOM, dus ook eerst in de
            tab-volgorde. Geen order/grid-trucs die de leesvolgorde en de
            toetsenbordvolgorde uit elkaar laten lopen. */}
        <div className="os-bento__held">{dragend}</div>
        <div className="os-bento__steun">{steun}</div>
      </div>
      {verbindt ? <div className="os-moment__band">{verbindt}</div> : null}
      {lade}
    </div>
  )
}
