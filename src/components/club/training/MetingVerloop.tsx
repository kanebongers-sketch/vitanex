'use client'

import { useState } from 'react'
import { berekenBmi } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { lijnPunten, toonDatum, toonVerschil } from '@/lib/club/training/weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

const REEKSEN = [
  { sleutel: 'gewicht', eenheid: 'kg', waarde: (i: Intake) => i.metingen.gewicht_kg },
  { sleutel: 'bmi', eenheid: '', waarde: (i: Intake) => berekenBmi(i.metingen.gewicht_kg, i.metingen.lengte_cm) ?? undefined },
  { sleutel: 'vet', eenheid: '%', waarde: (i: Intake) => i.metingen.vetpercentage },
  { sleutel: 'buik', eenheid: 'cm', waarde: (i: Intake) => i.metingen.buikomtrek_cm },
  { sleutel: 'hartslag', eenheid: 'bpm', waarde: (i: Intake) => i.metingen.rusthartslag },
] as const

const B = 640
const H = 160

/** Het verloop van de metingen over de intakes van een lid. Eigen kleine SVG-lijn. */
export function MetingVerloop({ intakes }: { intakes: Intake[] }) {
  const taal = useTaal()
  const t = useTekst(INTAKE).verloop
  const oudsteEerst = [...intakes].sort((a, b) => a.datum.localeCompare(b.datum))
  const beschikbaar = REEKSEN.filter((r) => oudsteEerst.some((i) => r.waarde(i) !== undefined))
  const [keuze, setKeuze] = useState<string>(beschikbaar[0]?.sleutel ?? 'gewicht')
  const reeks = beschikbaar.find((r) => r.sleutel === keuze) ?? beschikbaar[0]

  if (!reeks) return <p className="club-leeg">{t.leeg}</p>

  const data = oudsteEerst.flatMap((i) => {
    const w = reeks.waarde(i)
    return w === undefined ? [] : [{ label: toonDatum(i.datum, taal), waarde: w }]
  })
  const punten = lijnPunten(data, B, H, 18)
  const eerste = data[0]
  const laatste = data[data.length - 1]

  return (
    <section className="club-kaart club-training-verloop" aria-label={t.label}>
      <div className="club-training-verloop-kop">
        <div>
          <p className="club-tegel-label">{t.reeks[reeks.sleutel]}</p>
          <p className="club-tegel-getal">
            {formatGetal(laatste.waarde, taal)}
            <small>{reeks.eenheid}</small>
          </p>
          {data.length > 1 && (
            <p className="club-tegel-sub">{t.sinds(toonVerschil(eerste.waarde, laatste.waarde, taal), reeks.eenheid, eerste.label)}</p>
          )}
        </div>
        <div className="club-segment" role="group" aria-label={t.kies}>
          {beschikbaar.map((r) => (
            <button key={r.sleutel} type="button" aria-pressed={r.sleutel === reeks.sleutel} onClick={() => setKeuze(r.sleutel)}>
              {t.reeks[r.sleutel]}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} className="club-training-lijn" role="img" aria-label={`${t.reeks[reeks.sleutel]}: ${data.map((d) => `${d.label} ${formatGetal(d.waarde, taal)}`).join(', ')}`}>
        <line x1="0" x2={B} y1={H - 1} y2={H - 1} className="club-training-lijn-as" />
        {punten.length > 1 && <polyline points={punten.map((p) => `${p.x},${p.y}`).join(' ')} className="club-training-lijn-pad" />}
        {punten.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={p.x} cy={p.y} r={i === punten.length - 1 ? 5 : 3.5} className={i === punten.length - 1 ? 'club-training-lijn-nu' : 'club-training-lijn-punt'} />
            <title>{`${p.label}: ${formatGetal(p.waarde, taal)} ${reeks.eenheid}`}</title>
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
