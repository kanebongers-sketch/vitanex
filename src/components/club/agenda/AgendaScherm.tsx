import Link from 'next/link'
import { ChevronLeft, ChevronRight, Shapes } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { onderdeelAfgenomen } from '@/lib/club/kern/pakketten'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { isoWeek, maandagUitWeekParam, maandagVan, nlDelen, nlNaarUtc, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { haalAgendaWeek } from '@/lib/club/agenda/data'
import { perDag } from '@/lib/club/agenda/model'
import type { AgendaFilter, AgendaKeuze, AgendaZicht } from '@/lib/club/agenda/filter'
import { haalAfspraken, haalAlleMedewerkers, haalTypen, metNamen } from '@/lib/club/afspraken/opslag'
import { nlDatumTijd, tijdvak } from '@/lib/club/afspraken/weergave'
import { AfsprakenAgenda } from '@/components/club/afspraken/AfsprakenAgenda'
import { AgendaWeek, type AgendaExtra } from './AgendaWeek'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { AGENDA } from '@/lib/aiyourgym/taal/woorden/club/agenda'
import './agenda.css'

// De Agenda (ontwerp "Club in 10 minuten", 03-11-2026): een scherm met
// filters in plaats van Agenda en Afspraken los. Met leden = de afspraken met
// trainers (eigen rechtensleutel afspraken), Team = de agenda van de vestiging,
// Alles = beide door elkaar per week. Het filter staat in de URL (?filter=).

type Zoek = Record<string, string | string[] | undefined>

/** Wat deze persoon van de agenda mag zien: recht, module en pakket. */
export function agendaZicht(t: ClubToegang): AgendaZicht {
  const ziet = (s: string) => magOnderdeel(t.onderdelen, s) && onderdeelAfgenomen(t.organisatie.afgenomen, s)
  return { team: ziet('agenda'), leden: ziet('afspraken') && moduleAan(t.organisatie, 'afspraken') }
}

interface Props {
  t: ClubToegang
  vestiging: Vestiging
  zoek: Zoek
  /** Het adres waar deze agenda staat: /agenda, of /afspraken voor wie alleen afspraken ziet. */
  basis: '/agenda' | '/afspraken'
  keuze: AgendaKeuze & { actief: AgendaFilter }
}

export async function AgendaScherm({ t, vestiging, zoek, basis, keuze }: Props) {
  const taal = await getTaal()
  const tekst = AGENDA[taal]
  const metFilter = basis === '/agenda'
  const pad = (filter: AgendaFilter, params: Record<string, string> = {}) => clubPad(basis, vestiging, { ...(metFilter && filter !== keuze.filters[0] ? { filter } : {}), ...params })
  const typenHref = clubPad('/afspraken', vestiging, { tab: 'typen' })
  const magTypen = keuze.filters.includes('leden') && kanBewerken(t, 'afspraken')

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
        {magTypen && (
          <div className="club-acties">
            <Link href={typenHref} className="club-knop club-knop--stil club-knop--klein"><Shapes size={15} aria-hidden /> {tekst.soortenAfspraken}</Link>
          </div>
        )}
      </header>
      {keuze.filters.length > 1 && (
        <nav className="club-segment ag-filters" aria-label={tekst.filters.label}>
          {keuze.filters.map((f) => (
            <Link key={f} href={pad(f)} aria-current={f === keuze.actief ? 'page' : undefined} scroll={false}>{tekst.filters[f]}</Link>
          ))}
        </nav>
      )}
      {keuze.actief === 'leden' ? (
        <AfsprakenAgenda t={t} vestiging={vestiging} zoek={zoek} pad={(p) => pad('leden', p)} typenHref={typenHref} />
      ) : (
        <TeamWeek t={t} vestiging={vestiging} zoek={zoek} taal={taal} metLeden={keuze.actief === 'alles'} pad={(p) => pad(keuze.actief, p)} ledenPad={(p) => pad('leden', p)} />
      )}
    </>
  )
}

interface TeamProps {
  t: ClubToegang
  vestiging: Vestiging
  zoek: Zoek
  taal: Taal
  /** Filter Alles: de afspraken met leden ertussen. */
  metLeden: boolean
  pad: (params?: Record<string, string>) => string
  ledenPad: (params: Record<string, string>) => string
}

/** De week van het team, in het filter Alles met de afspraken met leden erbij. */
async function TeamWeek({ t, vestiging, zoek, taal, metLeden, pad, ledenPad }: TeamProps) {
  const tekst = AGENDA[taal]
  const kort = (dag: string) => formatDatum(`${dag}T12:00:00Z`, taal, 'dagMaand')
  const vandaag = nlDelen(new Date()).datum
  const maandag = maandagUitWeekParam(zoek.week, vandaag)
  const [items, medewerkers, extra] = await Promise.all([
    haalAgendaWeek(t.admin, t.userId, vestiging, maandag),
    haalMedewerkers(t.admin, t.userId, vestiging),
    metLeden ? ledenVanWeek(t, vestiging, maandag, taal, ledenPad) : Promise.resolve([]),
  ])
  const dezeWeek = maandag === maandagVan(vandaag)
  return (
    <>
      <nav className="club-acties ag-nav" aria-label={tekst.weekKiezen}>
        <Link className="club-knop club-knop--klein" href={pad({ week: weekParam(plusDagen(maandag, -7)) })} aria-label={tekst.vorigeWeek} scroll={false}><ChevronLeft size={16} aria-hidden /></Link>
        <span className="ag-bereik">{tekst.boventitel(tekst.bereik(kort(maandag), kort(plusDagen(maandag, 6))), isoWeek(maandag).week)}</span>
        <Link className="club-knop club-knop--klein" href={pad({ week: weekParam(plusDagen(maandag, 7)) })} aria-label={tekst.volgendeWeek} scroll={false}><ChevronRight size={16} aria-hidden /></Link>
        {dezeWeek ? null : <Link className="club-knop club-knop--klein" href={pad()} scroll={false}>{tekst.dezeWeek}</Link>}
      </nav>
      {items === null || extra === null ? <p className="club-melding club-melding--fout" role="alert">{tekst.laadFout}</p> : null}
      {items !== null && (
        <AgendaWeek vestiging={vestiging} dagen={perDag(items, maandag)} vandaag={vandaag} medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))} extra={extra ?? []} />
      )}
    </>
  )
}

/** De afspraken met leden in deze week, als regels voor het filter Alles. Null = lezen mislukt. */
async function ledenVanWeek(t: ClubToegang, vestiging: Vestiging, maandag: string, taal: Taal, ledenPad: (p: Record<string, string>) => string): Promise<AgendaExtra[] | null> {
  const [ruw, typen, mensen] = await Promise.all([
    haalAfspraken(t.admin, t.userId, { van: nlNaarUtc(maandag, '00:00'), tot: nlNaarUtc(plusDagen(maandag, 7), '00:00'), vestiging }),
    haalTypen(t.admin, t.userId),
    haalAlleMedewerkers(t.admin, t.userId),
  ])
  if (!ruw || !typen) return null
  const lijst = await metNamen(t.admin, t.userId, ruw.filter((a) => nlDatumTijd(a.start).datum >= maandag), typen)
  if (!lijst) return null
  const naam = new Map((mensen ?? []).map((m) => [m.id, m.naam]))
  return lijst.map((a) => {
    const datum = nlDatumTijd(a.start).datum
    return {
      id: a.id,
      datum,
      beginOp: a.start,
      tijd: tijdvak(a, taal),
      titel: AGENDA[taal].metLid(a.typeNaam, a.lidNaam),
      meta: naam.get(a.medewerkerId) ?? '',
      href: ledenPad({ weergave: 'dag', dag: datum }),
    }
  })
}
