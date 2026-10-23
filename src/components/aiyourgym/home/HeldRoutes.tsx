import Link from 'next/link'
import { ArrowRight, MonitorPlay, Repeat2 } from 'lucide-react'
import { DEMO, OVERSTAPPEN } from '@/components/aiyourgym/site/paden'

// Onder de knoppen in de held: twee rustige routes voor wie nog niet wil
// aanmelden. Overstappen (bijna elke sportschool heeft al iets) en de live
// demo, die zonder account werkt.

const ROUTES = [
  { Icoon: Repeat2, pad: OVERSTAPPEN, kop: 'Heb je al software?', tekst: 'Zo stap je over' },
  { Icoon: MonitorPlay, pad: DEMO, kop: 'Eerst rondkijken?', tekst: 'Live demo, zonder account' },
] as const

export function HeldRoutes() {
  return (
    <nav className="ayg-held-routes" aria-label="Andere routes">
      {ROUTES.map(({ Icoon, pad, kop, tekst }) => (
        <Link key={pad} href={pad} className="ayg-held-route">
          <span className="ayg-held-route-icoon" aria-hidden>
            <Icoon size={18} />
          </span>
          <span className="ayg-held-route-tekst">
            <span className="ayg-held-route-kop">{kop}</span>
            <span className="ayg-held-route-naam">
              {tekst} <ArrowRight size={15} aria-hidden />
            </span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
