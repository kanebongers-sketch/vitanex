/**
 * Apple Health-stijl metriek-tegel: gekleurd label met icoon,
 * grote waarde met eenheid, sparkline rechts en datum onderaan.
 */
import { ChevronRight, Footprints, Moon, HeartPulse, Sparkles, Smile, Flame, type LucideIcon } from 'lucide-react'
import { METRICS, STEMMING_INFO, datumLang, type MetricKey, type MetricSamenvatting, type TrendPunt } from '@/lib/gezondheid-metrics'
import Sparkline from './Sparkline'

/** Lucide-icoon + navy/cyan-token per metriek — vervangt de emoji + hardcoded hex uit METRICS. */
const VISUAL: Record<MetricKey, { Icon: LucideIcon; kleur: string; kleurLicht: string }> = {
  stappen:   { Icon: Footprints, kleur: 'var(--mf-green)',           kleurLicht: 'var(--mf-green-light)' },
  slaap:     { Icon: Moon,       kleur: 'var(--mf-purple)',          kleurLicht: 'var(--mf-purple-light)' },
  hartslag:  { Icon: HeartPulse, kleur: 'var(--mf-red)',             kleurLicht: 'var(--mf-red-light)' },
  welzijn:   { Icon: Sparkles,   kleur: 'var(--mentaforce-primary)', kleurLicht: 'var(--mentaforce-primary-light)' },
  stemming:  { Icon: Smile,      kleur: 'var(--mf-blue)',            kleurLicht: 'var(--mf-blue-light)' },
  calorieen: { Icon: Flame,      kleur: 'var(--mf-amber)',           kleurLicht: 'var(--mf-amber-light)' },
}

interface MetricTileProps {
  metricKey: MetricKey
  samenvatting: MetricSamenvatting
  trend: TrendPunt[]
  onOpen: (key: MetricKey) => void
}

export default function MetricTile({ metricKey, samenvatting, trend, onOpen }: MetricTileProps) {
  const cfg = METRICS[metricKey]
  const visual = VISUAL[metricKey]
  const Icon = visual.Icon

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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: visual.kleur }}>
          <span aria-hidden="true" style={{
            width: 26, height: 26, borderRadius: 8, background: visual.kleurLicht,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} strokeWidth={2.25} style={{ color: visual.kleur }} />
          </span>
          {cfg.label}
        </span>
        <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--text-4)' }} />
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
        <Sparkline waarden={samenvatting.spark} kleur={visual.kleur} />
      </div>
    </button>
  )
}
