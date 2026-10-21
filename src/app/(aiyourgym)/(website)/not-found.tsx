import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { DEMO, aygPad } from '@/components/aiyourgym/site/paden'
import { Neutraal } from '../neutraal'

// De 404 van AI Your Gym: voor notFound() in de site (ook de poort in
// aiyourgym/layout.tsx) en voor adressen onder /aiyourgym zonder pagina
// (aiyourgym/[...onbekend]). Zolang de schakelaar uit staat een kale 404 zonder
// merknaam: de site is dan geheim, ook op fitfactorypt.nl/aiyourgym.

export default function AiYourGymNietGevonden() {
  if (!siteActief()) return <Neutraal titel="Pagina niet gevonden" tekst="Deze pagina bestaat niet." />

  return (
    <AanmeldSchil>
      <section className="aan-pagina ayg-wrap">
        <div className="aan-intro">
          <p className="ayg-label ayg-label--accent">404</p>
          <h1 className="aan-titel">Deze pagina bestaat niet.</h1>
          <p className="ayg-lead">
            Misschien is hij verplaatst, of klopt het adres net niet. Op de voorpagina vind je alles over AI Your Gym.
          </p>
          <div className="ayg-knoppen">
            <Link href={aygPad()} className="ayg-knop ayg-knop--accent">
              Naar de voorpagina <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href={DEMO} className="ayg-knop ayg-knop--rand">
              Bekijk de demo
            </Link>
          </div>
        </div>
      </section>
    </AanmeldSchil>
  )
}
