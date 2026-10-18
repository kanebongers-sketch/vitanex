import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { HOOFDSTUKKEN } from '@/components/aiyourgym/inhoud/functies'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// De functies in vijf hoofdstukken als redactionele index: een eigen kleuraccent
// per hoofdstuk, de naam groot, waar het over gaat, de functies erin en een
// "Bekijk"-link naar het eigen stuk op de pagina Functies.

export function Onderdelen() {
  return (
    <section className="ayg-sectie" aria-labelledby="onderdelen-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="onderdelen-titel"
          label="Functies"
          titel="Vijf hoofdstukken. Alles wat je club nodig heeft."
          tekst="Geen losse apps en lijstjes meer. Van de balie en de vloer tot de groei van je club en de app van je leden."
        />
        <ol className="ayg-index">
          {HOOFDSTUKKEN.map((h, i) => (
            <li key={h.sleutel} style={{ '--hfd': `var(--ayg-h-${h.sleutel})` } as CSSProperties}>
              <Link href={aygPad(`/functies#${h.sleutel}`)} className="ayg-index-link">
                <span className="ayg-index-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="ayg-index-naam">{h.naam}</span>
                <span className="ayg-index-tekst">
                  <span>{h.intro}</span>
                  <span className="ayg-index-functies">{h.functies.map((f) => f.titel).join(' · ')}</span>
                </span>
                <span className="ayg-index-bekijk">
                  Bekijk <span className="ayg-sr">{h.naam.toLowerCase()}</span>
                  <ArrowUpRight size={18} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
