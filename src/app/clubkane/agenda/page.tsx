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

export const metadata: Metadata = { title: 'Agenda' }

const KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const kort = (dag: string) => KORT.format(new Date(`${dag}T12:00:00Z`))

// De agenda van een vestiging: overleg, intakes, onderhoud en andere afspraken,
// per week. De week staat in de URL (?week=2026-W43), net als bij het rooster.
export default async function AgendaPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
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
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)} · week {isoWeek(maandag).week}</p>
          <h1>Agenda</h1>
          <p>Overleg, intakes, onderhoud en andere afspraken van de vestiging, per week.</p>
        </div>
        <nav className="club-acties ag-nav" aria-label="Week kiezen">
          <Link className="club-knop club-knop--klein" href={weekHref(plusDagen(maandag, -7))} aria-label="Vorige week"><ChevronLeft size={16} aria-hidden /></Link>
          <span className="ag-bereik">{kort(maandag)} – {kort(plusDagen(maandag, 6))}</span>
          <Link className="club-knop club-knop--klein" href={weekHref(plusDagen(maandag, 7))} aria-label="Volgende week"><ChevronRight size={16} aria-hidden /></Link>
          {dezeWeek ? null : <Link className="club-knop club-knop--klein" href={clubPad('/agenda', vestiging)}>Deze week</Link>}
        </nav>
      </section>
      {items === null ? (
        <p className="club-melding club-melding--fout" role="alert">De agenda kon niet geladen worden. Vernieuw de pagina.</p>
      ) : (
        <AgendaWeek vestiging={vestiging} dagen={perDag(items, maandag)} vandaag={vandaag} medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))} />
      )}
    </>
  )
}
