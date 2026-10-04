'use client'

import type { VerloopPunt } from '@/lib/lifeos/pt-gesprek/team'

// Het verloop van de drie scores van een PT'er, als drie kleine lijntjes naast
// elkaar (small multiples): elk met een eigen label en de laatste waarde, dus
// geen legenda nodig en geen kleur die iets moet uitleggen. Schaal 1–5, altijd
// dezelfde, zodat "laag" er overal even laag uitziet. Pas vanaf 2 gesprekken.

const VLAKKEN = [
  { key: 'algemeen', label: 'Algemeen' },
  { key: 'energie', label: 'Energie' },
  { key: 'voortgang', label: 'Voortgang' },
] as const

const B = 64
const H = 22
const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

function Spark({ waarden }: { waarden: readonly number[] }) {
  const x = (i: number) => 2 + (i / (waarden.length - 1)) * (B - 4)
  const y = (v: number) => 2 + (1 - (v - 1) / 4) * (H - 4)
  const d = waarden.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const laatste = waarden[waarden.length - 1]
  return (
    <svg width={B} height={H} viewBox={`0 0 ${B} ${H}`} aria-hidden style={{ display: 'block' }}>
      <line x1={2} x2={B - 2} y1={y(3)} y2={y(3)} stroke="var(--line)" strokeWidth={1} />
      <path d={d} fill="none" stroke="var(--brand)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(waarden.length - 1)} cy={y(laatste)} r={2.5} fill={laatste <= 2 ? 'var(--status-danger)' : 'var(--brand)'} />
    </svg>
  )
}

export function ScoreVerloop({ verloop }: { verloop: readonly VerloopPunt[] }) {
  if (verloop.length < 2) return null
  const van = DAG.format(new Date(verloop[0].op))
  const omschrijving = VLAKKEN.map(({ key, label }) => `${label}: ${verloop.map((v) => v.scores[key]).join(', ')}`).join('; ')
  return (
    <div role="img" aria-label={`Scoreverloop over ${verloop.length} gesprekken sinds ${van}. ${omschrijving}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
      {VLAKKEN.map(({ key, label }) => {
        const waarden = verloop.map((v) => v.scores[key])
        const laatste = waarden[waarden.length - 1]
        return (
          <div key={key} style={{ display: 'grid', gap: 2 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-4)' }}>
              {label} <strong style={{ color: laatste <= 2 ? 'var(--status-danger)' : 'var(--text-2)', fontWeight: 600 }}>{laatste}</strong>
            </span>
            <Spark waarden={waarden} />
          </div>
        )
      })}
    </div>
  )
}
