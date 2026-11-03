import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { eisOnderdeel } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { onderdeelAfgenomen } from '@/lib/club/kern/pakketten'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { doorstuurPad } from '@/lib/club/kern/doorsturen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { OpvolgenTab } from '@/components/club/leads/OpvolgenTab'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(OPVOLGEN)).pagina.titel }
}

// Opvolgen staat sinds het ontwerp "Club in 10 minuten" (03-11-2026) als
// tabblad in Leden · Leads: dit adres geeft een 308 daarheen met de
// zoekstring erbij. Wie Leads niet mag zien, houdt hier de opvolglijst.

export default async function OpvolgenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('opvolgen')
  const zoek = await searchParams
  const leads = magOnderdeel(t.onderdelen, 'leads') && onderdeelAfgenomen(t.organisatie.afgenomen, 'leads') && moduleAan(t.organisatie, 'leads')
  if (leads) permanentRedirect(doorstuurPad('/leads', zoek, { tab: 'opvolgen' }))
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const taal = await getTaal()
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{OPVOLGEN[taal].pagina.titel}</h1>
          <p>{LEADS[taal].pagina.introOpvolgen}</p>
        </div>
      </header>
      <OpvolgenTab t={t} vestiging={vestiging} />
    </>
  )
}
