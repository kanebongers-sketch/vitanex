import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

// De kop van een sectie op Vandaag (Check-in, Taken, Opvolgen): een grote
// titel met het anker, een regel uitleg en rechts de links naar de volledige
// schermen. Geen tabbladen: alles staat op het dagscherm (besluit Kane 27-10-2026).

export interface SectieLink {
  href: string
  label: string
}

interface Props {
  /** Id van de kop (aria-labelledby van de sectie). */
  id: string
  titel: string
  sub: string
  links: readonly SectieLink[]
}

export function SectieKop({ id, titel, sub, links }: Props) {
  return (
    <header className="club-vandaag-sectie-kop">
      <div>
        <h2 id={id}>{titel}</h2>
        <p>{sub}</p>
      </div>
      {links.length > 0 && (
        <nav className="club-vandaag-sectie-links" aria-label={titel}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="club-knop club-knop--klein club-knop--stil">
              {l.label} <ArrowUpRight aria-hidden size={14} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
