// ─── Weektrends — één grafiekkaart per metriek, over 4 weken ──────────────────
// Presentational: krijgt de al berekende weekgemiddelden binnen en toont per
// metriek een staafgrafiek met de laatste waarde en een week-op-week-delta.

import { Smile, Moon, Target, CheckCircle2, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/ui/Chart'
import SectieKop from './SectieKop'
import type { WeekStats } from './trend'

interface WeekTrendsProps {
  weekStats: WeekStats[]
}

interface TrendDef {
  label: string
  Icon: LucideIcon
  eenheid: string
  kleur: string
  decimalen: boolean
  yMax: number
  lees: (w: WeekStats) => number | null
}

// Trend-metrieken met label/icoon (niet kleur-only) + één-pass delta.
const TREND_DEFS: TrendDef[] = [
  { label: 'Stemming', Icon: Smile, eenheid: '/5', kleur: 'var(--mf-amber)', decimalen: true, yMax: 5, lees: w => w.stemming },
  { label: 'Slaap', Icon: Moon, eenheid: 'u', kleur: 'var(--mf-purple)', decimalen: true, yMax: 9, lees: w => w.slaap },
  { label: 'Focus', Icon: Target, eenheid: 'm', kleur: 'var(--mentaforce-primary)', decimalen: false, yMax: 120, lees: w => w.focus },
  { label: 'Check-ins', Icon: CheckCircle2, eenheid: '×', kleur: 'var(--mf-green)', decimalen: false, yMax: 7, lees: w => w.checkins },
]

export default function WeekTrends({ weekStats }: WeekTrendsProps) {
  return (
    <section style={{ marginBottom: 20 }}>
      <SectieKop style={{ marginBottom: 4 }}>Weektrend (4 weken)</SectieKop>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
        Weekgemiddelden per metriek — zo zie je richting over de maand, niet één losse dag.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {TREND_DEFS.map(metric => {
          const vals = weekStats.map(metric.lees)
          const geldigVals = vals.filter((v): v is number => v !== null && v > 0)
          const latest = geldigVals[geldigVals.length - 1] ?? null
          const vorig = geldigVals[geldigVals.length - 2] ?? null
          const delta = latest !== null && vorig !== null ? latest - vorig : null
          const deltaStr = delta !== null
            ? `${delta >= 0 ? '+' : ''}${metric.decimalen ? delta.toFixed(1) : Math.round(delta)}`
            : null
          // Stress is hier niet aanwezig; hogere waarde = beter voor alle trends.
          const deltaKleur = delta === null ? 'var(--text-4)' : (delta > 0 ? 'var(--mf-green)' : delta < 0 ? 'var(--mf-red)' : 'var(--text-4)')
          const deltaArrow = delta === null ? '→' : delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
          const latestLabel = latest !== null ? `${metric.decimalen ? latest : Math.round(latest)}${metric.eenheid}` : '—'

          const chartData = weekStats.map(w => ({ week: w.week, [metric.label]: metric.lees(w) }))

          return (
            <Card key={metric.label} style={{ padding: '16px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
                  <span style={{ display: 'inline-flex', color: metric.kleur }}><metric.Icon size={14} aria-hidden /></span>
                  {metric.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: metric.kleur, fontVariantNumeric: 'tabular-nums' }}>
                  {latestLabel}
                </span>
              </div>
              <Chart
                type="bar"
                data={chartData}
                xKey="week"
                series={[{ key: metric.label, label: metric.label, color: metric.kleur }]}
                summary={`${metric.label} per week over de laatste 4 weken${metric.eenheid ? `, in ${metric.eenheid}` : ''}.`}
                yDomain={[0, metric.yMax]}
                height={120}
              />
              {deltaStr && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: deltaKleur, fontVariantNumeric: 'tabular-nums' }}>{deltaArrow} {deltaStr}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-4)' }}>vs vorige week</span>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
