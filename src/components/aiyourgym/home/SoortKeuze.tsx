import Link from 'next/link'
import { ArrowUpRight, Building2, CalendarCheck, Dumbbell, Flower2, Swords, Timer, UserRound, type LucideIcon } from 'lucide-react'
import { DOELGROEPEN, type DoelgroepSleutel } from '@/components/aiyourgym/inhoud/doelgroepen'
import { voorWie } from '@/components/aiyourgym/site/paden'

// Direct onder de held: de bezoeker herkent zich in een soort sportschool en
// springt naar zijn eigen stuk op /voor-wie. Dezelfde zeven soorten als de
// startwizard (src/lib/club/start/soorten.ts) via inhoud/doelgroepen.ts.

const ICOON: Record<DoelgroepSleutel, LucideIcon> = {
  zelfstandig: Dumbbell,
  boutique: CalendarCheck,
  'pt-studio': UserRound,
  keten: Building2,
  yoga: Flower2,
  vechtsport: Swords,
  bootcamp: Timer,
}

export function SoortKeuze() {
  return (
    <nav className="ayg-soortkeuze" aria-labelledby="soortkeuze-titel">
      <div className="ayg-wrap ayg-soortkeuze-raster">
        <p className="ayg-soortkeuze-kop" id="soortkeuze-titel">
          Wat voor sportschool heb je?
        </p>
        <ul className="ayg-soortkeuze-lijst">
          {DOELGROEPEN.map((d) => {
            const Icoon = ICOON[d.sleutel]
            return (
              <li key={d.sleutel}>
                <Link href={voorWie(d.sleutel)} className="ayg-soort">
                  <span className="ayg-soort-icoon" aria-hidden>
                    <Icoon size={17} strokeWidth={2} />
                  </span>
                  <span className="ayg-soort-naam">{d.naam}</span>
                  <ArrowUpRight size={15} aria-hidden className="ayg-soort-pijl" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
