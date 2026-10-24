import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { sitePaden } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { NIET_GEVONDEN } from '@/lib/aiyourgym/taal/woorden/website/niet-gevonden'
import { Neutraal } from '../neutraal'

// De 404 van AI Your Gym: voor notFound() in de site (ook de poort in
// aiyourgym/layout.tsx) en voor adressen onder /aiyourgym zonder pagina
// (aiyourgym/[...onbekend]). Zolang de schakelaar uit staat een kale 404 zonder
// merknaam: de site is dan geheim, ook op fitfactorypt.nl/aiyourgym.
// In de taal van het adres (/en/... is Engels, woordenboek NIET_GEVONDEN).

export default async function AiYourGymNietGevonden() {
  const taal = await getSiteTaal()
  const t = NIET_GEVONDEN[taal]
  if (!siteActief()) return <Neutraal titel={t.neutraalTitel} tekst={t.neutraalTekst} />
  const { HOME, DEMO } = sitePaden(taal)

  return (
    <AanmeldSchil>
      <section className="aan-pagina ayg-wrap">
        <div className="aan-intro">
          <p className="ayg-label ayg-label--accent">404</p>
          <h1 className="aan-titel">{t.titel}</h1>
          <p className="ayg-lead">{t.tekst}</p>
          <div className="ayg-knoppen">
            <Link href={HOME} className="ayg-knop ayg-knop--accent">
              {t.naarVoorpagina} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href={DEMO} className="ayg-knop ayg-knop--rand">
              {t.bekijkDemo}
            </Link>
          </div>
        </div>
      </section>
    </AanmeldSchil>
  )
}
