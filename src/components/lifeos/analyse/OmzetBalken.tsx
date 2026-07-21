import type { LucideIcon } from 'lucide-react'
import { formatEuro, balkBreedte } from './analyse-format'

// Herbruikbare balken-sectie voor "omzet per vestiging" én "omzet per traject".
// Puur presentational: krijgt items binnen, rekent zelf de balk-breedte uit t.o.v.
// de hoogste omzet. De balk is decoratief (aria-hidden); het bedrag en aantal
// staan als echte tekst in de lijst, dus betekenis hangt nooit aan kleur/breedte.

export interface OmzetBalkItem {
  naam: string
  omzet: number
  aantal: number
}

interface OmzetBalkenProps {
  titel: string
  bijschrift: string
  eenheid: string
  icoon: LucideIcon
  items: readonly OmzetBalkItem[]
}

export function OmzetBalken({ titel, bijschrift, eenheid, icoon: Icoon, items }: OmzetBalkenProps) {
  const max = items.reduce((hoogste, item) => Math.max(hoogste, item.omzet), 0)

  return (
    <section className="anl-sectie" aria-label={titel}>
      <div className="anl-sectie-kop">
        <h2 className="anl-sectie-titel">
          <Icoon size={17} strokeWidth={2} aria-hidden="true" />
          {titel}
        </h2>
        <p className="anl-sectie-bij">{bijschrift}</p>
      </div>

      <ul className="anl-balken">
        {items.map((item) => (
          <li key={item.naam}>
            <div className="anl-balk-rij">
              <span className="anl-balk-naam">{item.naam}</span>
              <span className="anl-balk-cijfer">
                <b>{formatEuro(item.omzet)}</b> <span>· {item.aantal} {eenheid}</span>
              </span>
            </div>
            <div className="anl-balk-track" aria-hidden="true">
              <div className="anl-balk-fill" style={{ width: balkBreedte(item.omzet, max) }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
