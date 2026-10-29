import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { isoWeek, maandagUitWeekParam, maandagVan, nlDelen, plusDagen, weekParam } from '@/lib/club/rooster/tijd'
import { haalAgendaWeek } from '@/lib/club/agenda/data'
import { perDag } from '@/lib/club/agenda/model'
import { AgendaWeek } from '@/components/club/agenda/AgendaWeek'
import '@/components/club/agenda/agenda.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { AGENDA } from '@/lib/aiyourgym/taal/woorden/club/agenda'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(AGENDA)).titel }
}

// De agenda van een vestiging: overleg, intakes, onderhoud en andere afspraken,
// per week. De week staat in de URL (?week=2026-W43), net als bij het rooster.
export default async function AgendaPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const taal = await getTaal()
  const tekst = AGENDA[taal]
  const kort = (dag: string) => formatDatum(`${dag}T12:00:00Z`, taal, 'dagMaand')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const vandaag = nlDelen(new Date()).datum
  const maandag = maandagUitWeekParam(zoek.week, vandaag)
  const [items, medewerkers] = await Promise.all([
    haalAgendaWeek(t.admin, t.userId, vestiging, maandag),
    haalMedewerkers(t.admin, t.userId, vestiging),
  ])
  const dezeWeek = maandag === maandagVan(vandaag)
  const weekHref = (m: string) => clubPad('/agenda', vestiging, { week: weekParam(m) })

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{tekst.boventitel(naamVan(t.vestigingen, vestiging), isoWeek(maandag).week)}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
        <nav className="club-acties ag-nav" aria-label={tekst.weekKiezen}>
          <Link className="club-knop club-knop--klein" href={weekHref(plusDagen(maandag, -7))} aria-label={tekst.vorigeWeek}><ChevronLeft size={16} aria-hidden /></Link>
          <span className="ag-bereik">{tekst.bereik(kort(maandag), kort(plusDagen(maandag, 6)))}</span>
          <Link className="club-knop club-knop--klein" href={weekHref(plusDagen(maandag, 7))} aria-label={tekst.volgendeWeek}><ChevronRight size={16} aria-hidden /></Link>
          {dezeWeek ? null : <Link className="club-knop club-knop--klein" href={clubPad('/agenda', vestiging)}>{tekst.dezeWeek}</Link>}
        </nav>
      </section>
      {items === null ? (
        <p className="club-melding club-melding--fout" role="alert">{tekst.laadFout}</p>
      ) : (
        <AgendaWeek vestiging={vestiging} dagen={perDag(items, maandag)} vandaag={vandaag} medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))} />
      )}
    </>
  )
}
