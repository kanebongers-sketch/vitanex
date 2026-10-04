'use client'

import { useId, useState } from 'react'
import type { HistoriePunt } from '@/lib/lifeos/beleggen/opslag'
import { euro } from './formaat'

// Het verloop van je portefeuillewaarde: één lijn (2px, cyaan), een rustige
// baseline-grid en een crosshair + tooltip bij hover/focus. Eén reeks, dus geen
// legenda — de kop noemt 'm. Begint op de dag dat je ging bijhouden: geen
// teruggerekende historie die je nooit had.

const B = 640
const H = 160
const PAD = { boven: 12, onder: 8, links: 8, rechts: 8 }
const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

function datum(dag: string): Date {
  const [j, m, d] = dag.split('-').map(Number)
  return new Date(j, m - 1, d)
}

export function VerloopGrafiek({ punten }: { punten: readonly HistoriePunt[] }) {
  const titelId = useId()
  const [actief, setActief] = useState<number | null>(null)

  if (punten.length < 2) {
    return (
      <p className="bel__leeg">
        Het verloop verschijnt vanaf morgen: LifeOS legt elke dag je portefeuillewaarde vast, vanaf vandaag
        {punten[0] ? ` (${DAG.format(datum(punten[0].dag))})` : ''}.
      </p>
    )
  }

  const waarden = punten.map((p) => p.waardeEur)
  const min = Math.min(...waarden)
  const max = Math.max(...waarden)
  const marge = (max - min) * 0.1 || max * 0.01 || 1
  const lo = min - marge
  const hi = max + marge
  const x = (i: number) => PAD.links + (i / (punten.length - 1)) * (B - PAD.links - PAD.rechts)
  const y = (v: number) => PAD.boven + (1 - (v - lo) / (hi - lo)) * (H - PAD.boven - PAD.onder)
  const pad = punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.waardeEur).toFixed(1)}`).join(' ')
  const p = actief !== null ? punten[actief] : null

  function kies(clientX: number, rect: DOMRect) {
    const rel = ((clientX - rect.left) / rect.width) * B
    const i = Math.round(((rel - PAD.links) / (B - PAD.links - PAD.rechts)) * (punten.length - 1))
    setActief(Math.max(0, Math.min(punten.length - 1, i)))
  }

  return (
    <figure className="bel__grafiek" aria-labelledby={titelId}>
      <figcaption id={titelId} className="bel__grafiek-kop">
        Verloop sinds {DAG.format(datum(punten[0].dag))}
      </figcaption>
      <div className="bel__grafiek-vlak">
        <svg
          viewBox={`0 0 ${B} ${H}`}
          role="img"
          aria-label={`Portefeuillewaarde van ${euro(punten[0].waardeEur)} naar ${euro(punten[punten.length - 1].waardeEur)}`}
          tabIndex={0}
          onPointerMove={(e) => kies(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setActief(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setActief((a) => Math.max(0, (a ?? punten.length) - 1))
            if (e.key === 'ArrowRight') setActief((a) => Math.min(punten.length - 1, (a ?? -1) + 1))
          }}
          onBlur={() => setActief(null)}
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD.links} x2={B - PAD.rechts} y1={PAD.boven + f * (H - PAD.boven - PAD.onder)} y2={PAD.boven + f * (H - PAD.boven - PAD.onder)} className="bel__grid" />
          ))}
          <path d={pad} className="bel__lijn" />
          {p && actief !== null ? (
            <>
              <line x1={x(actief)} x2={x(actief)} y1={PAD.boven} y2={H - PAD.onder} className="bel__kruis" />
              <circle cx={x(actief)} cy={y(p.waardeEur)} r={4.5} className="bel__punt" />
            </>
          ) : (
            <circle cx={x(punten.length - 1)} cy={y(punten[punten.length - 1].waardeEur)} r={4} className="bel__punt" />
          )}
        </svg>
        {p && actief !== null ? (
          <div className="bel__tip" style={{ left: `${Math.min(88, Math.max(12, (x(actief) / B) * 100))}%` }} role="status">
            <span className="bel__tip-dag">{DAG.format(datum(p.dag))}</span>
            <strong>{euro(p.waardeEur)}</strong>
          </div>
        ) : null}
      </div>
      <div className="bel__assen" aria-hidden>
        <span>{DAG.format(datum(punten[0].dag))}</span>
        <span>{DAG.format(datum(punten[punten.length - 1].dag))}</span>
      </div>
    </figure>
  )
}
