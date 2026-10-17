import type { Metadata } from 'next'
import { Concept, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Hoe AI Your Gym omgaat met gegevens van sportscholen, medewerkers en leden. Concepttekst.',
}

export default function PrivacyPagina() {
  return (
    <>
      <PaginaKop
        label="Privacy"
        titel="Privacy"
        tekst="Hoe we omgaan met de gegevens van sportscholen, hun medewerkers en hun leden. In gewone taal."
      />
      <section className="ayg-sectie--krap" aria-label="Privacyverklaring">
        <div className="ayg-wrap ayg-tekst">
          <Concept />
          <h2>Wie is verantwoordelijk</h2>
          <p>
            Een sportschool die AI Your Gym gebruikt, bepaalt welke gegevens van haar leden en medewerkers erin komen en waarvoor. De
            sportschool is daarvoor verantwoordelijk. AI Your Gym verwerkt die gegevens in opdracht van de sportschool. De afspraken
            daarover leggen we vast in een verwerkersovereenkomst.
          </p>
          <h2>Welke gegevens</h2>
          <ul>
            <li>Gegevens van de sportschool en haar beheerders, zoals naam, e-mailadres en vestigingen.</li>
            <li>Gegevens van leden die de sportschool invoert of inleest, zoals naam, contactgegevens, lidmaatschap en bezoek.</li>
            <li>Planning en uren van medewerkers.</li>
            <li>
              Gezondheidsgegevens, zoals metingen en antwoorden uit een intake, alleen met uitdrukkelijke toestemming van het lid.
            </li>
          </ul>
          <h2>Waar staan de gegevens</h2>
          <p>
            De gegevens staan op servers in de Europese Unie. Elke sportschool heeft een eigen, gescheiden omgeving: een sportschool ziet
            nooit gegevens van een andere sportschool.
          </p>
          <h2>Wat een lid ziet</h2>
          <p>
            In de ledenapp ziet een lid alleen de eigen gegevens: lessen, afspraken, schema, trainingen en lichaamsmaten. Notities van
            trainers en gezondheidsgegevens zoals bloeddruk blijven bij het team.
          </p>
          <h2>Bewaren en verwijderen</h2>
          <p>De bewaartermijnen werken we nog uit en komen in deze verklaring en in de verwerkersovereenkomst.</p>
          <h2>Je rechten</h2>
          <p>
            Leden die hun gegevens willen inzien, laten aanpassen of verwijderen, kunnen terecht bij hun sportschool. Sportscholen kunnen
            daarvoor bij ons terecht. De contactgegevens volgen in de definitieve versie.
          </p>
          <h2>Deze website</h2>
          <p>We plaatsen op deze website geen advertentiecookies.</p>
        </div>
      </section>
    </>
  )
}
