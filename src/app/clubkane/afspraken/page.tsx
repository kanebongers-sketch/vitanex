import type { Metadata } from 'next'
import Link from 'next/link'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { isDatum, isoWeek, isoWeekdag, maandagUitWeekParam, maandagVan, nlDelen, nlNaarUtc, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { haalAfspraken, haalAlleMedewerkers, haalOpenLeads, haalOpeningstijden, haalTypen, metNamen } from '@/lib/club/afspraken/opslag'
import { magGeven } from '@/lib/club/afspraken/regels'
import { isWeergave, nlDatumTijd, rasterVoorDag, tel } from '@/lib/club/afspraken/weergave'
import { AfsprakenNav } from '@/components/club/afspraken/AfsprakenNav'
import { AfsprakenWerkvlak } from '@/components/club/afspraken/AfsprakenWerkvlak'
import { TypenBeheer } from '@/components/club/afspraken/TypenBeheer'
import '@/components/club/afspraken/afspraken.css'

export const metadata: Metadata = { title: 'Afspraken' }

const eerste = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// Afspraken met trainers: intakes, personal training en metingen. Een week of
// een dag per trainer; daarnaast de soorten afspraken beheren. Week, dag,
// weergave en trainer staan in de URL.
export default async function AfsprakenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('afspraken')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const tab = eerste(zoek.tab) === 'typen' ? 'typen' : 'agenda'
  const [typen, alleMedewerkers] = await Promise.all([haalTypen(t.admin, t.userId), haalAlleMedewerkers(t.admin, t.userId)])

  const kop = (sub: string) => (
    <section className="club-paginakop">
      <div>
        <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}{sub}</p>
        <h1>Afspraken</h1>
        <p>Intakes, personal training en metingen per trainer. Alleen vrije tijden zijn te boeken, dubbel boeken kan niet.</p>
      </div>
      <nav className="club-segment" aria-label="Onderdeel">
        <Link href={clubPad('/afspraken', vestiging)} aria-current={tab === 'agenda' ? 'page' : undefined}>Agenda</Link>
        <Link href={clubPad('/afspraken', vestiging, { tab: 'typen' })} aria-current={tab === 'typen' ? 'page' : undefined}>Afspraaktypen</Link>
      </nav>
    </section>
  )

  if (tab === 'typen') {
    return (
      <div className="club-afspraken">
        {kop(' · afspraaktypen')}
        {typen === null || alleMedewerkers === null ? (
          <p className="club-melding club-melding--fout" role="alert">De afspraaktypen konden niet worden geladen. Ververs de pagina.</p>
        ) : (
          <TypenBeheer typen={typen} medewerkers={alleMedewerkers.map((m) => ({ id: m.id, naam: m.naam }))} />
        )}
      </div>
    )
  }

  const nu = new Date()
  const vandaag = nlDelen(nu).datum
  const weergave = isWeergave(eerste(zoek.weergave)) ? (eerste(zoek.weergave) as 'week' | 'dag') : 'week'
  const dagParam = eerste(zoek.dag)
  const dag = isDatum(dagParam) ? dagParam : vandaag
  const maandag = weergave === 'dag' ? maandagVan(dag) : maandagUitWeekParam(zoek.week, vandaag)
  const [vanDatum, totDatum] = weergave === 'dag' ? [dag, plusDagen(dag, 1)] : [maandag, plusDagen(maandag, 7)]

  const [medewerkers, ruw, leads, opening] = await Promise.all([
    haalMedewerkers(t.admin, t.userId, vestiging),
    haalAfspraken(t.admin, t.userId, { van: nlNaarUtc(vanDatum, '00:00'), tot: nlNaarUtc(totDatum, '00:00'), vestiging, metGeannuleerd: true }),
    haalOpenLeads(t.admin, t.userId, vestiging),
    haalOpeningstijden(t.admin, t.userId, vestiging),
  ])
  const lijst = ruw && typen ? await metNamen(t.admin, t.userId, ruw.filter((a) => nlDatumTijd(a.start).datum >= vanDatum), typen) : null

  const actieveTypen = (typen ?? []).filter((ty) => ty.actief)
  const typeTrainers = Object.fromEntries((typen ?? []).map((ty) => [ty.id, (medewerkers ?? []).filter((m) => magGeven(ty, m, vestiging)).map((m) => m.id)]))
  const geeftIets = new Set(Object.values(typeTrainers).flat())
  const metAfspraak = new Set((lijst ?? []).map((a) => a.medewerkerId))
  const trainers = (alleMedewerkers ?? []).filter((m) => geeftIets.has(m.id) || metAfspraak.has(m.id)).map((m) => ({ id: m.id, naam: m.naam }))
  const filterParam = eerste(zoek.trainer)
  const filterTrainer = trainers.some((m) => m.id === filterParam) ? (filterParam as string) : null
  const zichtbaar = (lijst ?? []).filter((a) => !filterTrainer || a.medewerkerId === filterTrainer)

  const basis: Record<string, string> = { ...(weergave === 'dag' ? { weergave: 'dag', dag } : { week: weekParam(maandag) }), ...(filterTrainer ? { trainer: filterTrainer } : {}) }
  const href = (extra: Record<string, string | null>) => {
    const samen = Object.fromEntries(Object.entries({ ...basis, ...extra }).filter((e): e is [string, string] => e[1] !== null))
    return clubPad('/afspraken', vestiging, samen)
  }
  const isWeek = weergave === 'week'

  return (
    <div className="club-afspraken">
      {kop(isWeek ? ` · week ${isoWeek(maandag).week}` : '')}
      {lijst === null || medewerkers === null ? (
        <p className="club-melding club-melding--fout" role="alert">De afspraken konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>
      ) : null}
      {typen !== null && actieveTypen.length === 0 ? (
        <p className="club-melding">Er zijn nog geen soorten afspraken. <Link href={clubPad('/afspraken', vestiging, { tab: 'typen' })}>Maak er eerst een aan</Link>.</p>
      ) : null}
      <AfsprakenNav
        weergave={weergave}
        periode={isWeek ? { begin: maandag, eind: plusDagen(maandag, 6) } : { begin: dag, eind: dag }}
        href={href}
        vorige={isWeek ? weekParam(plusDagen(maandag, -7)) : plusDagen(dag, -1)}
        volgende={isWeek ? weekParam(plusDagen(maandag, 7)) : plusDagen(dag, 1)}
        isNu={isWeek ? maandag === maandagVan(vandaag) : dag === vandaag}
        trainers={trainers}
        filterTrainer={filterTrainer}
        tellers={tel(zichtbaar)}
      />
      <AfsprakenWerkvlak
        vestiging={vestiging}
        weergave={weergave}
        maandag={maandag}
        dag={dag}
        vandaag={vandaag}
        nuMinuten={nlDelen(nu).minuten}
        afspraken={zichtbaar}
        trainers={filterTrainer ? trainers.filter((m) => m.id === filterTrainer) : trainers}
        namen={(alleMedewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
        typen={actieveTypen}
        typeTrainers={typeTrainers}
        leads={leads ?? []}
        raster={rasterVoorDag(opening, isoWeekdag(dag))}
        filterTrainer={filterTrainer}
      />
    </div>
  )
}
