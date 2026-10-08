import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { DocumentenBeheer } from '@/components/lifeos/pt-team/DocumentenBeheer'

// PT-documenten: Kane uploadt hier de Fit Factory PT-documenten (protocol,
// intake, abonnementen, Fit Guide, PT Academy, handleiding) die zijn PT'ers in
// hun app openen. Founder-only; de echte gate zit op /api/lifeos/pt-documenten.

export const metadata = { title: 'PT-documenten' }

export default function PtDocumentenPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil os-schil--breed">
          <header className="os-crm-kop">
            <Link href="/lifeos/pt-team" className="os-crm-terug">
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Terug naar PT-team
            </Link>
            <h1 className="os-zone__kop">PT-documenten</h1>
            <p className="os-zone__intro">
              Wat je hier uploadt, zien je PT&apos;ers in hun app onder Kennis → Documenten. De bestanden staan in een privé opslag;
              een PT&apos;er opent ze pas na het inloggen met de pincode, via een link die na 5 minuten verloopt.
            </p>
          </header>
          <DocumentenBeheer />
        </main>
      </div>
    </FounderPoort>
  )
}
