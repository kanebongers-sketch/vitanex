import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_VRAGEN } from '@/components/aiyourgym/inhoud/eerlijk'
import { SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad, PRIJZEN_VRAGEN } from '@/components/aiyourgym/site/paden'

// De vier vragen die een eigenaar stelt vlak voor de knop, ingeklapt zodat de
// voorpagina kort blijft. De andere vragen staan op prijzen en overstappen.
// Op de pc staan de links onder de kop, op de telefoon onder de vragen.

const MEER = [
  { label: 'Vragen over prijs en proberen', pad: PRIJZEN_VRAGEN },
  { label: 'Vragen over overstappen', pad: aygPad('/overstappen#vragen') },
] as const

export function HomeVragen() {
  return (
    <section className="ayg-sectie ayg-homevragen" aria-labelledby="homevragen-titel">
      <div className="ayg-wrap ayg-homevragen-raster">
        <SectieKop id="homevragen-titel" label="Vragen" titel="Wat eigenaren als eerste vragen." />
        <Vragen vragen={HOME_VRAGEN} />
        <nav className="ayg-homevragen-meer" aria-label="Meer vragen">
          {MEER.map((m) => (
            <Link key={m.pad} href={m.pad} className="ayg-pijllink">
              {m.label} <ArrowRight size={16} aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
