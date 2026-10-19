'use client'

import { useState } from 'react'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { metEenheid } from '@/lib/lifeos/pt-dashboard/meting-extra'
import { getalNl, grafiekReeksen, waardeLijn, type Meting, type ReeksSleutel } from '@/lib/lifeos/pt-dashboard/metingen'

// Het verloop van een waarde door de tijd als eenvoudige lijn (inline SVG),
// vanaf twee metingen met die waarde. Standaard gewicht; de PT'er kiest zelf
// een andere waarde (vaste maat of extra meetoptie). Geen streeflijn of norm:
// alleen wat er gemeten is. Het tekstalternatief noemt elke meting.

const B = 320
const H = 120
const MARGE = { x: 16, y: 16 }

export function GewichtLijn({ metingen }: { metingen: readonly Meting[] }) {
  const reeksen = grafiekReeksen(metingen)
  const [keuze, setKeuze] = useState<ReeksSleutel>('gewichtKg')
  const reeks = reeksen.find((r) => r.sleutel === keuze) ?? reeksen[0]
  if (!reeks) return null
  const punten = waardeLijn(metingen, reeks.sleutel, B - MARGE.x * 2, H - MARGE.y * 2).map((p) => ({ ...p, x: p.x + MARGE.x, y: p.y + MARGE.y }))
  if (punten.length < 2) return null
  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  const lijn = punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const beschrijving = punten.map((p) => `${dagKort(p.datum)}: ${metEenheid(p.waarde, reeks.eenheid)}`).join('; ')
  return (
    <figure className="ffdos-grafiek">
      <figcaption className="ffdos-grafiek-kop">
        <span className="ptd-label">{reeks.label}{reeks.eenheid ? ` (${reeks.eenheid})` : ''}</span>
        {reeksen.length > 1 ? (
          <div className="ptd-keuzes ffdos-reeksen" role="group" aria-label="Welke waarde in de grafiek">
            {reeksen.map((r) => (
              <button key={r.sleutel} type="button" className="ptd-chip" aria-pressed={r.sleutel === reeks.sleutel} onClick={() => setKeuze(r.sleutel)}>
                {r.label}
              </button>
            ))}
          </div>
        ) : null}
      </figcaption>
      <svg viewBox={`0 0 ${B} ${H + 18}`} className="ffdos-svg" role="img" aria-label={`${reeks.label} per meting: ${beschrijving}.`}>
        <line x1={MARGE.x} x2={B - MARGE.x} y1={H - 2} y2={H - 2} className="ffdos-as" />
        <path d={lijn} className="ffdos-lijn" />
        {punten.map((p) => (
          <circle key={`${p.datum}-${p.x}`} cx={p.x} cy={p.y} r={3.5} className="ffdos-punt" />
        ))}
        <text x={eerste.x} y={H + 14} className="ffdos-as-tekst">{dagKort(eerste.datum)}</text>
        <text x={laatste.x} y={H + 14} textAnchor="end" className="ffdos-as-tekst">{dagKort(laatste.datum)}</text>
        <text x={eerste.x + 6} y={eerste.y - 7} className="ffdos-waarde">{getalNl(eerste.waarde)}</text>
        <text x={laatste.x - 6} y={laatste.y - 7} textAnchor="end" className="ffdos-waarde">{getalNl(laatste.waarde)}</text>
      </svg>
    </figure>
  )
}
