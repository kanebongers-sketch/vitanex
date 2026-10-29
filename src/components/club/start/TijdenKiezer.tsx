'use client'

import { Clock3 } from 'lucide-react'
import type { Openingstijd, Openingstijden } from '@/lib/club/rooster/openingstijden'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import { STANDAARD_TIJD, standaardWeek, weekTekst } from '@/lib/club/start/soorten'

// Openingstijden met een klik: "standaard 06:00 tot 23:00" voor de hele week,
// of per dag (open of dicht, van en tot). De dagen staan altijd in beeld:
// niets verschijnt pas na een klik.

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
  const taal = useTaal()
  const t = useTekst(START).tijden
  const dagen = START_LIB[taal].week.dagLang
  const isStandaard = weekTekst(week) === weekTekst(standaardWeek())
  return (
    <div className="club-start-tijden">
      <div className="club-start-tijden-keuze" role="group" aria-label={t.groep}>
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
            <strong>{t.standaard}</strong>
            <span>{t.standaardUitleg(STANDAARD_TIJD.van, STANDAARD_TIJD.tot)}</span>
          </span>
        </button>
        <button type="button" className="club-start-tijdknop" aria-pressed={perDag || !isStandaard} onClick={() => onPerDag(true)}>
          <span className="club-start-tijdknop-dagen" aria-hidden>
            {t.dagenIcoon}
          </span>
          <span>
            <strong>{t.perDag}</strong>
            <span>{t.perDagUitleg}</span>
          </span>
        </button>
      </div>
      <p className="club-start-tijden-nu" aria-live="polite">
        {weekTekst(week, taal)}
      </p>
      <ul className="club-start-dagen" role="list">
        {week.map((dag, i) => (
          <li key={i} data-dicht={!dag || undefined}>
            <label className="club-start-dag-open">
              <input type="checkbox" checked={dag !== null} onChange={(e) => onWeek(metDag(week, i, e.target.checked ? (week.find((d) => d !== null) ?? STANDAARD_TIJD) : null))} />
              <span>{dagen[i]}</span>
            </label>
            {dag ? (
              <span className="club-start-dag-tijden">
                <input type="time" className="club-invoer" aria-label={t.openVanaf(dagen[i])} value={dag.van} onChange={(e) => onWeek(metDag(week, i, { ...dag, van: e.target.value }))} />
                <span className="club-zacht">{t.tot}</span>
                <input type="time" className="club-invoer" aria-label={t.openTot(dagen[i])} value={dag.tot} onChange={(e) => onWeek(metDag(week, i, { ...dag, tot: e.target.value }))} />
              </span>
            ) : (
              <span className="club-zacht">{t.dicht}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
