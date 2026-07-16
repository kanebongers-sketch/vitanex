import Link from 'next/link'
import { Utensils, Dumbbell, GlassWater, HeartPulse, type LucideIcon } from 'lucide-react'

// Snelknoppen naar Kane's ECHTE MentaForce-gezondheidspagina's. Bewust gewone
// links, geen ingebedde invoer: LifeOS dupliceert die data niet meer (de eigen
// voeding-/training-/water-kaarten schreven naar een tweede DB en logen over
// Kane's echte cijfers). Dit zijn tegels naar de werkende bron; embedden komt
// later.
//
// Server Component: puur links, geen state. De hover/focus-staat zit in CSS
// (.os-snel), zodat dit geen client-eiland hoeft te worden.

interface Snel {
  naam: string
  sub: string
  href: string
  icoon: LucideIcon
}

// De vier dagelijkse acties. Elke href verwijst naar een pagina die al bestaat en
// werkt — geen dode links, geen beloftes over schermen die er nog niet zijn.
const SNELKNOPPEN: readonly Snel[] = [
  { naam: 'Voeding', sub: 'Log je maaltijd', href: '/voeding', icoon: Utensils },
  { naam: 'Workout', sub: 'Start je training', href: '/sport/training', icoon: Dumbbell },
  { naam: 'Water', sub: 'Vul je inname aan', href: '/water', icoon: GlassWater },
  { naam: 'Check-in', sub: 'Hoe voel je je?', href: '/checkin', icoon: HeartPulse },
]

export function SnelKnoppen() {
  return (
    <nav aria-label="Naar je gezondheidspagina's" className="os-snelrij">
      {SNELKNOPPEN.map(({ naam, sub, href, icoon: Icoon }) => (
        <Link key={href} href={href} className="os-snel">
          <span className="os-snel__badge" aria-hidden="true">
            <Icoon size={17} strokeWidth={2.2} />
          </span>
          <span className="os-snel__tekst">
            <span className="os-snel__naam">{naam}</span>
            <span className="os-snel__sub">{sub}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
