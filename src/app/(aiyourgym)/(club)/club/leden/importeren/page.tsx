import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/import/import.css'

export const metadata: Metadata = { title: 'Ledenbestand inlezen' }

export default async function LedenImporterenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const label = naamVan(t.vestigingen, vestiging)
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
            Lees een export uit je ledenadministratie of Excel in als CSV-bestand. Je ziet eerst precies wat er verandert. Nieuwe leden worden
            toegevoegd, bestaande bijgewerkt; er wordt nooit iemand verwijderd.
          </p>
        </div>
      </header>
      <LedenImport vestiging={vestiging} vestigingLabel={label} />
    </>
  )
}
