import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_VRAGEN } from '@/components/aiyourgym/inhoud/eerlijk'
import { SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { PRIJZEN_VRAGEN } from '@/components/aiyourgym/site/paden'

// De vragen die een eigenaar stelt vlak voor de knop, ingeklapt zodat de
// voorpagina kort blijft. Meer vragen staan op prijzen en overstappen.

export function HomeVragen() {
  return (
    <section className="ayg-sectie ayg-homevragen" aria-labelledby="homevragen-titel">
      <div className="ayg-wrap ayg-gesplitst">
        <div className="ayg-stapel">
          <SectieKop id="homevragen-titel" label="Vragen" titel="Wat eigenaren als eerste vragen." />
          <Link href={PRIJZEN_VRAGEN} className="ayg-pijllink">
            Meer vragen over prijs en proberen <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <Vragen vragen={HOME_VRAGEN} />
      </div>
    </section>
  )
}
