/**
 * Hoogtepunt-kaart met vergelijkingsbalken (deze week vs vorige week),
 * naar het voorbeeld van de Trends-kaarten in Apple Health.
 */
import { Footprints, Moon, HeartPulse, Sparkles, Smile, Flame, type LucideIcon } from 'lucide-react'
import { METRICS, type MetricKey, type Vergelijking } from '@/lib/gezondheid-metrics'

/** Lucide-icoon + navy/cyan-token per metriek — vervangt de emoji + hardcoded hex uit METRICS. */
const VISUAL: Record<MetricKey, { Icon: LucideIcon; kleur: string; kleurLicht: string }> = {
  stappen:   { Icon: Footprints, kleur: 'var(--mf-green)',           kleurLicht: 'var(--mf-green-light)' },
  slaap:     { Icon: Moon,       kleur: 'var(--mf-purple)',          kleurLicht: 'var(--mf-purple-light)' },
  hartslag:  { Icon: HeartPulse, kleur: 'var(--mf-red)',             kleurLicht: 'var(--mf-red-light)' },
  welzijn:   { Icon: Sparkles,   kleur: 'var(--mentaforce-primary)', kleurLicht: 'var(--mentaforce-primary-light)' },
  stemming:  { Icon: Smile,      kleur: 'var(--mf-blue)',            kleurLicht: 'var(--mf-blue-light)' },
  calorieen: { Icon: Flame,      kleur: 'var(--mf-amber)',           kleurLicht: 'var(--mf-amber-light)' },
}

interface HighlightCardProps {
  vergelijking: Vergelijking
}

function Balk({ label, waarde, max, kleur, gedimd, format }: {
  label: string; waarde: number; max: number; kleur: string; gedimd: boolean
  format: (v: number) => string
}) {
  const breedte = Math.max(12, Math.round((waarde / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', width: 76, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          className="highlight-balk"
          style={{
            width: `${breedte}%`, height: 22, borderRadius: 7,
            background: kleur, opacity: gedimd ? 0.3 : 1,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: gedimd ? 'var(--text-4)' : 'var(--text-1)', whiteSpace: 'nowrap' }}>
          {format(waarde)}
        </span>
      </div>
    </div>
  )
}

export default function HighlightCard({ vergelijking }: HighlightCardProps) {
  const cfg = METRICS[vergelijking.key]
  const visual = VISUAL[vergelijking.key]
  const Icon = visual.Icon
  const max = Math.max(vergelijking.recent.waarde, vergelijking.vorig.waarde) || 1

  return (
    <article style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 16px 14px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span aria-hidden="true" style={{
          width: 24, height: 24, borderRadius: 7, background: visual.kleurLicht,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} strokeWidth={2.25} style={{ color: visual.kleur }} />
        </span>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: visual.kleur }}>{vergelijking.titel}</h3>
      </header>

      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
        {vergelijking.tekst}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Balk
          label={vergelijking.recent.label} waarde={vergelijking.recent.waarde}
          max={max} kleur={visual.kleur} gedimd={false} format={cfg.formatWaarde}
        />
        <Balk
          label={vergelijking.vorig.label} waarde={vergelijking.vorig.waarde}
          max={max} kleur={visual.kleur} gedimd format={cfg.formatWaarde}
        />
      </div>
    </article>
  )
}
