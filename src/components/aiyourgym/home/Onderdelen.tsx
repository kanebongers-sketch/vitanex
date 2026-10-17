import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FUNCTIE_GROEPEN } from '@/components/aiyourgym/inhoud/functies'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// De vijf onderdelen van Club als redactionele index: groot nummer, naam,
// waar het over gaat, en de functies erin.

export function Onderdelen() {
  return (
    <section className="ayg-sectie" aria-labelledby="onderdelen-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="onderdelen-titel"
          label="Een systeem"
          titel="Vijf onderdelen. Alles wat je club nodig heeft."
          tekst="Geen losse apps en lijstjes meer. AI Your Gym is ingedeeld zoals een sportschool werkt: van de werkvloer tot de cijfers van de eigenaar."
        />
        <ol className="ayg-index">
          {FUNCTIE_GROEPEN.map((g, i) => (
            <li key={g.sleutel}>
              <Link href={aygPad(`/functies#${g.sleutel}`)} className="ayg-index-link">
                <span className="ayg-index-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="ayg-index-naam">{g.naam}</span>
                <span className="ayg-index-tekst">
                  <span>{g.intro}</span>
                  <span className="ayg-index-functies">{g.functies.map((f) => f.titel).join(' · ')}</span>
                </span>
                <ArrowUpRight className="ayg-index-pijl" size={26} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
