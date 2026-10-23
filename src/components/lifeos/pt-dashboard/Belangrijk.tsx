'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Shirt } from 'lucide-react'
import { aantalOpen, isExterneLink, linkVoorPt, type Aandachtspunt, type BelangrijkVoorPt, type Kledingmaten } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { KledingmatenFormulier } from './KledingmatenFormulier'
import { leesLeeg, ptApi } from './api'

// "Belangrijk" bovenaan het startscherm van een PT'er: de algemene punten die
// Kane voor elke PT'er klaarzet, plus "Geef je kledingmaten door" zolang die
// ontbreken (met het formulier er direct in). Een punt vink je af als gedaan;
// afgevinkte punten staan ingeklapt onderaan en kunnen terug op open.

interface Props {
  code: string
  b: BelangrijkVoorPt
  maten: Kledingmaten | null
}

export function Belangrijk({ code, b, maten }: Props) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [verversen, start] = useTransition()
  const [fout, setFout] = useState<string | null>(null)
  const [matenOpen, setMatenOpen] = useState(false)
  const open = aantalOpen(b)

  async function vink(p: Aandachtspunt, gedaan: boolean) {
    if (bezig || verversen) return
    setBezig(p.id)
    setFout(null)
    const uit = await ptApi(code, 'belangrijk', 'POST', { actie: 'gedaan', id: p.id, gedaan }, leesLeeg)
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    start(() => router.refresh())
  }

  const punt = (p: Aandachtspunt, gedaan: boolean) => (
    <Punt key={p.id} code={code} p={p} gedaan={gedaan} bezig={bezig === p.id || (verversen && bezig === null)} onVink={(g) => void vink(p, g)} />
  )

  return (
    <section className="ptd-sectie ptd-belangrijk" aria-labelledby="ptd-belangrijk-kop">
      <div className="ptd-sectiekop">
        <h2 id="ptd-belangrijk-kop">Belangrijk</h2>
        <span>{open === 0 ? 'je bent bij' : open === 1 ? '1 punt open' : `${open} punten open`}</span>
      </div>
      {open === 0 && b.gedaan.length > 0 ? <p className="ptd-leeg">Je bent helemaal bij. Nieuwe punten van Kane verschijnen hier.</p> : null}
      {open > 0 ? (
        <ul className="ptd-lijst">
          {b.kledingOntbreekt ? (
            <li className="ptd-rij ptd-belangrijk-punt ptd-belangrijk-punt--actie">
              <span className="ptd-belangrijk-icoon" aria-hidden>
                <Shirt size={18} />
              </span>
              <div className="ptd-belangrijk-inhoud">
                <p className="ptd-naam">Geef je kledingmaten door</p>
                <p className="ptd-tekst">Dan ligt je Fit Factory-kleding in de goede maat klaar.</p>
                <KledingmatenFormulier code={code} begin={null} />
              </div>
            </li>
          ) : null}
          {b.open.map((p) => punt(p, false))}
        </ul>
      ) : null}
      {fout ? <Foutmelding bericht={fout} /> : null}
      {b.gedaan.length > 0 ? (
        <details className="ptd-belangrijk-gedaan">
          <summary className="ptd-tekstknop">Gedaan ({b.gedaan.length})</summary>
          <ul className="ptd-lijst">{b.gedaan.map((p) => punt(p, true))}</ul>
        </details>
      ) : null}
      {maten ? (
        matenOpen ? (
          <div className="ptd-rij">
            <p className="ptd-naam">Je kledingmaten</p>
            <KledingmatenFormulier code={code} begin={maten} klaar={() => setMatenOpen(false)} />
          </div>
        ) : (
          <p className="ptd-hint ptd-belangrijk-matenregel">
            <Shirt size={14} aria-hidden /> Je kledingmaten: shirts en hoodies <strong>{maten.boven}</strong>, shorts en broeken{' '}
            <strong>{maten.onder}</strong>.{' '}
            <button type="button" className="ptd-tekstknop" onClick={() => setMatenOpen(true)}>
              Wijzig
            </button>
          </p>
        )
      ) : null}
    </section>
  )
}

interface PuntProps {
  code: string
  p: Aandachtspunt
  gedaan: boolean
  bezig: boolean
  onVink: (gedaan: boolean) => void
}

function Punt({ code, p, gedaan, bezig, onVink }: PuntProps) {
  const titelId = `ptd-bel-${p.id}`
  const uitlegId = p.uitleg ? `${titelId}-uitleg` : undefined
  return (
    <li className={`ptd-rij ptd-belangrijk-punt${gedaan ? ' ptd-belangrijk-punt--gedaan' : ''}`}>
      <label className="ptd-belangrijk-vink">
        <input
          type="checkbox"
          checked={gedaan}
          disabled={bezig}
          onChange={(e) => onVink(e.target.checked)}
          aria-labelledby={titelId}
          aria-describedby={uitlegId}
        />
      </label>
      <div className="ptd-belangrijk-inhoud">
        <p className="ptd-naam" id={titelId}>{p.titel}</p>
        {p.uitleg ? <p className="ptd-tekst" id={uitlegId}>{p.uitleg}</p> : null}
        {p.link ? <PuntLink link={p.link} code={code} /> : null}
      </div>
    </li>
  )
}

function PuntLink({ link, code }: { link: string; code: string }) {
  if (isExterneLink(link)) {
    return (
      <a className="ptd-link ptd-belangrijk-link" href={link} target="_blank" rel="noopener noreferrer">
        Openen <ArrowUpRight size={14} aria-hidden />
        <span className="sr-only"> (opent in een nieuw tabblad)</span>
      </a>
    )
  }
  return (
    <Link className="ptd-link ptd-belangrijk-link" href={linkVoorPt(link, code)} prefetch={false}>
      Openen <ArrowUpRight size={14} aria-hidden />
    </Link>
  )
}
