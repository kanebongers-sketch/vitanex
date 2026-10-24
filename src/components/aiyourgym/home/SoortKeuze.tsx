import Link from 'next/link'
import { ArrowUpRight, Building2, CalendarCheck, Dumbbell, Flower2, Swords, Timer, UserRound, type LucideIcon } from 'lucide-react'
import { DOELGROEPEN, type DoelgroepSleutel } from '@/components/aiyourgym/inhoud/doelgroepen'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SOORT_KEUZE } from '@/lib/aiyourgym/taal/woorden/website/home'

// Direct onder de held: de bezoeker herkent zich in een soort sportschool en
// springt naar zijn eigen stuk op /voor-wie. Dezelfde zeven soorten als de
// startwizard (src/lib/club/start/soorten.ts) via inhoud/doelgroepen.ts.
// Namen in de taal van de pagina (woordenboek SOORT_KEUZE, zelfde volgorde).

const ICOON: Record<DoelgroepSleutel, LucideIcon> = {
  zelfstandig: Dumbbell,
  boutique: CalendarCheck,
  'pt-studio': UserRound,
  keten: Building2,
  yoga: Flower2,
  vechtsport: Swords,
  bootcamp: Timer,
}

export async function SoortKeuze() {
  const taal = await getSiteTaal()
  const t = SOORT_KEUZE[taal]
  return (
    <nav className="ayg-soortkeuze" aria-labelledby="soortkeuze-titel">
      <div className="ayg-wrap ayg-soortkeuze-raster">
        <p className="ayg-soortkeuze-kop" id="soortkeuze-titel">
          {t.kop}
        </p>
        <ul className="ayg-soortkeuze-lijst">
          {DOELGROEPEN.map((d, i) => {
            const Icoon = ICOON[d.sleutel]
            return (
              <li key={d.sleutel}>
                <Link href={aygPad(`/voor-wie#${d.sleutel}`)} className="ayg-soort">
                  <span className="ayg-soort-icoon" aria-hidden>
                    <Icoon size={17} strokeWidth={2} />
                  </span>
                  <span className="ayg-soort-naam">{t.namen[i] ?? d.naam}</span>
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
