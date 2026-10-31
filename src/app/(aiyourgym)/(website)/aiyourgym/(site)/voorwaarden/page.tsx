import type { Metadata } from 'next'
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
          <h2>Start en contract</h2>
          <p>
            Er is geen proefperiode. Na het aanmelden betaal je meteen. Het contract loopt een jaar en je betaalt per maand, per
            vestiging.
          </p>
          <h2>Prijs en staffels</h2>
          <p>
            Elke vestiging heeft een eigen abonnement met dezelfde pakketten. De prijs per vestiging hangt af van de pakketten en
            van het aantal actieve leden van die vestiging, in staffels: tot 25, tot 50, tot 100, tot 200, tot 500, tot 1.000 en tot
            5.000 leden. De bedragen zie je bij het afsluiten in Stripe, voordat je betaalt.
          </p>
          <ul>
            <li>
              We tellen elke dag de actieve leden per vestiging. Een actief lid is een lid met de status actief of proef, of een
              opgezegd lid tot en met de einddatum. Gepauzeerde, gestopte en demoleden tellen niet mee, net als leden van wie het
              lidmaatschap nog niet is begonnen.
            </li>
            <li>
              Komt een vestiging boven de grens van zijn staffel, dan geldt de hogere staffel vanaf de eerstvolgende maandfactuur,
              zonder dat daar aparte toestemming voor nodig is. Je jaarcontract loopt gewoon door.
            </li>
            <li>
              Zakt het aantal actieve leden onder de grens, dan gaat de staffel ook vanzelf omlaag, vanaf de volgende maandfactuur.
              Er wordt niets met terugwerkende kracht verrekend.
            </li>
            <li>Je ziet de staffel en het aantal actieve leden per vestiging altijd in Club, bij Abonnement.</li>
            <li>Verandert de staffel van een vestiging, dan krijg je daarover een mail.</li>
            <li>Boven 5.000 actieve leden per vestiging geldt een prijs op maat, die we vooraf schriftelijk met je afspreken.</li>
          </ul>
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
