import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { isDatum, isoWeekdag, maandagUitWeekParam, maandagVan, nlDelen, nlNaarUtc, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { haalAfspraken, haalAlleMedewerkers, haalOpenLeads, haalOpeningstijden, haalTypen, metNamen } from '@/lib/club/afspraken/opslag'
import { magGeven } from '@/lib/club/afspraken/regels'
import { isWeergave, nlDatumTijd, rasterVoorDag, tel } from '@/lib/club/afspraken/weergave'
import { AfsprakenNav } from './AfsprakenNav'
import { AfsprakenWerkvlak } from './AfsprakenWerkvlak'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import './afspraken.css'

// De afspraken met leden (filter "Met leden" van de Agenda): een week of een
// dag per trainer. Week, dag, weergave en trainer staan in de URL; `href`
// bouwt de links op het adres waar de Agenda staat (/club/agenda of het oude
// /club/afspraken voor wie de agenda van het team niet ziet).

type Zoek = Record<string, string | string[] | undefined>

interface Props {
  t: ClubToegang
  vestiging: Vestiging
  zoek: Zoek
  /** Een link binnen deze agenda met de gegeven parameters. */
  pad: (params: Record<string, string>) => string
  /** Link naar het beheer van de soorten afspraken. */
  typenHref: string
}

const eerste = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export async function AfsprakenAgenda({ t, vestiging, zoek, pad, typenHref }: Props) {
  const tekst = AFSPRAKEN[await getTaal()]
  const nu = new Date()
  const vandaag = nlDelen(nu).datum
  const weergave = isWeergave(eerste(zoek.weergave)) ? (eerste(zoek.weergave) as 'week' | 'dag') : 'week'
  const dagParam = eerste(zoek.dag)
  const dag = isDatum(dagParam) ? dagParam : vandaag
  const maandag = weergave === 'dag' ? maandagVan(dag) : maandagUitWeekParam(zoek.week, vandaag)
  const [vanDatum, totDatum] = weergave === 'dag' ? [dag, plusDagen(dag, 1)] : [maandag, plusDagen(maandag, 7)]

  const [typen, alleMedewerkers, medewerkers, ruw, leads, opening] = await Promise.all([
    haalTypen(t.admin, t.userId),
    haalAlleMedewerkers(t.admin, t.userId),
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
  const href = (extra: Record<string, string | null>) => pad(Object.fromEntries(Object.entries({ ...basis, ...extra }).filter((e): e is [string, string] => e[1] !== null)))
  const isWeek = weergave === 'week'

  return (
    <div className="club-afspraken">
      {lijst === null || medewerkers === null ? <p className="club-melding club-melding--fout" role="alert">{tekst.laadFout}</p> : null}
      {typen !== null && actieveTypen.length === 0 ? (
        <p className="club-melding">{tekst.geenTypen.voor}<Link href={typenHref}>{tekst.geenTypen.link}</Link>{tekst.geenTypen.na}</p>
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
