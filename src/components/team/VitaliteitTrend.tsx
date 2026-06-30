'use client'

import { Chart } from '@/components/ui/Chart'

export interface TrendPunt {
  datum: string
  Score: number
}

// Apart component zodat recharts via next/dynamic lui geladen wordt en niet in
// de initiële bundle van de teampagina zit. De Chart-primitive verzorgt het
// lazy-laden van recharts, het tekstalternatief (role="img" + sr-only tabel) en
// de token-gestuurde styling.
export default function VitaliteitTrend({ data }: { data: TrendPunt[] }) {
  return (
    <Chart
      type="line"
      data={data}
      xKey="datum"
      series={[{ key: 'Score', label: 'Vitaliteitsscore', color: 'var(--mentaforce-primary)' }]}
      summary="Vitaliteitsscore van het team per datum, op een schaal van 0 tot 100 procent."
      yDomain={[0, 100]}
      height={200}
    />
  )
}
