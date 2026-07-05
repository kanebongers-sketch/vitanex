// ─── Trendoverzicht — het lange-termijn-verhaal in één blik ───────────────────
// Opent met de actieve dagen over de hele periode, een schuldvrije richting-
// zin en een mini-balkje per week. Streaks staan er compact onder: erkenning,
// geen hoofdattractie. Alles komt uit al opgehaalde check-in-data.

import { Flame, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import SectieKop from './SectieKop'
import { bepaalRichting, dagWoord, type StreakData, type WeekStats } from './trend'

interface TrendOverzichtProps {
  streak: StreakData
  weekStats: WeekStats[]
  /** Waarden pas vullen ná eerste paint, zodat balken zacht inlopen. */
  animKlaar: boolean
}

const WEEK_LABELS = ['3 wkn terug', '2 wkn terug', 'vorige week', 'deze week'] as const

function WekenBalk({ weekStats, animKlaar }: { weekStats: WeekStats[]; animKlaar: boolean }) {
  const max = Math.max(7, ...weekStats.map(w => w.checkins))
  const beschrijving = weekStats
    .map((w, i) => `${WEEK_LABELS[i] ?? w.week}: ${w.checkins}`)
    .join(', ')

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8 }}>
        Check-ins per week
      </p>
      <p className="sr-only">Check-ins per week — {beschrijving}</p>
      <div aria-hidden="true" style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {weekStats.map((w, i) => {
          const isNu = i === weekStats.length - 1
          return (
            <div key={w.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: isNu ? 'var(--mentaforce-primary)' : 'var(--text-4)',
              }}>
                {w.checkins}
              </span>
              <div style={{
                width: 18, height: 34, borderRadius: 5, overflow: 'hidden',
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-end',
              }}>
                <div className="vg-week-vul" style={{
                  width: '100%', height: '100%',
                  background: isNu
                    ? 'var(--mentaforce-primary)'
                    : 'color-mix(in srgb, var(--mentaforce-primary) 45%, transparent)',
                  transformOrigin: 'bottom center',
                  transform: `scaleY(${animKlaar ? w.checkins / max : 0})`,
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{w.week}</span>
            </div>
          )
        })}
      </div>
      <style>{balkStijl}</style>
    </div>
  )
}

const balkStijl = `
.vg-week-vul { transition: transform 0.4s var(--ease); }
@media (prefers-reduced-motion: reduce) {
  .vg-week-vul { transition: none; }
}
`

export default function TrendOverzicht({ streak, weekStats, animKlaar }: TrendOverzichtProps) {
  const richting = bepaalRichting(weekStats)

  return (
    <Card style={{ padding: '22px 24px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
      <SectieKop>Het grote plaatje</SectieKop>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 280px', minWidth: 240 }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {streak.totaal_dagen} actieve {dagWoord(streak.totaal_dagen)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            in de afgelopen 30 dagen
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {richting.label && (
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--mentaforce-primary)',
                border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)',
                borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
              }}>
                {richting.label}
              </span>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, minWidth: 180, flex: 1 }}>
              {richting.tekst}
            </p>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <WekenBalk weekStats={weekStats} animKlaar={animKlaar} />
        </div>
      </div>

      {/* Streaks — compact, feitelijk, zonder druk */}
      <div style={{
        display: 'flex', gap: 24, flexWrap: 'wrap',
        borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 14,
      }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-3)' }}>
          <span style={{ display: 'inline-flex', color: 'var(--mentaforce-primary)' }}><Flame size={15} aria-hidden /></span>
          Huidige streak
          <span style={{ fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
            {streak.huidige_streak} {dagWoord(streak.huidige_streak)}
          </span>
        </p>
        <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-3)' }}>
          <span style={{ display: 'inline-flex', color: 'var(--mf-amber)' }}><Trophy size={15} aria-hidden /></span>
          Langste streak
          <span style={{ fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
            {streak.langste_streak} {dagWoord(streak.langste_streak)}
          </span>
        </p>
      </div>
    </Card>
  )
}
