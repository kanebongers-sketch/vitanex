'use client'

import { Chart } from '@/components/ui/Chart'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type TrendPunt = {
  datum: string
  Score: number
}

// Apart component zodat recharts via next/dynamic lui geladen wordt en niet in
// de initiële bundle van de teampagina zit. De Chart-primitive verzorgt het
// lazy-laden van recharts, het tekstalternatief (role="img" + sr-only tabel) en
// de token-gestuurde styling.
export default function VitaliteitTrend({ data }: { data: TrendPunt[] }) {
  const { t } = useVertaling()
  return (
    <Chart
      type="line"
      data={data}
      xKey="datum"
      series={[{ key: 'Score', label: t('werk.vitaliteitTrend.label'), color: 'var(--mentaforce-primary)' }]}
      summary={t('werk.vitaliteitTrend.samenvatting')}
      yDomain={[0, 100]}
      height={200}
    />
  )
}
