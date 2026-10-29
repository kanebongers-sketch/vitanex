import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { initialen, lidStatusLabel, volledigeNaam } from '@/lib/club/kern/lid'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
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

type LedenTekst = (typeof LEDEN)['nl']

interface Kolom {
  sleutel: SorteerSleutel
  /** Eerste klik sorteert aflopend (hoogste/nieuwste eerst). */
  aflopendEerst?: boolean
  getal?: boolean
}

const KOLOMMEN: Kolom[] = [
  { sleutel: 'naam' },
  { sleutel: 'lidnummer' },
  { sleutel: 'status' },
  { sleutel: 'abonnement' },
  { sleutel: 'bezoek', aflopendEerst: true },
  { sleutel: 'bezoeken', aflopendEerst: true, getal: true },
  { sleutel: 'behoud' },
]

function Kop({ kolom, params, vestiging, t }: { kolom: Kolom; params: LijstParams; vestiging: Vestiging; t: LedenTekst }) {
  const label = t.tabel.kolommen[kolom.sleutel]
  const actief = params.sort === kolom.sleutel
  const oplopend = actief ? !params.oplopend : !kolom.aflopendEerst
  const href = clubPad('/leden', vestiging, lijstZoek(params, { sort: kolom.sleutel, oplopend }))
  const richting = actief ? (params.oplopend ? 'ascending' : 'descending') : undefined
  const uitleg = t.tabel.sorteerOp(label.toLowerCase(), oplopend)
  return (
    <th scope="col" aria-sort={richting} className={kolom.getal ? 'club-leden-getalkolom' : undefined}>
      <Link href={href} scroll={false} className="club-leden-sorteer" data-actief={actief || undefined} aria-label={uitleg}>
        {label}
        {actief ? (params.oplopend ? <ArrowUp aria-hidden size={13} /> : <ArrowDown aria-hidden size={13} />) : null}
      </Link>
    </th>
  )
}

function LaatsteBezoek({ rij, nu, t, taal }: { rij: LedenRij; nu: Date; t: LedenTekst; taal: Taal }) {
  if (rij.laatsteBezoek) return <>{laatsteBezoekTekst(rij.laatsteBezoek, nu, taal)}</>
  const sinds = datumUitSleutel(rij.lid.lidSinds, taal)
  return (
    <span className="club-leden-nooit">
      <span>{t.tabel.nogNooit}</span>
      {sinds ? <span className="club-zacht">{t.tabel.ingeschreven(sinds)}</span> : null}
    </span>
  )
}

function Rij({ rij, vestiging, nu, t, taal }: { rij: LedenRij; vestiging: Vestiging; nu: Date; t: LedenTekst; taal: Taal }) {
  const { lid } = rij
  const k = t.tabel.kolommen
  const href = clubPad(`/leden/${lid.id}`, vestiging)
  return (
    <tr data-href={href} className="club-leden-rij">
      <td className="club-leden-cel-naam">
        <div className="club-leden-naamcel">
          <span className="club-avatar" aria-hidden>{initialen(lid)}</span>
          <span className="club-rij-hoofd">
            <span className="club-leden-naamregel">
              <Link href={href} className="club-rij-titel">{volledigeNaam(lid)}</Link>
              {rij.heeftApp ? <span className="club-chip club-chip--ok club-leden-appchip" title={t.tabel.appTitel}>{t.tabel.app}</span> : null}
            </span>
            <span className="club-rij-sub">{lid.tags.length ? lid.tags.join(' · ') : (lid.email ?? '')}</span>
          </span>
        </div>
      </td>
      <td className="club-getal club-zacht club-leden-cel-nummer" data-label={k.lidnummer}>{lid.lidnummer ?? t.tabel.onbekend}</td>
      <td className="club-leden-cel-status" data-label={k.status}><span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{lidStatusLabel(lid.status, taal)}</span></td>
      <td className="club-leden-abonnement" data-label={k.abonnement}>{lid.abonnement ?? <span className="club-zacht">{t.tabel.onbekend}</span>}</td>
      <td className="club-leden-cel-bezoek" data-label={k.bezoek}><LaatsteBezoek rij={rij} nu={nu} t={t} taal={taal} /></td>
      <td className="club-getal club-leden-getalkolom" data-label={k.bezoeken} data-kort={t.tabel.dertigDagen}>{rij.bezoeken30}</td>
      <td className="club-leden-cel-behoud" data-label={k.behoud}>
        <Behoudsignaal behoud={rij.behoud} taal={taal} geenTekst={lid.status === 'opgezegd' ? t.tabel.opgezegdGeenScore : t.tabel.geenScore} />
      </td>
    </tr>
  )
}

function Paginering({ pagina, params, vestiging, t }: Pick<LedenTabelProps, 'pagina' | 'params' | 'vestiging'> & { t: LedenTekst }) {
  if (pagina.paginas <= 1) return null
  const naar = (p: number) => clubPad('/leden', vestiging, lijstZoek(params, { pagina: p }))
  return (
    <nav className="club-leden-pager" aria-label={t.tabel.paginas}>
      {pagina.pagina > 1
        ? <Link className="club-knop club-knop--klein" href={naar(pagina.pagina - 1)}><ChevronLeft aria-hidden size={15} /> {t.tabel.vorige}</Link>
        : <span className="club-knop club-knop--klein" aria-disabled="true"><ChevronLeft aria-hidden size={15} /> {t.tabel.vorige}</span>}
      <span className="club-zacht club-getal">{t.tabel.paginaVan(pagina.pagina, pagina.paginas)}</span>
      {pagina.pagina < pagina.paginas
        ? <Link className="club-knop club-knop--klein" href={naar(pagina.pagina + 1)}>{t.tabel.volgende} <ChevronRight aria-hidden size={15} /></Link>
        : <span className="club-knop club-knop--klein" aria-disabled="true">{t.tabel.volgende} <ChevronRight aria-hidden size={15} /></span>}
    </nav>
  )
}

function Leeg({ params, vestiging, gefilterd, t }: Pick<LedenTabelProps, 'params' | 'vestiging' | 'gefilterd'> & { t: LedenTekst }) {
  if (!gefilterd) {
    return (
      <div className="club-leeg club-leden-leeg" role="status">
        <p>{t.tabel.leeg}</p>
        <Link href={clubPad('/leden/importeren', vestiging)} className="club-knop club-knop--klein">{t.pagina.inlezen}</Link>
      </div>
    )
  }
  const wis = clubPad('/leden', vestiging, lijstZoek({ ...STANDAARD_PARAMS, sort: params.sort, oplopend: params.oplopend }))
  return (
    <div className="club-leeg club-leden-leeg" role="status">
      <p>{params.q ? t.tabel.geenGevondenVoor(params.q) : t.tabel.geenGevonden}</p>
      <Link href={wis} className="club-knop club-knop--klein" scroll={false}>{t.tabel.wisAlles}</Link>
    </div>
  )
}

export async function LedenTabel({ pagina, params, vestiging, nu, gefilterd }: LedenTabelProps) {
  const taal = await getTaal()
  const t = LEDEN[taal]
  if (pagina.totaal === 0) return <Leeg params={params} vestiging={vestiging} gefilterd={gefilterd} t={t} />
  return (
    <section className="club-leden-lijst" aria-label={t.tabel.label}>
      <div className="club-tabel-wrap">
        <table className="club-tabel club-leden-tabel">
          <caption className="club-sr">{t.tabel.bijschrift(pagina.van, pagina.tot, pagina.totaal)}</caption>
          <thead>
            <tr>{KOLOMMEN.map((k) => <Kop key={k.sleutel} kolom={k} params={params} vestiging={vestiging} t={t} />)}</tr>
          </thead>
          <RijKlik>
            {pagina.rijen.map((r) => <Rij key={r.lid.id} rij={r} vestiging={vestiging} nu={nu} t={t} taal={taal} />)}
          </RijKlik>
        </table>
      </div>
      <div className="club-leden-voet">
        <span className="club-zacht club-getal">{t.tabel.telling(pagina.van, pagina.tot, pagina.totaal)}</span>
        <Paginering pagina={pagina} params={params} vestiging={vestiging} t={t} />
      </div>
    </section>
  )
}
