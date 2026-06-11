/**
 * Minimalistische SVG-sparkline voor metriek-tegels.
 * Geen assen of labels — alleen de vorm van de laatste twee weken.
 */

interface SparklineProps {
  waarden: (number | null)[]
  kleur: string
  breedte?: number
  hoogte?: number
}

export default function Sparkline({ waarden, kleur, breedte = 84, hoogte = 36 }: SparklineProps) {
  const punten = waarden
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null)

  if (punten.length < 2) {
    return (
      <svg width={breedte} height={hoogte} aria-hidden="true">
        <line
          x1="4" y1={hoogte / 2} x2={breedte - 4} y2={hoogte / 2}
          stroke={kleur} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round"
        />
      </svg>
    )
  }

  const min = Math.min(...punten.map(p => p.v))
  const max = Math.max(...punten.map(p => p.v))
  const bereik = max - min || 1
  const stapX = (breedte - 8) / (waarden.length - 1 || 1)

  const coords = punten.map(p => ({
    x: 4 + p.i * stapX,
    y: 4 + (hoogte - 8) * (1 - (p.v - min) / bereik),
  }))

  const lijn = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const vlak = `${lijn} L${coords[coords.length - 1].x.toFixed(1)},${hoogte} L${coords[0].x.toFixed(1)},${hoogte} Z`
  const laatste = coords[coords.length - 1]

  return (
    <svg width={breedte} height={hoogte} aria-hidden="true">
      <path d={vlak} fill={kleur} fillOpacity="0.1" />
      <path d={lijn} fill="none" stroke={kleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={laatste.x} cy={laatste.y} r="2.8" fill={kleur} />
    </svg>
  )
}
