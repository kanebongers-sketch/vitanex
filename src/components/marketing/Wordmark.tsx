import { COLORS } from './theme'

interface WordmarkProps {
  /** Lettergrootte van het woordmerk in px. */
  size?: number
  /** Verberg de tekst onder `sm` (alleen de cyaan stip) — voor krappe navbars. */
  compact?: boolean
}

// Hét woordmerk: MENTAFORCE in kapitaal met de cyaan stip. Eén implementatie
// voor navbar(s) en footer, zodat tracking/gewicht/stip nergens uiteenlopen.
export default function Wordmark({ size = 16, compact = false }: WordmarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="shrink-0"
        style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.cyan, boxShadow: `0 0 12px ${COLORS.cyanGlow}` }}
      />
      <span
        className={compact ? 'hidden sm:inline' : undefined}
        style={{ fontWeight: 700, fontSize: size, letterSpacing: '0.14em', color: COLORS.ink }}
      >
        MENTAFORCE
      </span>
    </span>
  )
}
