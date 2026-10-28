import type { CSSProperties, ReactNode } from 'react'
import { padVan, sparkStukken } from '@/lib/club/ontwerp/reeks'

// Bouwstenen voor de productschermen op de voorpagina, in de look van het
// designsysteem van Club (src/components/club/ontwerp): cijfertegels in een strook
// met haarlijnen, een sparklijn van rechte stukken met alleen het laatste punt in
// de accentkleur, een meter en een blok met lichtrand. Puur en zonder hooks, met
// eigen klassen (aygp-*, productschermen.css): de Club-css laadt niet op de website.
// Het rekenwerk van de sparklijn komt uit Club zelf (reeks.ts), zodat hij gelijk tekent.

interface SparkProps {
  waarden: readonly (number | null)[]
  label: string
  breedte?: number
  hoogte?: number
}

export function PSpark({ waarden, label, breedte = 96, hoogte = 30 }: SparkProps) {
  const stukken = sparkStukken(waarden, breedte, hoogte, 3)
  if (stukken.length === 0) return null
  const laatsteStuk = stukken[stukken.length - 1]
  const laatste = laatsteStuk[laatsteStuk.length - 1]
  return (
    <svg className="aygp-spark" viewBox={`0 0 ${breedte} ${hoogte}`} width={breedte} height={hoogte} role="img" aria-label={label}>
      <line className="aygp-spark-basis" x1="0" x2={breedte} y1={hoogte - 0.5} y2={hoogte - 0.5} />
      {stukken.map((s) => (
        <path key={`${s[0].x}-${s.length}`} className="aygp-spark-lijn" d={padVan(s)} />
      ))}
      <circle className="aygp-spark-punt" cx={laatste.x} cy={laatste.y} r={3} />
    </svg>
  )
}

export function PMeter({ deel, label }: { deel: number; label: string }) {
  const veilig = Math.min(1, Math.max(0, deel))
  return (
    <span className="aygp-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(veilig * 100)}>
      <span style={{ '--deel': veilig } as CSSProperties} data-hoog={veilig >= 0.9 || undefined} />
    </span>
  )
}

interface CijferProps {
  label: string
  waarde: string
  eenheid?: string
  verschil?: string
  sub?: string
  trend?: { waarden: readonly (number | null)[]; label: string }
  meter?: { deel: number; label: string }
  hoofd?: boolean
}

export function PCijfer({ label, waarde, eenheid, verschil, sub, trend, meter, hoofd }: CijferProps) {
  return (
    <div className={hoofd ? 'aygp-stat aygp-stat--hoofd' : 'aygp-stat'}>
      <span className="aygp-stat-label">{label}</span>
      <span className="aygp-stat-rij">
        <strong className="aygp-stat-waarde">
          {waarde}
          {eenheid ? <span className="aygp-stat-eenheid">{eenheid}</span> : null}
        </strong>
        {trend ? <PSpark waarden={trend.waarden} label={trend.label} breedte={hoofd ? 150 : 96} hoogte={hoofd ? 42 : 30} /> : null}
      </span>
      {meter ? <PMeter deel={meter.deel} label={meter.label} /> : null}
      {verschil ? <span className="aygp-stat-delta">{verschil}</span> : null}
      {sub ? <span className="aygp-stat-sub">{sub}</span> : null}
    </div>
  )
}

/** Een rij cijfertegels in een vlak met haarlijnen, zoals CijferStrook in Club. */
export function PStrook({ label, kolommen, children }: { label: string; kolommen: number; children: ReactNode }) {
  return (
    <div className="aygp-stats" role="group" aria-label={label} style={{ '--kol': kolommen } as CSSProperties}>
      {children}
    </div>
  )
}

/** Een blok met kop en lichtrand, zoals Blok in Club. */
export function PBlok({ titel, extra, children, className }: { titel: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className ? `aygp-blok ${className}` : 'aygp-blok'}>
      <div className="aygp-blok-kop">
        <span>{titel}</span>
        {extra ? <span className="aygp-blok-extra">{extra}</span> : null}
      </div>
      {children}
    </div>
  )
}
