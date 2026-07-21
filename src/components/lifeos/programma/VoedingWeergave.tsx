'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'
import { VOEDING, MACRO_DOEL, type Maaltijd, type Macros } from '@/lib/lifeos/programma/programma-data'

// Voeding-weergave: kies een dag (1–7) en zie per maaltijd de items met macro's
// plus het maaltijd-totaal, en onderaan het dag-streeftotaal afgezet tegen het
// macro-doel (een subtiele balk toont het percentage van het doel).

function aantalTekst(aantal: number | null, eenheid: string | null): string {
  if (aantal === null) return eenheid ?? '—'
  return eenheid ? `${aantal} ${eenheid}` : `${aantal}`
}

function MaaltijdTabel({ maaltijd }: { maaltijd: Maaltijd }) {
  return (
    <div className="prog-sectie">
      <div className="prog-sectie-kop">
        <h3 className="prog-sectie-titel">{maaltijd.naam}</h3>
        <span className="prog-sectie-tag">{maaltijd.totaal.kcal} kcal</span>
      </div>
      <div className="prog-tablewrap">
        <table className="prog-table">
          <caption className="prog-sr">{maaltijd.naam}</caption>
          <thead>
            <tr>
              <th scope="col">Voedingsmiddel</th>
              <th scope="col" className="prog-th-num">Aantal</th>
              <th scope="col" className="prog-th-num">Kcal</th>
              <th scope="col" className="prog-th-num"><abbr className="prog-abbr" title="Eiwit (gram)">E</abbr></th>
              <th scope="col" className="prog-th-num"><abbr className="prog-abbr" title="Koolhydraten (gram)">K</abbr></th>
              <th scope="col" className="prog-th-num"><abbr className="prog-abbr" title="Vetten (gram)">V</abbr></th>
            </tr>
          </thead>
          <tbody>
            {maaltijd.items.map((it) => (
              <tr key={it.voedingsmiddel}>
                <td className="prog-naam">{it.voedingsmiddel}</td>
                <td className="prog-num prog-dim">{aantalTekst(it.aantal, it.eenheid)}</td>
                <td className="prog-num">{it.kcal}</td>
                <td className="prog-num">{it.eiwit}</td>
                <td className="prog-num">{it.kh}</td>
                <td className="prog-num">{it.vet}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="prog-foot-label">Totaal</td>
              <td />
              <td className="prog-num">{maaltijd.totaal.kcal}</td>
              <td className="prog-num">{maaltijd.totaal.eiwit}</td>
              <td className="prog-num">{maaltijd.totaal.kh}</td>
              <td className="prog-num">{maaltijd.totaal.vet}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

interface MacroRegel {
  label: string
  waarde: number
  doel: number
  eenheid: string
}

function MacroBalk({ regel }: { regel: MacroRegel }) {
  const pct = Math.min(100, Math.round((regel.waarde / regel.doel) * 100))
  return (
    <div className="prog-macro">
      <div className="prog-macro-rij">
        <span className="prog-macro-label">{regel.label}</span>
        <span className="prog-macro-getal">
          <b>{regel.waarde}</b> / {regel.doel} {regel.eenheid}
        </span>
      </div>
      <div className="prog-bar" aria-hidden="true">
        <div className="prog-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function macroRegels(streef: Macros): MacroRegel[] {
  return [
    { label: 'Calorieën', waarde: streef.kcal, doel: MACRO_DOEL.kcal, eenheid: 'kcal' },
    { label: 'Eiwit', waarde: streef.eiwit, doel: MACRO_DOEL.eiwit, eenheid: 'g' },
    { label: 'Koolhydraten', waarde: streef.kh, doel: MACRO_DOEL.kh, eenheid: 'g' },
    { label: 'Vetten', waarde: streef.vet, doel: MACRO_DOEL.vet, eenheid: 'g' },
  ]
}

export function VoedingWeergave() {
  const [dagIndex, setDagIndex] = useState(0)
  const dag = VOEDING[dagIndex]

  return (
    <div>
      <div className="prog-chips" role="group" aria-label="Kies een dag">
        {VOEDING.map((d, i) => (
          <button
            key={d.dag}
            type="button"
            className="prog-chip"
            aria-pressed={i === dagIndex}
            onClick={() => setDagIndex(i)}
          >
            {d.dag}
          </button>
        ))}
      </div>

      {dag.maaltijden.map((m) => (
        <MaaltijdTabel key={m.naam} maaltijd={m} />
      ))}

      <div className="prog-doel">
        <p className="prog-doel-kop">
          <Target size={15} strokeWidth={2.2} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 7, color: 'var(--brand)' }} />
          Streeftotaal {dag.dag}
        </p>
        <p className="prog-doel-sub">Afgezet tegen je macro-doel ({MACRO_DOEL.kcal} kcal · {MACRO_DOEL.eiwit}P · {MACRO_DOEL.kh}KH · {MACRO_DOEL.vet}F).</p>
        {macroRegels(dag.streefTotaal).map((r) => (
          <MacroBalk key={r.label} regel={r} />
        ))}
      </div>
    </div>
  )
}
