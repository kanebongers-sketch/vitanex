'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export interface TrendPunt {
  datum: string
  Fysiek: number
  Mentaal: number
  Sociaal: number
}

// Apart component zodat recharts (zwaar, ~honderden KB) via next/dynamic lui
// geladen wordt en niet in de initiële bundle van het portaal zit.
export default function TrendChart({ data }: { data: TrendPunt[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="datum" tick={{ fontSize: 11 }} />
        <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Line type="monotone" dataKey="Fysiek" stroke="var(--mf-green)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="Mentaal" stroke="var(--mf-blue-mid)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="Sociaal" stroke="var(--mf-purple)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
