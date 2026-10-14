import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { initialen, LID_STATUS_LABEL, volledigeNaam } from '@/lib/club/gedeeld/lid'
import { clubPad, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { lijstZoek, type LedenRij, type LijstParams, type Pagina, type SorteerSleutel } from '@/lib/club/leden/lijst'
import { laatsteBezoekTekst } from '@/lib/club/leden/tijd'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'
import { Behoudsignaal } from './Behoudsignaal'
import { RijKlik } from './RijKlik'

// De ledenlijst: een compacte tabel, sorteren via de kopjes, een rij opent de
// ledenkaart. Geen bedragen: geld en contracten staan in Sportivity.

interface LedenTabelProps {
  pagina: Pagina<LedenRij>
  params: LijstParams
  vestiging: Vestiging
  nu: Date
}

interface Kolom {
  sleutel: SorteerSleutel
  label: string
  /** Eerste klik sorteert aflopend (hoogste/nieuwste eerst). */
  aflopendEerst?: boolean
  getal?: boolean
}

const KOLOMMEN: Kolom[] = [
  { sleutel: 'naam', label: 'Lid' },
  { sleutel: 'lidnummer', label: 'Lidnummer' },
  { sleutel: 'status', label: 'Status' },
  { sleutel: 'abonnement', label: 'Abonnement' },
  { sleutel: 'bezoek', label: 'Laatste bezoek', aflopendEerst: true },
  { sleutel: 'bezoeken', label: '30 dagen', aflopendEerst: true, getal: true },
  { sleutel: 'behoud', label: 'Behoud' },
]

function Kop({ kolom, params, vestiging }: { kolom: Kolom; params: LijstParams; vestiging: Vestiging }) {
  const actief = params.sort === kolom.sleutel
  const oplopend = actief ? !params.oplopend : !kolom.aflopendEerst
  const href = clubPad('/leden', vestiging, lijstZoek(params, { sort: kolom.sleutel, oplopend }))
  const richting = actief ? (params.oplopend ? 'ascending' : 'descending') : undefined
  return (
    <th scope="col" aria-sort={richting} className={kolom.getal ? 'club-leden-getalkolom' : undefined}>
      <Link href={href} scroll={false} className="club-leden-sorteer" data-actief={actief || undefined}>
        {kolom.label}
        {actief ? (params.oplopend ? <ArrowUp aria-hidden size={13} /> : <ArrowDown aria-hidden size={13} />) : null}
      </Link>
    </th>
  )
}

function Rij({ rij, vestiging, nu }: { rij: LedenRij; vestiging: Vestiging; nu: Date }) {
  const { lid } = rij
  const href = clubPad(`/leden/${lid.id}`, vestiging)
  return (
    <tr data-href={href} className="club-leden-rij">
      <td>
        <div className="club-leden-naamcel">
          <span className="club-avatar" aria-hidden>{initialen(lid)}</span>
          <span className="club-rij-hoofd">
            <Link href={href} className="club-rij-titel">{volledigeNaam(lid)}</Link>
            <span className="club-rij-sub">{lid.tags.length ? lid.tags.join(' · ') : (lid.email ?? '')}</span>
          </span>
        </div>
      </td>
      <td className="club-getal club-zacht">{lid.lidnummer ?? '·'}</td>
      <td><span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{LID_STATUS_LABEL[lid.status]}</span></td>
      <td className="club-leden-abonnement">{lid.abonnement ?? <span className="club-zacht">Onbekend</span>}</td>
      <td className={rij.laatsteBezoek ? undefined : 'club-zacht'}>{laatsteBezoekTekst(rij.laatsteBezoek, nu)}</td>
      <td className="club-getal club-leden-getalkolom">{rij.bezoeken30}</td>
      <td><Behoudsignaal behoud={rij.behoud} geenTekst={lid.status === 'opgezegd' ? 'Opgezegd' : 'Geen bezoek verwacht'} /></td>
    </tr>
  )
}

function Paginering({ pagina, params, vestiging }: Omit<LedenTabelProps, 'nu'>) {
  if (pagina.paginas <= 1) return null
  const naar = (p: number) => clubPad('/leden', vestiging, lijstZoek(params, { pagina: p }))
  return (
    <nav className="club-leden-pager" aria-label="Pagina's">
      {pagina.pagina > 1
        ? <Link className="club-knop club-knop--klein" href={naar(pagina.pagina - 1)}><ChevronLeft aria-hidden size={15} /> Vorige</Link>
        : <span className="club-knop club-knop--klein" aria-disabled="true"><ChevronLeft aria-hidden size={15} /> Vorige</span>}
      <span className="club-zacht club-getal">Pagina {pagina.pagina} van {pagina.paginas}</span>
      {pagina.pagina < pagina.paginas
        ? <Link className="club-knop club-knop--klein" href={naar(pagina.pagina + 1)}>Volgende <ChevronRight aria-hidden size={15} /></Link>
        : <span className="club-knop club-knop--klein" aria-disabled="true">Volgende <ChevronRight aria-hidden size={15} /></span>}
    </nav>
  )
}

export function LedenTabel({ pagina, params, vestiging, nu }: LedenTabelProps) {
  if (pagina.totaal === 0) {
    return <p className="club-leeg">Geen leden gevonden met deze zoekopdracht of filters.</p>
  }
  return (
    <section className="club-leden-lijst" aria-label="Ledenlijst">
      <div className="club-tabel-wrap">
        <table className="club-tabel club-leden-tabel">
          <caption className="club-sr">Leden, {pagina.van} tot {pagina.tot} van {pagina.totaal}</caption>
          <thead>
            <tr>{KOLOMMEN.map((k) => <Kop key={k.sleutel} kolom={k} params={params} vestiging={vestiging} />)}</tr>
          </thead>
          <RijKlik>
            {pagina.rijen.map((r) => <Rij key={r.lid.id} rij={r} vestiging={vestiging} nu={nu} />)}
          </RijKlik>
        </table>
      </div>
      <div className="club-leden-voet">
        <span className="club-zacht club-getal">{pagina.van} tot {pagina.tot} van {pagina.totaal} leden</span>
        <Paginering pagina={pagina} params={params} vestiging={vestiging} />
      </div>
    </section>
  )
}
