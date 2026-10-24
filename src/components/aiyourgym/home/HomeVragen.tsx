import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HOME_VRAGEN_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// De vier vragen die een eigenaar stelt vlak voor de knop, ingeklapt zodat de
// voorpagina kort blijft. De andere vragen staan op prijzen en overstappen.
// Op de pc staan de links onder de kop, op de telefoon onder de vragen.
// Teksten in de taal van de pagina (woordenboek HOME_VRAGEN_SECTIE).

export async function HomeVragen() {
  const taal = await getSiteTaal()
  const t = HOME_VRAGEN_SECTIE[taal]
  const meer = [
    { label: t.meerPrijs, pad: aygPad('/prijzen#vragen') },
    { label: t.meerOverstappen, pad: aygPad('/overstappen#vragen') },
  ]
  return (
    <section className="ayg-sectie ayg-homevragen" aria-labelledby="homevragen-titel">
      <div className="ayg-wrap ayg-homevragen-raster">
        <SectieKop id="homevragen-titel" label={t.label} titel={t.titel} />
        <Vragen vragen={t.vragen} />
        <nav className="ayg-homevragen-meer" aria-label={t.meerLabel}>
          {meer.map((m) => (
            <Link key={m.pad} href={m.pad} className="ayg-pijllink">
              {m.label} <ArrowRight size={16} aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
