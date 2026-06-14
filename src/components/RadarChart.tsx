'use client'

interface RadarChartProps {
  scores: Record<string, number>
  size?: number
}

const DOMEINEN = [
  { key: 'slaap', label: 'Slaap' },
  { key: 'stress', label: 'Stress' },
  { key: 'energie', label: 'Energie' },
  { key: 'focus', label: 'Focus' },
  { key: 'balans', label: 'Balans' },
  { key: 'motivatie', label: 'Motivatie' },
]

function polarToCartesian(
  cx: number, cy: number, radius: number, angle: number,
): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180)
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
}

function normaliseer(rawScore: number): number {
  // rawScore = som van 4 vragen (range 4–20) → 0–1
  if (rawScore <= 0) return 0
  return Math.max(0, Math.min(1, (rawScore - 4) / 16))
}

export default function RadarChart({ scores, size = 220 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size * 0.36
  const labelRadius = size * 0.48
  const niveaus = 4

  const hoeken = DOMEINEN.map((_, i) => (i * 360) / DOMEINEN.length)

  // Web-lijnen (achtergrond grid)
  const webPaths = Array.from({ length: niveaus }, (_, level) => {
    const r = (maxRadius * (level + 1)) / niveaus
    const punten = hoeken.map(h => polarToCartesian(cx, cy, r, h))
    return punten.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z'
  })

  // Data polygon
  const dataPunten = DOMEINEN.map((d, i) => {
    const waarde = normaliseer(scores[d.key] ?? 0)
    return polarToCartesian(cx, cy, maxRadius * waarde, hoeken[i])
  })
  const dataPath = dataPunten
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ') + ' Z'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Radar chart van welzijnsdomeinen"
    >
      {/* Grid ringen */}
      {webPaths.map((path, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="var(--color-border, #e5e7eb)"
          strokeWidth={0.75}
          opacity={0.6}
        />
      ))}

      {/* Assen */}
      {hoeken.map((h, i) => {
        const [x, y] = polarToCartesian(cx, cy, maxRadius, h)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            stroke="var(--color-border, #e5e7eb)"
            strokeWidth={0.75}
            opacity={0.6}
          />
        )
      })}

      {/* Data vlak */}
      <path
        d={dataPath}
        fill="var(--color-primary, #6366f1)"
        fillOpacity={0.18}
        stroke="var(--color-primary, #6366f1)"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />

      {/* Data punten */}
      {dataPunten.map(([x, y], i) => (
        <circle
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={3}
          fill="var(--color-primary, #6366f1)"
        />
      ))}

      {/* Labels */}
      {DOMEINEN.map((d, i) => {
        const [x, y] = polarToCartesian(cx, cy, labelRadius, hoeken[i])
        const anchor = x < cx - 4 ? 'end' : x > cx + 4 ? 'start' : 'middle'
        return (
          <text
            key={i}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={9.5}
            fontWeight={500}
            fill="var(--color-text-secondary, #6b7280)"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
