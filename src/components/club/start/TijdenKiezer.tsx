'use client'

import { Clock3 } from 'lucide-react'
import { WEEKDAG_LABEL, type Openingstijd, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import { STANDAARD_TIJD, standaardWeek, weekTekst } from '@/lib/club/start/soorten'

// Openingstijden met een klik: "standaard 06:00 tot 23:00" voor de hele week,
// of per dag (open of dicht, van en tot).

interface TijdenKiezerProps {
  week: Openingstijden
  perDag: boolean
  onWeek: (week: Openingstijden) => void
  onPerDag: (perDag: boolean) => void
}

function metDag(week: Openingstijden, i: number, dag: Openingstijd | null): Openingstijden {
  return week.map((d, j) => (j === i ? dag : d)) as Openingstijden
}

export function TijdenKiezer({ week, perDag, onWeek, onPerDag }: TijdenKiezerProps) {
  const isStandaard = weekTekst(week) === weekTekst(standaardWeek())
  return (
    <div className="club-start-tijden">
      <div className="club-start-tijden-keuze" role="group" aria-label="Openingstijden">
        <button
          type="button"
          className="club-start-tijdknop"
          aria-pressed={isStandaard && !perDag}
          onClick={() => {
            onWeek(standaardWeek())
            onPerDag(false)
          }}
        >
          <Clock3 aria-hidden size={18} />
          <span>
            <strong>Standaard</strong>
            <span>Elke dag {STANDAARD_TIJD.van} tot {STANDAARD_TIJD.tot}</span>
          </span>
        </button>
        <button type="button" className="club-start-tijdknop" aria-pressed={perDag || !isStandaard} onClick={() => onPerDag(true)}>
          <span className="club-start-tijdknop-dagen" aria-hidden>
            Ma
          </span>
          <span>
            <strong>Per dag</strong>
            <span>Eigen tijden of dagen dicht</span>
          </span>
        </button>
      </div>
      <p className="club-start-tijden-nu" aria-live="polite">
        {weekTekst(week)}
      </p>
      {perDag && (
        <ul className="club-start-dagen" role="list">
          {week.map((dag, i) => (
            <li key={WEEKDAG_LABEL[i]} data-dicht={!dag || undefined}>
              <label className="club-start-dag-open">
                <input type="checkbox" checked={dag !== null} onChange={(e) => onWeek(metDag(week, i, e.target.checked ? (week.find((d) => d !== null) ?? STANDAARD_TIJD) : null))} />
                <span>{WEEKDAG_LABEL[i]}</span>
              </label>
              {dag ? (
                <span className="club-start-dag-tijden">
                  <input type="time" className="club-invoer" aria-label={`${WEEKDAG_LABEL[i]} open vanaf`} value={dag.van} onChange={(e) => onWeek(metDag(week, i, { ...dag, van: e.target.value }))} />
                  <span className="club-zacht">tot</span>
                  <input type="time" className="club-invoer" aria-label={`${WEEKDAG_LABEL[i]} open tot`} value={dag.tot} onChange={(e) => onWeek(metDag(week, i, { ...dag, tot: e.target.value }))} />
                </span>
              ) : (
                <span className="club-zacht">Dicht</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
