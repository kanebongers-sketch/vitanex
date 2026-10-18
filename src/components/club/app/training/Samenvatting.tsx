'use client'

import { Award, Check, CloudUpload } from 'lucide-react'
import { toonDuur, type NieuwRecord, type Samenvatting as Telling } from '@/lib/club/app/sets'
import { komma } from '@/lib/club/app/training-modus'
import type { WeekVoortgang } from '@/lib/club/app/week'
import './samenvatting.css'

export type OpslagStatus = 'opgeslagen' | 'wacht'

interface SamenvattingProps {
  dagLetter: string
  schemaNaam: string
  telling: Telling
  records: readonly NieuwRecord[]
  duurSec: number
  week: WeekVoortgang
  status: OpslagStatus
  onSluit: () => void
}

const getal = (n: number) => n.toLocaleString('nl-NL')
const record = (kg: number, herh: number | null) => `${komma(kg)} kg${herh ? ` x ${herh}` : ''}`

/** Na "training afronden": kort en eerlijk wat je deed, records alleen als je echt zwaarder of vaker tilde dan ooit. */
export function TrainingSamenvatting({ dagLetter, schemaNaam, telling, records, duurSec, week, status, onSluit }: SamenvattingProps) {
  const gehaald = week.gedaan >= week.doel
  return (
    <section className="club-tm-klaar" aria-labelledby="tm-klaar-kop">
      <header className="club-tm-klaar-kop">
        <span className="club-tm-klaar-vink" aria-hidden><Check size={28} strokeWidth={3} /></span>
        <p>Dag {dagLetter} · {schemaNaam}</p>
        <h2 id="tm-klaar-kop">Training klaar</h2>
      </header>

      <dl className="club-tm-klaar-cijfers">
        <div className="club-tm-klaar-tijd"><dt>Tijd</dt><dd>{toonDuur(duurSec)}</dd></div>
        <div><dt>Volume</dt><dd>{getal(telling.volumeKg)}<small> kg</small></dd></div>
        <div><dt>Sets</dt><dd>{telling.sets}</dd></div>
        <div><dt>Herhalingen</dt><dd>{getal(telling.herhalingen)}</dd></div>
      </dl>

      {records.length > 0 && (
        <section className="club-tm-records" aria-label="Nieuwe records">
          <h3><Award aria-hidden size={16} /> {records.length === 1 ? 'Nieuw record' : `${records.length} nieuwe records`}</h3>
          <ul>
            {records.map((r) => (
              <li key={r.oefeningId}>
                <span>{r.naam}</span>
                <strong>{record(r.gewichtKg, r.herhalingen)}</strong>
                <small>was {record(r.vorigKg, r.vorigHerhalingen)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="club-tm-week" aria-label="Deze week">
        <p>
          <span>Deze week</span>
          <strong>{gehaald ? 'Weekdoel gehaald' : `${week.gedaan} van ${week.doel} trainingen`}</strong>
        </p>
        <ol aria-hidden>
          {Array.from({ length: Math.max(week.doel, week.gedaan) }, (_, i) => (
            <li key={i} data-gedaan={i < week.gedaan || undefined} data-extra={i >= week.doel || undefined} />
          ))}
        </ol>
        {gehaald && <span className="club-sr">{week.gedaan} van {week.doel} trainingen</span>}
      </section>

      <p className="club-tm-opslag" data-status={status} role="status">
        {status === 'opgeslagen' ? <Check aria-hidden size={16} strokeWidth={3} /> : <CloudUpload aria-hidden size={16} />}
        {status === 'opgeslagen'
          ? 'Opgeslagen. Je trainer ziet wat je deed.'
          : 'Bewaard op je telefoon. We versturen het zodra je weer bereik hebt.'}
      </p>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={onSluit}>
        Klaar
      </button>
    </section>
  )
}
