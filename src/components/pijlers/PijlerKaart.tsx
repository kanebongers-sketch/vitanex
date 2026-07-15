import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import type { PijlerDef } from '@/lib/pijlers/pijlers'
import { scoreNiveau, type Trend } from '@/lib/pijlers/score'
import { PIJLER_ICOON } from './iconen'

interface PijlerKaartProps {
  pijler: PijlerDef
  score: number | null
  trend: Trend
}

/**
 * Herbruikbare pijler-kaart (Home-grid, Progress, detail). Presentational en puur.
 * Toont score + niveau-kleur + trend, of een eerlijke "nog geen data"-staat.
 * Styling via de gedeelde `.mf-pk`-klasse in globals.css (ontworpen hover/focus).
 */
/**
 * Trend als voorleesbare tekst. Nodig omdat het aria-label op de <Link> de
 * inhoud OVERSCHRIJFT — zonder dit hoort een screenreader de trend-chip nooit,
 * terwijl ziende gebruikers hem wel zien.
 */
function trendVoorLabel(trend: Trend): string {
  if (trend.richting === 'geen' || trend.deltaPct === null) return ''
  if (trend.richting === 'stabiel') return ', trend stabiel'
  return `, trend ${Math.abs(trend.deltaPct)} procent ${trend.richting === 'op' ? 'omhoog' : 'omlaag'}`
}

export function PijlerKaart({ pijler, score, trend }: PijlerKaartProps) {
  const niveau = scoreNiveau(score)
  const Icon = PIJLER_ICOON[pijler.key]
  const heeftData = score !== null

  return (
    <Link
      href={`/pijler/${pijler.key}`}
      className="mf-pk"
      // Komma's i.p.v. em-dash: die wordt per screenreader-engine anders
      // (of niet) voorgelezen.
      aria-label={
        heeftData
          ? `${pijler.label}: ${score} van 100, ${niveau.label}${trendVoorLabel(trend)}`
          : `${pijler.label}: ${niveau.label}`
      }
    >
      <div className="mf-pk-top">
        <span className="mf-pk-ico" style={{ background: niveau.zacht, color: niveau.kleur }}>
          <Icon size={16} strokeWidth={2} aria-hidden />
        </span>
        <TrendChip trend={trend} />
      </div>

      <span className="mf-pk-label">{pijler.label}</span>

      <span className="mf-pk-score" style={{ color: heeftData ? niveau.kleur : 'var(--text-4)' }}>
        {heeftData ? score : '—'}
        {heeftData && <span className="mf-pk-max">/100</span>}
      </span>

      <span className="mf-pk-niveau">{niveau.label}</span>
    </Link>
  )
}

function TrendChip({ trend }: { trend: Trend }) {
  if (trend.richting === 'geen' || trend.deltaPct === null) {
    return null
  }
  if (trend.richting === 'stabiel') {
    return (
      <span className="mf-pk-trend" style={{ color: 'var(--text-4)' }}>
        <Minus size={12} strokeWidth={2.4} aria-hidden /> stabiel
      </span>
    )
  }
  const omhoog = trend.richting === 'op'
  const Icon = omhoog ? ArrowUpRight : ArrowDownRight
  // Hoger = beter voor élke pijler (stress is geïnverteerd), dus op = positief.
  const kleur = omhoog ? 'var(--brand)' : 'var(--status-danger)'
  return (
    <span className="mf-pk-trend" style={{ color: kleur }}>
      <Icon size={12} strokeWidth={2.4} aria-hidden />
      {omhoog ? '+' : ''}{trend.deltaPct}%
    </span>
  )
}
