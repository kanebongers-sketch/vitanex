import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { CheckinScherm, OpvolgScherm, TakenScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// De werkvloer als bento: check-in groot, opvolgen en taken ernaast.

export function Werkvloer() {
  return (
    <section className="ayg-sectie" aria-labelledby="werkvloer-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="werkvloer-titel"
          label="Werkvloer"
          titel="De balie, de vloer en de afsluitronde. Geregeld."
          tekst="Je team ziet bij het begin van de dienst wat er speelt: wie er binnen is, welke taken open staan en welk lid vandaag aandacht verdient."
        />
        <div className="ayg-bento">
          <article className="ayg-bento-vak ayg-bento-vak--groot">
            <div className="ayg-bento-tekst">
              <h3 className="ayg-h3">Check-in met QR-code of op naam</h3>
              <p>AI Your Gym kijkt meteen of het lidmaatschap toegang geeft tot deze vestiging, en telt dubbel scannen niet twee keer.</p>
            </div>
            <Figuur label="De check-in van AI Your Gym met een zoekveld en de leden die net binnen zijn, elk met een status">
              <CheckinScherm />
            </Figuur>
          </article>
          <article className="ayg-bento-vak">
            <div className="ayg-bento-tekst">
              <h3 className="ayg-h3">Opvolgen voor ledenbehoud</h3>
              <p>Regels zetten leden die aandacht nodig hebben op de lijst van vandaag. Jij bepaalt de drempels.</p>
            </div>
            <Figuur label="De opvolglijst van vandaag met vier leden en de reden om ze aan te spreken">
              <OpvolgScherm />
            </Figuur>
          </article>
          <article className="ayg-bento-vak">
            <div className="ayg-bento-tekst">
              <h3 className="ayg-h3">Taken en poetslijsten</h3>
              <p>Dagtaken, afsluitronde en poetsrooster in een tabel, per dag of per week.</p>
            </div>
            <Figuur label="Een takentabel met taken tegen de dagen van de week, deels afgevinkt">
              <TakenScherm />
            </Figuur>
          </article>
        </div>
      </div>
    </section>
  )
}
