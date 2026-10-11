'use client'

import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/ui/Chart'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type TrendPunt = {
  week: string
  Score: number
}

export type VergelijkingPunt = {
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
  const { t } = useVertaling()
  return (
    <>
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          {t('werk.hrCharts.trendTitel')}
        </p>
        <Chart
          type="line"
          data={trendData}
          xKey="week"
          series={[{ key: 'Score', label: t('werk.hrCharts.scoreLabel'), color: 'var(--mentaforce-primary)' }]}
          summary={t('werk.hrCharts.trendSamenvatting')}
          yDomain={[0, 100]}
          height={220}
        />
      </Card>

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
          {t('werk.hrCharts.vergelijkingTitel')}
        </p>
        <Chart
          type="bar"
          data={vergelijkingData}
          xKey="metric"
          series={[{ key: 'Gemiddelde', label: t('werk.hrCharts.gemiddelde'), color: 'var(--mentaforce-primary)' }]}
          summary={t('werk.hrCharts.vergelijkingSamenvatting')}
          yDomain={[0, 5]}
          height={240}
        />
      </Card>
    </>
  )
}
