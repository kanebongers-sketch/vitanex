import { VEELGESTELDE_VRAGEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'

// De veelgestelde vragen van de voorpagina: hier nemen we de bezwaren weg
// (overstappen, data, contract, hulp, privacy).

export function Veelgesteld() {
  return (
    <section className="ayg-sectie" aria-labelledby="faq-titel">
      <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
        <div className="ayg-stapel">
          <SectieKop id="faq-titel" label="Veelgestelde vragen" titel="Twijfel je nog? Lees dit eerst." />
          <SectieActie />
        </div>
        <Vragen vragen={VEELGESTELDE_VRAGEN} />
      </div>
    </section>
  )
}
