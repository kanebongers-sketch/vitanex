import type { Metadata } from 'next'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type Vestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { haalLedenRijen } from '@/lib/club/leden/data'
import { filterKeuzes, filterRijen, heeftFilter, leesLijstParams, pagineer, sorteerRijen, telTegels } from '@/lib/club/leden/lijst'
import { LedenTegels } from '@/components/club/leden/LedenTegels'
import { LedenFilters } from '@/components/club/leden/LedenFilters'
import { LedenTabel } from '@/components/club/leden/LedenTabel'
import { UitnodigApp } from '@/components/club/leden/app-uitnodigen/UitnodigApp'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { NieuweLedenKnoppen } from '@/components/club/nieuwe-leden/NieuweLedenKnoppen'
import { knoppenData, type KnoppenData } from '@/lib/club/nieuwe-leden/knoppen-data'
import '@/components/club/leden/leden.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEDEN)).pagina.titel }
}

export default async function LedenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const ruw = await searchParams
  const vestiging = kiesUit(t.vestigingen, ruw.v)
  if (!vestiging) return <GeenVestigingen />
  const params = leesLijstParams(ruw)
  const nu = new Date()
  const taal = await getTaal()
  const bewerken = kanBewerken(t, 'leden')
  const [rijen, medewerkers, knoppen] = await Promise.all([
    haalLedenRijen(t.admin, t.userId, vestiging, nu, taal),
    haalMedewerkers(t.admin, t.userId, vestiging),
    bewerken ? knoppenData(t.admin, t.organisatie, vestiging) : null,
  ])

  if (!rijen) {
    return (
      <>
        <LedenKop vestiging={vestiging} naam={naamVan(t.vestigingen, vestiging)} totaal={null} vestigingen={t.vestigingen} taal={taal} knoppen={knoppen} />
        <p className="club-melding club-melding--fout" role="alert">{LEDEN[taal].pagina.ladenFout}</p>
      </>
    )
  }

  const gefilterd = sorteerRijen(filterRijen(rijen, params), params.sort, params.oplopend)
  const keuzes = filterKeuzes(rijen)
  return (
    <>
      <LedenKop vestiging={vestiging} naam={naamVan(t.vestigingen, vestiging)} totaal={rijen.length} vestigingen={t.vestigingen} taal={taal} knoppen={knoppen} />
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

interface LedenKopProps {
  vestiging: Vestiging
  naam: string
  totaal: number | null
  vestigingen: readonly VestigingInfo[]
  taal: Taal
  /** Alleen zien (rollen v2): null, dan geen knoppen om toe te voegen, uit te nodigen of in te lezen. */
  knoppen: KnoppenData | null
}

function LedenKop({ vestiging, naam, totaal, vestigingen, taal, knoppen }: LedenKopProps) {
  const p = LEDEN[taal].pagina
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{naam}</p>
        <h1>{p.titel}</h1>
        <p>
          {totaal === null ? p.ledenlijst : p.inVestiging(totaal)}. {p.uitleg}
        </p>
      </div>
      {knoppen && (
        <div className="club-leden-kopknoppen">
          <NieuweLedenKnoppen {...knoppen} />
          <UitnodigApp vestigingen={vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))} huidig={vestiging} posterHref={clubPad('/leden/app-poster', vestiging)} />
          <Link href={clubPad('/leden/importeren', vestiging)} className="club-knop">
            <Upload size={16} aria-hidden /> {p.inlezen}
          </Link>
        </div>
      )}
    </header>
  )
}
