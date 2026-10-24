import type { Metadata } from 'next'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Concept, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { JURIDISCH } from '@/lib/aiyourgym/taal/woorden/website/juridisch'

// De voorwaarden blijven Nederlands, ook op /en: juridische teksten vertalen we
// niet zonder akkoord van Kane (docs/aiyourgym/TALEN.md).

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(JURIDISCH)
  return { title: t.voorwaardenTitel, description: t.voorwaardenOmschrijving }
}

export default async function VoorwaardenPagina() {
  const taal = await getSiteTaal()
  const t = JURIDISCH[taal]
  return (
    <>
      <PaginaKop label={t.voorwaardenLabel} titel={t.voorwaardenKop} tekst={t.voorwaardenTekst} />
      <section className="ayg-sectie--krap" aria-label={t.voorwaardenSectie} lang="nl">
        <div className="ayg-wrap ayg-tekst">
          {taal === 'en' && (
            <p className="ayg-klein" role="note" lang="en">
              {JURIDISCH.en.alleenNederlands}
            </p>
          )}
          <Concept />
          <h2>Wat je krijgt</h2>
          <p>
            Een eigen omgeving voor je sportschool met de onderdelen uit je pakket, een ledenapp in je eigen huisstijl en nieuwe
            functies zodra ze klaar zijn.
          </p>
          <h2>Proefperiode</h2>
          <p>Je kunt AI Your Gym {PROEFDAGEN} dagen gratis proberen.</p>
          <h2>Prijs</h2>
          <p>De prijs is op maat en hangt af van het pakket en het aantal vestigingen. Je krijgt de prijs vooraf, schriftelijk.</p>
          <h2>Jouw gegevens</h2>
          <p>
            De gegevens die je invoert blijven van jou. Je kunt ze exporteren, bijvoorbeeld als CSV via de rapporten. AI Your Gym
            gebruikt ze alleen om de software voor jou te laten werken.
          </p>
          <h2>Gebruik</h2>
          <ul>
            <li>Je gebruikt AI Your Gym voor je eigen sportschool en houdt je inloggegevens voor jezelf.</li>
            <li>Je zorgt dat je de gegevens van leden en medewerkers mag gebruiken, en vraagt toestemming voor gezondheidsgegevens.</li>
            <li>Incasso, abonnementen en betalingen van leden vallen buiten AI Your Gym.</li>
          </ul>
          <h2>Nog uit te werken</h2>
          <p>Opzegging, beschikbaarheid, aansprakelijkheid en wijzigingen van deze voorwaarden werken we nog uit in de definitieve versie.</p>
        </div>
      </section>
    </>
  )
}
