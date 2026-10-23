import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { initialen, LID_STATUS_LABEL, volledigeNaam } from '@/lib/club/kern/lid'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { lijstZoek, STANDAARD_PARAMS, type LedenRij, type LijstParams, type Pagina, type SorteerSleutel } from '@/lib/club/leden/lijst'
import { datumUitSleutel, laatsteBezoekTekst } from '@/lib/club/leden/tijd'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'
import { Behoudsignaal } from './Behoudsignaal'
import { RijKlik } from './RijKlik'

// De ledenlijst: een compacte tabel, sorteren via de kopjes, een rij opent de
// ledenkaart. Op een telefoon wordt elke rij een kaart (CSS, data-label).
// Geen bedragen: geld en contracten staan in Sportivity.

interface LedenTabelProps {
  pagina: Pagina<LedenRij>
  params: LijstParams
  vestiging: Vestiging
  nu: Date
  /** Staat er een zoekterm of filter aan? Dan een andere lege staat. */
  gefilterd: boolean
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
  { sleutel: 'bezoeken', label: 'Bezoeken 30 dagen', aflopendEerst: true, getal: true },
  { sleutel: 'behoud', label: 'Behoud' },
]

function Kop({ kolom, params, vestiging }: { kolom: Kolom; params: LijstParams; vestiging: Vestiging }) {
  const actief = params.sort === kolom.sleutel
  const oplopend = actief ? !params.oplopend : !kolom.aflopendEerst
  const href = clubPad('/leden', vestiging, lijstZoek(params, { sort: kolom.sleutel, oplopend }))
  const richting = actief ? (params.oplopend ? 'ascending' : 'descending') : undefined
  const uitleg = `Sorteer op ${kolom.label.toLowerCase()}, ${oplopend ? 'oplopend' : 'aflopend'}`
  return (
    <th scope="col" aria-sort={richting} className={kolom.getal ? 'club-leden-getalkolom' : undefined}>
      <Link href={href} scroll={false} className="club-leden-sorteer" data-actief={actief || undefined} aria-label={uitleg}>
        {kolom.label}
        {actief ? (params.oplopend ? <ArrowUp aria-hidden size={13} /> : <ArrowDown aria-hidden size={13} />) : null}
      </Link>
    </th>
  )
}

function LaatsteBezoek({ rij, nu }: { rij: LedenRij; nu: Date }) {
  if (rij.laatsteBezoek) return <>{laatsteBezoekTekst(rij.laatsteBezoek, nu)}</>
  const sinds = datumUitSleutel(rij.lid.lidSinds)
  return (
    <span className="club-leden-nooit">
      <span>Nog nooit</span>
      {sinds ? <span className="club-zacht">Ingeschreven {sinds}</span> : null}
    </span>
  )
}

function Rij({ rij, vestiging, nu }: { rij: LedenRij; vestiging: Vestiging; nu: Date }) {
  const { lid } = rij
  const href = clubPad(`/leden/${lid.id}`, vestiging)
  return (
    <tr data-href={href} className="club-leden-rij">
      <td className="club-leden-cel-naam">
        <div className="club-leden-naamcel">
          <span className="club-avatar" aria-hidden>{initialen(lid)}</span>
          <span className="club-rij-hoofd">
            <span className="club-leden-naamregel">
              <Link href={href} className="club-rij-titel">{volledigeNaam(lid)}</Link>
              {rij.heeftApp ? <span className="club-chip club-chip--ok club-leden-appchip" title="Gebruikt de ledenapp">App</span> : null}
            </span>
            <span className="club-rij-sub">{lid.tags.length ? lid.tags.join(' · ') : (lid.email ?? '')}</span>
          </span>
        </div>
      </td>
      <td className="club-getal club-zacht club-leden-cel-nummer" data-label="Lidnummer">{lid.lidnummer ?? 'Onbekend'}</td>
      <td className="club-leden-cel-status" data-label="Status"><span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{LID_STATUS_LABEL[lid.status]}</span></td>
      <td className="club-leden-abonnement" data-label="Abonnement">{lid.abonnement ?? <span className="club-zacht">Onbekend</span>}</td>
      <td className="club-leden-cel-bezoek" data-label="Laatste bezoek"><LaatsteBezoek rij={rij} nu={nu} /></td>
      <td className="club-getal club-leden-getalkolom" data-label="Bezoeken 30 dagen" data-kort="30 dagen">{rij.bezoeken30}</td>
      <td className="club-leden-cel-behoud" data-label="Behoud">
        <Behoudsignaal behoud={rij.behoud} geenTekst={lid.status === 'opgezegd' ? 'Opgezegd: geen score' : 'Geen score: geen bezoek verwacht'} />
      </td>
    </tr>
  )
}

function Paginering({ pagina, params, vestiging }: Pick<LedenTabelProps, 'pagina' | 'params' | 'vestiging'>) {
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

function Leeg({ params, vestiging, gefilterd }: Pick<LedenTabelProps, 'params' | 'vestiging' | 'gefilterd'>) {
  if (!gefilterd) {
    return (
      <div className="club-leeg club-leden-leeg" role="status">
        <p>Er staan nog geen leden in deze vestiging. Lees een export uit je huidige systeem of een Excel-lijst in om te beginnen.</p>
        <Link href={clubPad('/leden/importeren', vestiging)} className="club-knop club-knop--klein">Ledenbestand inlezen</Link>
      </div>
    )
  }
  const wis = clubPad('/leden', vestiging, lijstZoek({ ...STANDAARD_PARAMS, sort: params.sort, oplopend: params.oplopend }))
  return (
    <div className="club-leeg club-leden-leeg" role="status">
      <p>Geen leden gevonden{params.q ? <> voor &ldquo;{params.q}&rdquo;</> : null} met deze filters.</p>
      <Link href={wis} className="club-knop club-knop--klein" scroll={false}>Wis zoekterm en filters</Link>
    </div>
  )
}

export function LedenTabel({ pagina, params, vestiging, nu, gefilterd }: LedenTabelProps) {
  if (pagina.totaal === 0) return <Leeg params={params} vestiging={vestiging} gefilterd={gefilterd} />
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
