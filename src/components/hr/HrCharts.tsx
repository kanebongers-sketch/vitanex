'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export interface TrendPunt {
  week: string
  Score: number
}

export interface VergelijkingPunt {
  metric: string
  Gemiddelde: number
}

// Beide HR-grafieken in één component, zodat recharts via next/dynamic lui
// geladen wordt en niet in de initiële bundle van het dashboard zit.
export default function HrCharts({
  trendData,
  vergelijkingData,
}: {
  trendData: TrendPunt[]
  vergelijkingData: VergelijkingPunt[]
}) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Vitaliteitstrend over tijd</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
            <Line type="monotone" dataKey="Score" stroke="var(--mf-green)" strokeWidth={2.5}
              dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Gemiddelde score per metric</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={vergelijkingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}/5`, 'Gemiddelde']} />
            <Bar dataKey="Gemiddelde" radius={[6, 6, 0, 0]} fill="var(--mf-green)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
