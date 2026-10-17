import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/import/import.css'

export const metadata: Metadata = { title: 'Ledenbestand inlezen' }

export default async function LedenImporterenPagina({ searchParams }: { searchParams: ZoekParams }) {
  await eisModule('leden')
  const vestiging = kiesVestiging((await searchParams).v)
  const label = VESTIGING_LABEL[vestiging]
  return (
    <>
      <Link href={clubPad('/leden', vestiging)} className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Leden
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{label}</p>
          <h1>Ledenbestand inlezen</h1>
          <p>
            Lees een export uit Sportivity of Excel in als CSV-bestand. Je ziet eerst precies wat er verandert. Nieuwe leden worden
            toegevoegd, bestaande bijgewerkt; er wordt nooit iemand verwijderd.
          </p>
        </div>
      </header>
      <LedenImport vestiging={vestiging} vestigingLabel={label} />
    </>
  )
}
