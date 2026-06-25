'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export interface TrendPunt {
  datum: string
  Score: number
}

// Apart component zodat recharts via next/dynamic lui geladen wordt en niet in
// de initiële bundle van de teampagina zit.
export default function VitaliteitTrend({ data }: { data: TrendPunt[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="datum" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v) => `${v}%`} />
        <Line type="monotone" dataKey="Score" stroke="var(--mentaforce-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
