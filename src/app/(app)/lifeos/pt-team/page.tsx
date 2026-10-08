import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { PtTeamOverzicht } from '@/components/lifeos/pt-team/PtTeamOverzicht'

// PT-team: wat elke Fit Factory PT'er in zijn eigen dashboard (/<naam>) bijhoudt —
// leads, opvolging, klanten en abonnementen — naast elkaar. Founder-only; de
// echte gate zit op /api/lifeos/pt-team.

export const metadata = { title: 'PT-team' }

export default function PtTeamPagina() {
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
            <h1 className="os-zone__kop">PT-team</h1>
            <p className="os-zone__intro">
              Leads, opvolging en PT-klanten per PT&apos;er en per club — live uit hun eigen dashboard op mentaforce.nl/&lt;naam&gt;.
            </p>
          </header>
          <PtTeamOverzicht />
        </main>
      </div>
    </FounderPoort>
  )
}
