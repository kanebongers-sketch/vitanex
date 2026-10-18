import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { SysteemKaart } from './SysteemKaart'

// Het eerste hoofdpunt van de voorpagina, direct na de held: balie, vloer,
// trainer, eigenaar en lid werken in hetzelfde systeem.

export function EenSysteem() {
  return (
    <section className="ayg-sectie ayg-podium ayg-podium--rond ayg-systeem" aria-labelledby="systeem-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="systeem-titel"
          label="Alles in een systeem"
          titel={
            <>
              Vijf plekken. <mark className="ayg-markeer">Een</mark> systeem.
            </>
          }
          tekst="De balie, de vloer, je trainers, jij als eigenaar en je leden werken in dezelfde Club. Wat de een doet, ziet de ander meteen. Geen losse apps, geen Excel naast het rooster, geen overtypen."
        />
        <SysteemKaart />
        <SectieActie />
      </div>
    </section>
  )
}
