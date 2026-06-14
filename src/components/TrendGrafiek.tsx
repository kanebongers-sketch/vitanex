'use client'

interface TrendPunt {
  week: string
  score: number
}

interface TrendGrafiekProps {
  data: TrendPunt[]
  hoogte?: number
  breedte?: number
  kleur?: string
}

export default function TrendGrafiek({
  data,
  hoogte = 80,
  breedte = 280,
  kleur = 'var(--color-primary, #6366f1)',
}: TrendGrafiekProps) {
  if (!data || data.length < 2) return null

  const padding = { top: 8, right: 8, bottom: 20, left: 28 }
  const plotW = breedte - padding.left - padding.right
  const plotH = hoogte - padding.top - padding.bottom

  const scores = data.map(d => d.score)
  const minScore = Math.max(0, Math.min(...scores) - 5)
  const maxScore = Math.min(100, Math.max(...scores) + 5)
  const bereik = maxScore - minScore || 1

  function xPos(i: number) {
    return padding.left + (i / (data.length - 1)) * plotW
  }

  function yPos(score: number) {
    return padding.top + plotH - ((score - minScore) / bereik) * plotH
  }

  const lijnPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.score).toFixed(1)}`)
    .join(' ')

  const opvulPath =
    lijnPath +
    ` L ${xPos(data.length - 1).toFixed(1)} ${(padding.top + plotH).toFixed(1)}` +
    ` L ${xPos(0).toFixed(1)} ${(padding.top + plotH).toFixed(1)} Z`

  const laatste = data[data.length - 1]
  const voorlaatste = data[data.length - 2]
  const trend = laatste.score - voorlaatste.score

  return (
    <figure className="trend-grafiek" aria-label="Vitaliteitsscore over de afgelopen weken">
      <svg width={breedte} height={hoogte} viewBox={`0 0 ${breedte} ${hoogte}`}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={kleur} stopOpacity="0.25" />
            <stop offset="100%" stopColor={kleur} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontale referentielijnen */}
        {[25, 50, 75].map(pct => {
          const y = yPos(minScore + (bereik * pct) / 100)
          if (y < padding.top || y > padding.top + plotH) return null
          return (
            <line
              key={pct}
              x1={padding.left}
              y1={y.toFixed(1)}
              x2={padding.left + plotW}
              y2={y.toFixed(1)}
              stroke="var(--color-border, #e5e7eb)"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          )
        })}

        {/* Y-as labels */}
        {[minScore, maxScore].map((val, i) => (
          <text
            key={i}
            x={padding.left - 4}
            y={i === 0 ? padding.top + plotH : padding.top + 4}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={8}
            fill="var(--color-text-muted, #9ca3af)"
          >
            {Math.round(val)}
          </text>
        ))}

        {/* Opvulgebied */}
        <path d={opvulPath} fill="url(#trendGrad)" />

        {/* Lijn */}
        <path
          d={lijnPath}
          fill="none"
          stroke={kleur}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Laatste punt */}
        <circle
          cx={xPos(data.length - 1).toFixed(1)}
          cy={yPos(laatste.score).toFixed(1)}
          r={3.5}
          fill={kleur}
        />

        {/* X-as: eerste en laatste week */}
        {[0, data.length - 1].map(i => (
          <text
            key={i}
            x={xPos(i).toFixed(1)}
            y={hoogte - 3}
            textAnchor={i === 0 ? 'start' : 'end'}
            fontSize={8}
            fill="var(--color-text-muted, #9ca3af)"
          >
            {data[i].week}
          </text>
        ))}
      </svg>

      <figcaption className="trend-grafiek__caption">
        {trend > 0
          ? `+${trend.toFixed(0)} punten`
          : trend < 0
            ? `${trend.toFixed(0)} punten`
            : 'Stabiel'}
        {' '}ten opzichte van vorige week
      </figcaption>
    </figure>
  )
}
