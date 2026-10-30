import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { startPad, stapNummer } from '@/lib/club/start/stappen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/import/import.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEDEN)).import.titel }
}

export default async function LedenImporterenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const label = naamVan(t.vestigingen, vestiging)
  const w = (await clubTekst(LEDEN)).import
  // Vanuit de startwizard (stap Leden): de weg terug gaat naar de wizard, niet naar Leden.
  const terugNaarStart = params.van === 'start' && magBeheerdersBeheren(t) ? startPad(stapNummer('klaar'), vestiging) : null
  return (
    <>
      {terugNaarStart ? (
        <Link href={startPad(stapNummer('leden'), vestiging)} className="club-terug">
          <ArrowLeft size={16} aria-hidden /> {w.terugStart}
        </Link>
      ) : (
        <Link href={clubPad('/leden', vestiging)} className="club-terug">
          <ArrowLeft size={16} aria-hidden /> {w.terugLeden}
        </Link>
      )}
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{label}</p>
          <h1>{w.titel}</h1>
          <p>{w.uitleg}</p>
        </div>
      </header>
      {/* Alleen zien (rollen v2): geen importknoppen, in plaats van een fout bij opslaan. */}
      {kanBewerken(t, 'leden') ? (
        <LedenImport vestiging={vestiging} vestigingLabel={label} terugNaarStart={terugNaarStart} />
      ) : (
        <p className="club-melding" role="status">{w.alleenZien}</p>
      )}
    </>
  )
}
