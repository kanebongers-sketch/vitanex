/**
 * Apple Health-stijl metriek-tegel: gekleurd label met icoon,
 * grote waarde met eenheid, sparkline rechts en datum onderaan.
 */
import { METRICS, STEMMING_INFO, datumLang, type MetricKey, type MetricSamenvatting, type TrendPunt } from '@/lib/gezondheid-metrics'
import Sparkline from './Sparkline'

interface MetricTileProps {
  metricKey: MetricKey
  samenvatting: MetricSamenvatting
  trend: TrendPunt[]
  onOpen: (key: MetricKey) => void
}

export default function MetricTile({ metricKey, samenvatting, trend, onOpen }: MetricTileProps) {
  const cfg = METRICS[metricKey]

  // Stemming toont emoji + label in plaats van een getal
  let waardeTekst = cfg.formatWaarde(samenvatting.laatste)
  let eenheidTekst = cfg.eenheidInWaarde ? '' : cfg.eenheid
  if (metricKey === 'stemming') {
    const laatstePunt = [...trend].reverse().find(p => p.stemming)
    const info = laatstePunt?.stemming ? STEMMING_INFO[laatstePunt.stemming] : undefined
    if (info) { waardeTekst = info.emoji; eenheidTekst = info.label }
  }

  return (
    <button
      onClick={() => onOpen(metricKey)}
      aria-label={`${cfg.label}: ${waardeTekst} ${eenheidTekst}. Open details`}
      className="metric-tile"
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px 12px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: cfg.kleur }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: cfg.kleurLicht,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          }}>{cfg.emoji}</span>
          {cfg.label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontSize: metricKey === 'stemming' ? 30 : 28, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {waardeTekst}
            </span>
            {eenheidTekst && (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginLeft: 5 }}>{eenheidTekst}</span>
            )}
          </p>
          <p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>
            {datumLang(samenvatting.laatsteDatum)}
          </p>
        </div>
        <Sparkline waarden={samenvatting.spark} kleur={cfg.kleur} />
      </div>
    </button>
  )
}
