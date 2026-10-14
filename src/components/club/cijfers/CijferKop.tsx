import Link from 'next/link'
import { PERIODES, type Bereik, type Periode } from '@/lib/club/cijfers/periode'
import { clubPad, VESTIGING_LABEL, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { dagKort } from '@/lib/club/cijfers/tijd'

// Kop van Cijfers met de periode en het bereik als links (staat in de URL).

interface Props {
  vestiging: Vestiging
  weken: Periode
  bereik: Bereik
  van: string
  vandaag: string
}

export function CijferKop({ vestiging, weken, bereik, van, vandaag }: Props) {
  const pad = (w: Periode, b: Bereik) => clubPad('/cijfers', vestiging, { weken: String(w), ...(b === 'alle' ? { bereik: 'alle' } : {}) })
  return (
    <header className="club-cijfers-kop">
      <div>
        <p className="club-boventitel">{bereik === 'alle' ? 'Alle 8 vestigingen' : VESTIGING_LABEL[vestiging]} · rapportage</p>
        <h1 className="club-cijfers-titel">Cijfers</h1>
        <p className="club-cijfers-periode">
          Laatste {weken} weken: {dagKort(van)} tot en met {dagKort(vandaag)}
        </p>
      </div>
      <nav className="club-cijfers-keuzes" aria-label="Periode en bereik">
        <div className="club-segment" role="group" aria-label="Periode">
          {PERIODES.map((w) => (
            <Link key={w} href={pad(w, bereik)} aria-current={w === weken ? 'page' : undefined} scroll={false}>
              {w} wkn
            </Link>
          ))}
        </div>
        <div className="club-segment" role="group" aria-label="Bereik">
          <Link href={pad(weken, 'vestiging')} aria-current={bereik === 'vestiging' ? 'page' : undefined} scroll={false}>
            {VESTIGING_LABEL[vestiging]}
          </Link>
          <Link href={pad(weken, 'alle')} aria-current={bereik === 'alle' ? 'page' : undefined} scroll={false}>
            Alle vestigingen
          </Link>
        </div>
      </nav>
    </header>
  )
}
