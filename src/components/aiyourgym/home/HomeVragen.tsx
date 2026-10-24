import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { taalPad } from '@/lib/aiyourgym/taal/pad'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HOME_VRAGEN_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// De vier vragen die een eigenaar stelt vlak voor de knop, ingeklapt zodat de
// voorpagina kort blijft. De andere vragen staan op prijzen en overstappen.
// Op de pc staan de links onder de kop, op de telefoon onder de vragen.
// Teksten in de taal van de pagina (woordenboek HOME_VRAGEN_SECTIE). Vragen zet
// het pad van een link onder /aiyourgym; daarom krijgt dat pad hier de taal (/en/...).

export async function HomeVragen() {
  const taal = await getSiteTaal()
  const t = HOME_VRAGEN_SECTIE[taal]
  const vragen = t.vragen.map((v) => (v.link ? { ...v, link: { ...v.link, pad: taalPad(taal, v.link.pad) } } : v))
  const meer = [
    { label: t.meerPrijs, pad: aygPad('/prijzen#vragen', taal) },
    { label: t.meerOverstappen, pad: aygPad('/overstappen#vragen', taal) },
  ]
  return (
    <section className="ayg-sectie ayg-homevragen" aria-labelledby="homevragen-titel">
      <div className="ayg-wrap ayg-homevragen-raster">
        <SectieKop id="homevragen-titel" label={t.label} titel={t.titel} />
        <Vragen vragen={vragen} />
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
