import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { gewichtLijn, getalNl, type Meting } from '@/lib/lifeos/pt-dashboard/metingen'

// Gewicht door de tijd als eenvoudige lijn (inline SVG), vanaf twee metingen
// met gewicht. Geen streeflijn of norm: alleen wat er gemeten is. Het
// tekstalternatief noemt elke meting, voor wie de grafiek niet ziet.

const B = 320
const H = 120
const MARGE = { x: 16, y: 16 }

export function GewichtLijn({ metingen }: { metingen: readonly Meting[] }) {
  const punten = gewichtLijn(metingen, B - MARGE.x * 2, H - MARGE.y * 2).map((p) => ({ ...p, x: p.x + MARGE.x, y: p.y + MARGE.y }))
  if (punten.length < 2) return null
  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  const lijn = punten.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const beschrijving = punten.map((p) => `${dagKort(p.datum)}: ${getalNl(p.waarde)} kg`).join('; ')
  return (
    <figure className="ffdos-grafiek">
      <figcaption className="ptd-label">Gewicht</figcaption>
      <svg viewBox={`0 0 ${B} ${H + 18}`} className="ffdos-svg" role="img" aria-label={`Gewicht per meting: ${beschrijving}.`}>
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
