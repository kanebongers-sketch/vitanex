import { CijfersScherm, PersoneelScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Personeel en uren naast de cijfers per maand: wat de eigenaar elke week wil weten.

export function Planning() {
  return (
    <section className="ayg-sectie" aria-labelledby="planning-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="planning-titel"
          label="Planning en beheer"
          titel="Diensten, uren en cijfers. Zonder Excel."
          tekst="Het rooster van je fitnesspersoneel met uren die je goedkeurt en exporteert, en cijfers die je per kalendermaand naast elkaar legt."
        />
        <div className="ayg-duo">
          <div className="ayg-stapel">
            <Figuur className="ayg-onthul" label="Het personeelsrooster met vier diensten en de status van de uren: gepland, gewerkt, goedgekeurd of verwerkt">
              <PersoneelScherm />
            </Figuur>
            <div>
              <h3 className="ayg-h3">Personeelsrooster en uren</h3>
              <p className="ayg-klein ayg-ruim">Van gepland naar gewerkt, goedgekeurd en verwerkt. De administratie krijgt een export, niet een stapel screenshots.</p>
            </div>
          </div>
          <div className="ayg-stapel ayg-duo-verschoven">
            <Figuur className="ayg-onthul" label="Cijfers van oktober: nieuwe leden, bezoeken, bezetting van lessen en opzeggingen, met een staafgrafiek per maand">
              <CijfersScherm />
            </Figuur>
            <div>
              <h3 className="ayg-h3">Cijfers per kalendermaand</h3>
              <p className="ayg-klein ayg-ruim">Groei, bezoek, bezetting en behoud, steeds van de eerste tot de laatste dag van de maand. Ook als CSV.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
