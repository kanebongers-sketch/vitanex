'use client'

import { Chart } from '@/components/ui/Chart'

export type TrendPunt = {
  datum: string
  Fysiek: number
  Mentaal: number
  Sociaal: number
}

// Apart component zodat recharts (zwaar, ~honderden KB) via next/dynamic lui
// geladen wordt en niet in de initiële bundle van het portaal zit. De
// Chart-primitive verzorgt het lazy-laden, het tekstalternatief (role="img" +
// sr-only datatabel) en de token-gestuurde styling.
export default function TrendChart({ data }: { data: TrendPunt[] }) {
  return (
    <Chart
      type="line"
      data={data}
      xKey="datum"
      series={[
        { key: 'Fysiek', label: 'Fysiek', color: 'var(--mentaforce-primary)' },
        { key: 'Mentaal', label: 'Mentaal', color: 'var(--mf-blue-mid)' },
        { key: 'Sociaal', label: 'Sociaal', color: 'var(--mf-purple)' },
      ]}
      summary="Welzijnstrend per datum voor fysiek, mentaal en sociaal welbevinden, op een schaal van 1 tot 5."
      yDomain={[1, 5]}
      height={200}
      showLegend
    />
  )
}
