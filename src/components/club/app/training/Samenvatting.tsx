'use client'

import { Award, Check, CloudUpload } from 'lucide-react'
import { toonDuur, type NieuwRecord, type Samenvatting as Telling } from '@/lib/club/app/sets'
import { komma } from '@/lib/club/app/training-modus'
import type { WeekVoortgang } from '@/lib/club/app/week'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TRAINING } from '@/lib/aiyourgym/taal/woorden/ledenapp/training'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
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

const record = (kg: number, herh: number | null, taal: Taal) => `${komma(kg, taal)} kg${herh ? ` x ${herh}` : ''}`

/** Na "training afronden": kort en eerlijk wat je deed, records alleen als je echt zwaarder of vaker tilde dan ooit. */
export function TrainingSamenvatting({ dagLetter, schemaNaam, telling, records, duurSec, week, status, onSluit }: SamenvattingProps) {
  const gehaald = week.gedaan >= week.doel
  const taal = useTaal()
  const t = TRAINING[taal].klaar
  const getal = (n: number) => formatGetal(n, taal)
  return (
    <section className="club-tm-klaar" aria-labelledby="tm-klaar-kop">
      <header className="club-tm-klaar-kop">
        <span className="club-tm-klaar-vink" aria-hidden><Check size={28} strokeWidth={3} /></span>
        <p>{t.dagSchema(dagLetter, schemaNaam)}</p>
        <h2 id="tm-klaar-kop">{t.kop}</h2>
      </header>

      <dl className="club-tm-klaar-cijfers">
        <div className="club-tm-klaar-tijd"><dt>{t.tijd}</dt><dd>{toonDuur(duurSec, taal)}</dd></div>
        <div><dt>{t.volume}</dt><dd>{getal(telling.volumeKg)}<small> kg</small></dd></div>
        <div><dt>{t.sets}</dt><dd>{telling.sets}</dd></div>
        <div><dt>{t.herhalingen}</dt><dd>{getal(telling.herhalingen)}</dd></div>
      </dl>

      {records.length > 0 && (
        <section className="club-tm-records" aria-label={t.recordsLabel}>
          <h3><Award aria-hidden size={16} /> {t.records(records.length)}</h3>
          <ul>
            {records.map((r) => (
              <li key={r.oefeningId}>
                <span>{r.naam}</span>
                <strong>{record(r.gewichtKg, r.herhalingen, taal)}</strong>
                <small>{t.was(record(r.vorigKg, r.vorigHerhalingen, taal))}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="club-tm-week" aria-label={t.week}>
        <p>
          <span>{t.week}</span>
          <strong>{gehaald ? t.weekdoel : t.trainingen(week.gedaan, week.doel)}</strong>
        </p>
        <ol aria-hidden>
          {Array.from({ length: Math.max(week.doel, week.gedaan) }, (_, i) => (
            <li key={i} data-gedaan={i < week.gedaan || undefined} data-extra={i >= week.doel || undefined} />
          ))}
        </ol>
        {gehaald && <span className="club-sr">{t.trainingen(week.gedaan, week.doel)}</span>}
      </section>

      <p className="club-tm-opslag" data-status={status} role="status">
        {status === 'opgeslagen' ? <Check aria-hidden size={16} strokeWidth={3} /> : <CloudUpload aria-hidden size={16} />}
        {status === 'opgeslagen' ? t.opgeslagen : t.wacht}
      </p>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={onSluit}>
        {t.klaar}
      </button>
    </section>
  )
}
