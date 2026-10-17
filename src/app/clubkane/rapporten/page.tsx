import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { isAlles, keuzeZoek, maandKeuzes, rapportKeuze } from '@/lib/club/rapporten/keuze'
import { haalRapportTabel } from '@/lib/club/rapporten/haal'
import { RapportKeuzes } from '@/components/club/rapporten/RapportKeuzes'
import { RapportVoorbeeld } from '@/components/club/rapporten/RapportVoorbeeld'
import '@/components/club/rapporten/rapporten.css'

// Rapporten en exports: kies een rapport, een kalendermaand (de 1e tot en met
// de laatste dag) en een of meer vestigingen. Je ziet de eerste rijen als
// voorbeeld en downloadt het hele rapport als CSV voor Excel. Alles staat in
// de URL (?rapport=bezoek&maand=2026-09&vs=budel), zodat het deelbaar is.

export const metadata: Metadata = { title: 'Rapporten' }

export default async function ClubRapporten({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  if (t.vestigingen.length === 0) return <GeenVestigingen />
  const zoek = await searchParams
  const vandaag = dagSleutel(new Date())
  const balk = kiesUit(t.vestigingen, zoek.v)
  const keuze = rapportKeuze(zoek, t.vestigingen, balk, vandaag)
  const alle = isAlles(keuze, t.vestigingen)
  const uitkomst = await haalRapportTabel(t.admin, t.userId, t.vestigingen, keuze)
  const csvHref = `/api/club/rapporten/csv?${keuzeZoek(keuze, alle).toString()}`

  return (
    <>
      <header className="club-paginakop club-rapporten-kop">
        <div>
          <p className="club-boventitel">Beheer · rapporten en exports</p>
          <h1>Rapporten</h1>
          <p>Elk rapport beslaat een hele kalendermaand, van de 1e tot en met de laatste dag. Bekijk de eerste rijen en download het geheel als CSV voor Excel.</p>
        </div>
      </header>
      <div className="club-rapporten">
        <RapportKeuzes keuze={keuze} vestigingen={t.vestigingen} balk={balk} maanden={maandKeuzes(vandaag)} />
        <RapportVoorbeeld keuze={keuze} uitkomst={uitkomst} vestigingen={t.vestigingen} alle={alle} vandaag={vandaag} csvHref={csvHref} />
      </div>
    </>
  )
}
