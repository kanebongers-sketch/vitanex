import type { Metadata } from 'next'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type Vestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { haalLedenRijen } from '@/lib/club/leden/data'
import { filterKeuzes, filterRijen, heeftFilter, leesLijstParams, pagineer, sorteerRijen, telTegels } from '@/lib/club/leden/lijst'
import { LedenTegels } from '@/components/club/leden/LedenTegels'
import { LedenFilters } from '@/components/club/leden/LedenFilters'
import { LedenTabel } from '@/components/club/leden/LedenTabel'
import '@/components/club/leden/leden.css'

export const metadata: Metadata = { title: 'Leden' }

export default async function LedenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const ruw = await searchParams
  const vestiging = kiesVestiging(ruw.v)
  const params = leesLijstParams(ruw)
  const nu = new Date()
  const [rijen, medewerkers] = await Promise.all([
    haalLedenRijen(t.admin, t.userId, vestiging, nu),
    haalMedewerkers(t.admin, t.userId, vestiging),
  ])

  if (!rijen) {
    return (
      <>
        <LedenKop vestiging={vestiging} totaal={null} />
        <p className="club-melding club-melding--fout" role="alert">De leden konden niet worden geladen. Ververs de pagina of probeer het zo nog eens.</p>
      </>
    )
  }

  const gefilterd = sorteerRijen(filterRijen(rijen, params), params.sort, params.oplopend)
  const keuzes = filterKeuzes(rijen)
  return (
    <>
      <LedenKop vestiging={vestiging} totaal={rijen.length} />
      <LedenTegels tellingen={telTegels(rijen, params.q)} params={params} vestiging={vestiging} />
      <LedenFilters
        params={params}
        vestiging={vestiging}
        abonnementen={keuzes.abonnementen}
        tags={keuzes.tags}
        coaches={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
      />
      <LedenTabel pagina={pagineer(gefilterd, params.pagina)} params={params} vestiging={vestiging} nu={nu} gefilterd={heeftFilter(params)} />
    </>
  )
}

function LedenKop({ vestiging, totaal }: { vestiging: Vestiging; totaal: number | null }) {
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{VESTIGING_LABEL[vestiging]}</p>
        <h1>Leden</h1>
        <p>
          {totaal === null ? 'Ledenlijst' : `${totaal} leden in deze vestiging`}. Bezoek en behoud tellen check-ins in alle vestigingen. Geld en contracten staan in Sportivity.
        </p>
      </div>
      <Link href={clubPad('/leden/importeren', vestiging)} className="club-knop">
        <Upload size={16} aria-hidden /> Ledenbestand inlezen
      </Link>
    </header>
  )
}
