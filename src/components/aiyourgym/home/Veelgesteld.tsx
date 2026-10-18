import { VEELGESTELDE_VRAGEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { Knop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { DEMO } from '@/components/aiyourgym/site/paden'

// De veelgestelde vragen van de voorpagina.

export function Veelgesteld() {
  return (
    <section className="ayg-sectie" aria-labelledby="faq-titel">
      <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
        <div className="ayg-stapel">
          <SectieKop id="faq-titel" label="Veelgestelde vragen" titel="Wat sportscholen ons vragen." />
          <div>
            <Knop href={DEMO} soort="rand" pijl>
              Probeer de demo
            </Knop>
          </div>
        </div>
        <Vragen vragen={VEELGESTELDE_VRAGEN} />
      </div>
    </section>
  )
}
