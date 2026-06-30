'use client'

import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/ui/Chart'

export interface TrendPunt {
  week: string
  Score: number
}

export interface VergelijkingPunt {
  metric: string
  Gemiddelde: number
}

// Beide HR-grafieken in één component, zodat recharts via next/dynamic lui
// geladen wordt en niet in de initiële bundle van het dashboard zit. De
// Chart-primitive verzorgt het lazy-laden, het tekstalternatief (role="img" +
// sr-only datatabel) en de token-gestuurde styling.
export default function HrCharts({
  trendData,
  vergelijkingData,
}: {
  trendData: TrendPunt[]
  vergelijkingData: VergelijkingPunt[]
}) {
  return (
    <>
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          Vitaliteitstrend over tijd
        </p>
        <Chart
          type="line"
          data={trendData}
          xKey="week"
          series={[{ key: 'Score', label: 'Score (%)', color: 'var(--mentaforce-primary)' }]}
          summary="Gemiddelde vitaliteitsscore van het team per week, op een schaal van 0 tot 100 procent."
          yDomain={[0, 100]}
          height={220}
        />
      </Card>

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          Gemiddelde score per metric
        </p>
        <Chart
          type="bar"
          data={vergelijkingData}
          xKey="metric"
          series={[{ key: 'Gemiddelde', label: 'Gemiddelde', color: 'var(--mentaforce-primary)' }]}
          summary="Gemiddelde score per welzijnsmetric, op een schaal van 0 tot 5."
          yDomain={[0, 5]}
          height={240}
        />
      </Card>
    </>
  )
}
