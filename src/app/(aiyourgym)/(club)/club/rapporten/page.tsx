import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { isAlles, keuzeZoek, maandKeuzes, rapportKeuze } from '@/lib/club/rapporten/keuze'
import { haalRapportVoorbeeld } from '@/lib/club/rapporten/haal'
import { RapportKeuzes } from '@/components/club/rapporten/RapportKeuzes'
import { RapportVoorbeeld } from '@/components/club/rapporten/RapportVoorbeeld'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { RAPPORTEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rapporten'
import '@/components/club/rapporten/rapporten.css'

// Rapporten en exports: kies een rapport, een kalendermaand (de 1e tot en met
// de laatste dag) en een of meer vestigingen. Je ziet de eerste rijen als
// voorbeeld en downloadt het hele rapport als CSV voor Excel. Alles staat in
// de URL (?rapport=bezoek&maand=2026-09&vs=budel), zodat het deelbaar is.

export async function generateMetadata(): Promise<Metadata> {
  return { title: RAPPORTEN_TEKST[await getTaal()].titel }
}

export default async function ClubRapporten({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  if (t.vestigingen.length === 0) return <GeenVestigingen />
  const taal = await getTaal()
  const tekst = RAPPORTEN_TEKST[taal]
  const zoek = await searchParams
  const vandaag = dagSleutel(new Date())
  const balk = kiesUit(t.vestigingen, zoek.v)
  const keuze = rapportKeuze(zoek, t.vestigingen, balk, vandaag)
  const alle = isAlles(keuze, t.vestigingen)
  const uitkomst = await haalRapportVoorbeeld(t.admin, t.userId, t.vestigingen, keuze)
  const csvHref = `/api/club/rapporten/csv?${keuzeZoek(keuze, alle).toString()}`

  return (
    <>
      <header className="club-paginakop club-rapporten-kop">
        <div>
          <p className="club-boventitel">{tekst.boventitel}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>
      <div className="club-rapporten">
        <RapportKeuzes keuze={keuze} vestigingen={t.vestigingen} balk={balk} maanden={maandKeuzes(vandaag, taal)} />
        <RapportVoorbeeld keuze={keuze} uitkomst={uitkomst} vestigingen={t.vestigingen} alle={alle} vandaag={vandaag} csvHref={csvHref} taal={taal} />
      </div>
    </>
  )
}
