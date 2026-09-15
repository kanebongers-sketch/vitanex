import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { KennisGrafiekKaart } from '@/components/lifeos/notities/KennisGrafiekKaart'

// Kennis: Kane's notities-/kennisgrafiek. Founder-only, net als de rest van LifeOS;
// de echte gate zit server-side op elke /api/lifeos-route. Eigen route i.p.v. een
// sectie in de cockpit — het dashboard blijft op vandaag gericht, de kennisgrafiek
// krijgt hier de ruimte die hij verdient.

export const metadata = { title: 'Kennis' }

export default function KennisPagina() {
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
            <h1 className="os-zone__kop">Kennis</h1>
            <p className="os-zone__intro">
              De notities en verbanden die je opbouwt — je eigen kennisgrafiek, los van de waan van de dag.
            </p>
          </header>
          <KennisGrafiekKaart />
        </main>
      </div>
    </FounderPoort>
  )
}
