import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { startPad, stapNummer } from '@/lib/club/start/stappen'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/import/import.css'

export const metadata: Metadata = { title: 'Ledenbestand inlezen' }

export default async function LedenImporterenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const label = naamVan(t.vestigingen, vestiging)
  // Vanuit de startwizard (stap Leden): de weg terug gaat naar de wizard, niet naar Leden.
  const terugNaarStart = params.van === 'start' && magBeheerdersBeheren(t) ? startPad(stapNummer('klaar'), vestiging) : null
  return (
    <>
      {terugNaarStart ? (
        <Link href={startPad(stapNummer('leden'), vestiging)} className="club-terug">
          <ArrowLeft size={16} aria-hidden /> Startwizard
        </Link>
      ) : (
        <Link href={clubPad('/leden', vestiging)} className="club-terug">
          <ArrowLeft size={16} aria-hidden /> Leden
        </Link>
      )}
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{label}</p>
          <h1>Ledenbestand inlezen</h1>
          <p>
            Lees een export uit je huidige systeem (zoals Virtuagym of Sportivity) of je eigen Excel-lijst in, als CSV of als Excel-bestand (.xlsx). Je ziet eerst
            precies wat er verandert. Nieuwe leden worden toegevoegd, bestaande bijgewerkt; er wordt nooit iemand verwijderd.
          </p>
        </div>
      </header>
      <LedenImport vestiging={vestiging} vestigingLabel={label} terugNaarStart={terugNaarStart} />
    </>
  )
}
