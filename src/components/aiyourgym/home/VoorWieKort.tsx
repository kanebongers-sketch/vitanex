import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { DOELGROEPEN } from '@/components/aiyourgym/inhoud/doelgroepen'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// Voor wie, in het kort: vier soorten sportscholen als tegels, elk met een
// link naar het eigen stuk op de pagina Voor wie.

export function VoorWieKort() {
  return (
    <section className="ayg-sectie" aria-labelledby="voorwie-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="voorwie-titel"
          label="Voor wie"
          titel="Van een vestiging tot een hele keten."
          tekst="Dezelfde software voor elk soort sportschool. Je zet aan wat je gebruikt en past alles aan: lessen, oefeningen, teksten en regels."
        />
        <ul className="ayg-doelen">
          {DOELGROEPEN.map((d, i) => (
            <li key={d.sleutel}>
              <Link href={aygPad(`/voor-wie#${d.sleutel}`)} className="ayg-doel">
                <span className="ayg-doel-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="ayg-doel-naam">{d.naam}</span>
                <span className="ayg-doel-kop">{d.kop}</span>
                <ArrowUpRight className="ayg-doel-pijl" size={22} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
