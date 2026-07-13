import type { CSSProperties } from 'react'
import { Dumbbell, Brain, Target, type LucideIcon } from 'lucide-react'
import { PIJLERS, type Pijler } from '@/lib/coaching/pijlers'

// Klein herbruikbaar pijler-label. Kleur + icoon + tekst komen samen zodat de
// pijler nooit alléén op kleur wordt onderscheiden (toegankelijkheid).

const PIJLER_ICOON: Record<Pijler, LucideIcon> = {
  body: Dumbbell,
  mind: Brain,
  performance: Target,
}

export interface PijlerBadgeProps {
  pijler: Pijler
  /** Compacte variant zonder tekst (alleen icoon), voor krappe rijen. */
  compact?: boolean
  style?: CSSProperties
}

export function PijlerBadge({ pijler, compact = false, style }: PijlerBadgeProps) {
  const info = PIJLERS[pijler]
  const Icoon = PIJLER_ICOON[pijler]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '3px 8px' : '4px 11px',
        borderRadius: '100px',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        color: info.kleurToken,
        background: info.accentBgToken,
        border: `1px solid color-mix(in srgb, ${info.kleurToken} 38%, transparent)`,
        ...style,
      }}
    >
      <Icoon size={13} aria-hidden />
      {!compact && info.label}
    </span>
  )
}
