import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { OVERSTAP_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// Overstappen in drie stappen, kort op de voorpagina. De uitleg met
// vragen en de hele startwizard staat op /overstappen.

export function Overstappen() {
  return (
    <section className="ayg-sectie ayg-overstap" aria-labelledby="overstap-titel">
      <div className="ayg-wrap ayg-overstap-raster">
        <div className="ayg-overstap-kop">
          <SectieKop
            id="overstap-titel"
            label="Overstappen"
            titel={
              <>
                Overstappen <mark className="ayg-markeer">zonder gedoe.</mark>
              </>
            }
            tekst="Je ledenadministratie en incasso blijven waar ze zijn. In drie stappen staat je club erin."
          />
          <Link href={aygPad('/overstappen')} className="ayg-pijllink">
            Zo stap je over <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <ol className="ayg-overstap-stappen">
          {OVERSTAP_STAPPEN.map((s, i) => (
            <li key={s.titel}>
              <span className="ayg-overstap-nr" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3>{s.titel}</h3>
                <p>{s.tekst}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
