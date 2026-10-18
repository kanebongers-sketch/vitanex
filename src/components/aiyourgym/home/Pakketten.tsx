import { PAKKETTEN, PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { Knop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, aygPad } from '@/components/aiyourgym/site/paden'

// De pakketten in het kort, met een link naar de prijzen en de demo.

export function PakkettenKort() {
  return (
    <section className="ayg-sectie" aria-labelledby="pakketten-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="pakketten-titel"
          label="Pakketten"
          titel="Een pakket dat past bij je sportschool."
          tekst={`Scherp geprijsd, met een prijs die past bij je sportschool. Probeer eerst ${PROEFDAGEN} dagen gratis.`}
        />
        <ul className="ayg-pakket-rij">
          {PAKKETTEN.map((p) => (
            <li key={p.sleutel} data-aanbevolen={p.aanbevolen ? '' : undefined}>
              <h3 className="ayg-h3">{p.naam}</h3>
              <p>{p.voorWie}</p>
            </li>
          ))}
        </ul>
        <div className="ayg-knoppen ayg-ruim-boven">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Probeer {PROEFDAGEN} dagen gratis
          </Knop>
          <Knop href={aygPad('/prijzen')} soort="rand">
            Vergelijk de pakketten
          </Knop>
        </div>
        <div className="ayg-ruim">
          <Geruststelling />
        </div>
      </div>
    </section>
  )
}
