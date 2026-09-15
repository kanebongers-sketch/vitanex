import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { FinanceKaart } from '@/components/lifeos/finance/FinanceKaart'

// Geld: Kane's financieel overzicht (facturen open/te laat, omzet). Founder-only,
// net als de rest van LifeOS; de echte gate zit server-side op elke /api/lifeos-
// route. Eigen route i.p.v. een sectie in de cockpit — het dashboard blijft op
// vandaag gericht, het geldoverzicht heeft hier zijn eigen rustige plek.

export const metadata = { title: 'Geld' }

export default function GeldPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil">
          <header className="os-crm-kop">
            <Link href="/lifeos" className="os-crm-terug">
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Terug naar dashboard
            </Link>
            <h1 className="os-zone__kop">Geld</h1>
            <p className="os-zone__intro">
              Je facturen en omzet in één oogopslag: wat er open staat, wat te lang wacht, en wat er binnenkwam.
            </p>
          </header>
          <FinanceKaart />
        </main>
      </div>
    </FounderPoort>
  )
}
