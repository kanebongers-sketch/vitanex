import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { MensenBord } from '@/components/lifeos/crm/MensenBord'

// Het mensen-bord: Kane's CRM voor zijn PT-klanten en zijn twee teams. Founder-
// only, net als de rest van LifeOS — de echte gate zit server-side op elke
// /api/lifeos/crm-route. De data leeft in de aparte LifeOS-database, want dit zijn
// persoonsgegevens van derden (klanten, teamleden) die niet in de B2B-database
// horen die medewerkers anonimiteit belooft. Zie src/lib/lifeos/admin.ts.
//
// Eigen route i.p.v. een sectie in de cockpit: een kanban heeft horizontale
// breedte en een eigen scroll nodig die de verticale cockpit-flow niet geeft.

export const metadata = { title: 'Mensen — LifeOS' }

export default function MensenPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil os-schil--breed">
          <header className="os-crm-kop">
            <Link href="/lifeos" className="os-crm-terug">
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Terug naar dashboard
            </Link>
            <h1 className="os-zone__kop">Mensen</h1>
            <p className="os-zone__intro">
              Je PT-klanten en je teams. Sleep een kaart naar een andere kolom om de status te
              wijzigen, of open een kaart voor de geschiedenis en bijzonderheden.
            </p>
          </header>
          <MensenBord />
        </main>
      </div>
    </FounderPoort>
  )
}
