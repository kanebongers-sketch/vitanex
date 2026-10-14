'use client'

import { useState } from 'react'
import { berekenBmi } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { lijnPunten, toonDatum, toonVerschil } from '@/lib/club/training/weergave'

const REEKSEN = [
  { sleutel: 'gewicht', label: 'Gewicht', eenheid: 'kg', waarde: (i: Intake) => i.metingen.gewicht_kg },
  { sleutel: 'bmi', label: 'BMI', eenheid: '', waarde: (i: Intake) => berekenBmi(i.metingen.gewicht_kg, i.metingen.lengte_cm) ?? undefined },
  { sleutel: 'vet', label: 'Vet', eenheid: '%', waarde: (i: Intake) => i.metingen.vetpercentage },
  { sleutel: 'buik', label: 'Buik', eenheid: 'cm', waarde: (i: Intake) => i.metingen.buikomtrek_cm },
  { sleutel: 'hartslag', label: 'Rusthartslag', eenheid: 'bpm', waarde: (i: Intake) => i.metingen.rusthartslag },
] as const

const B = 640
const H = 160

/** Het verloop van de metingen over de intakes van een lid. Eigen kleine SVG-lijn. */
export function MetingVerloop({ intakes }: { intakes: Intake[] }) {
  const oudsteEerst = [...intakes].sort((a, b) => a.datum.localeCompare(b.datum))
  const beschikbaar = REEKSEN.filter((r) => oudsteEerst.some((i) => r.waarde(i) !== undefined))
  const [keuze, setKeuze] = useState<string>(beschikbaar[0]?.sleutel ?? 'gewicht')
  const reeks = beschikbaar.find((r) => r.sleutel === keuze) ?? beschikbaar[0]

  if (!reeks) return <p className="club-leeg">Nog geen metingen vastgelegd.</p>

  const data = oudsteEerst.flatMap((i) => {
    const w = reeks.waarde(i)
    return w === undefined ? [] : [{ label: toonDatum(i.datum), waarde: w }]
  })
  const punten = lijnPunten(data, B, H, 18)
  const eerste = data[0]
  const laatste = data[data.length - 1]

  return (
    <section className="club-kaart club-training-verloop" aria-label="Verloop van de metingen">
      <div className="club-training-verloop-kop">
        <div>
          <p className="club-tegel-label">{reeks.label}</p>
          <p className="club-tegel-getal">
            {laatste.waarde.toLocaleString('nl-NL')}
            <small>{reeks.eenheid}</small>
          </p>
          {data.length > 1 && (
            <p className="club-tegel-sub">{toonVerschil(eerste.waarde, laatste.waarde)} {reeks.eenheid} sinds {eerste.label}</p>
          )}
        </div>
        <div className="club-segment" role="group" aria-label="Kies meting">
          {beschikbaar.map((r) => (
            <button key={r.sleutel} type="button" aria-pressed={r.sleutel === reeks.sleutel} onClick={() => setKeuze(r.sleutel)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} className="club-training-lijn" role="img" aria-label={`${reeks.label}: ${data.map((d) => `${d.label} ${d.waarde}`).join(', ')}`}>
        <line x1="0" x2={B} y1={H - 1} y2={H - 1} className="club-training-lijn-as" />
        {punten.length > 1 && <polyline points={punten.map((p) => `${p.x},${p.y}`).join(' ')} className="club-training-lijn-pad" />}
        {punten.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={p.x} cy={p.y} r={i === punten.length - 1 ? 5 : 3.5} className={i === punten.length - 1 ? 'club-training-lijn-nu' : 'club-training-lijn-punt'} />
            <title>{`${p.label}: ${p.waarde.toLocaleString('nl-NL')} ${reeks.eenheid}`}</title>
          </g>
        ))}
      </svg>
      <div className="club-training-lijn-labels" aria-hidden>
        <span>{eerste.label}</span>
        {data.length > 1 && <span>{laatste.label}</span>}
      </div>
    </section>
  )
}
