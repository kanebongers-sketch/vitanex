import type { Metadata } from 'next'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { doorstuurPad } from '@/lib/club/kern/doorsturen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalAlleMedewerkers, haalTypen } from '@/lib/club/afspraken/opslag'
import { TypenBeheer } from '@/components/club/afspraken/TypenBeheer'
import { AgendaScherm, agendaZicht } from '@/components/club/agenda/AgendaScherm'
import '@/components/club/afspraken/afspraken.css'
import '@/components/club/agenda/agenda.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { AGENDA } from '@/lib/aiyourgym/taal/woorden/club/agenda'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(AFSPRAKEN)).titel }
}

const eerste = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// Afspraken staan sinds het ontwerp "Club in 10 minuten" (03-11-2026) in de
// Agenda, filter Met leden: dit adres geeft een 308 daarheen met de zoekstring
// erbij. Wie de agenda van het team niet mag zien (bijvoorbeeld een trainer),
// krijgt hier dezelfde Agenda met alleen Met leden. ?tab=typen blijft hier: het
// beheer van de soorten afspraken.
export default async function AfsprakenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('afspraken')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const zicht = agendaZicht(t)

  if (eerste(zoek.tab) === 'typen') {
    const taal = await getTaal()
    const tekst = AFSPRAKEN[taal]
    const [typen, alleMedewerkers] = await Promise.all([haalTypen(t.admin, t.userId), haalAlleMedewerkers(t.admin, t.userId)])
    const terug = zicht.team ? clubPad('/agenda', vestiging, { filter: 'leden' }) : clubPad('/afspraken', vestiging)
    return (
      <div className="club-afspraken">
        <header className="club-paginakop">
          <div>
            <Link href={terug} className="ag-terug"><ChevronLeft size={15} aria-hidden /> {AGENDA[taal].terugNaarAgenda}</Link>
            <h1>{tekst.tabs.typen}</h1>
            <p>{naamVan(t.vestigingen, vestiging)}</p>
          </div>
        </header>
        {typen === null || alleMedewerkers === null ? (
          <p className="club-melding club-melding--fout" role="alert">{tekst.typenLaadFout}</p>
        ) : (
          <TypenBeheer typen={typen} medewerkers={alleMedewerkers.map((m) => ({ id: m.id, naam: m.naam }))} />
        )}
      </div>
    )
  }

  if (zicht.team) permanentRedirect(doorstuurPad('/agenda', zoek, { filter: 'leden' }, ['tab']))
  return <AgendaScherm t={t} vestiging={vestiging} zoek={zoek} basis="/afspraken" keuze={{ filters: ['leden'], actief: 'leden' }} />
}
