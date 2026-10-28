import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Sparklijn } from './Sparklijn'

// Een cijfertegel van het designsysteem: label boven, het cijfer groot, een
// eenheid als kleinere grijze toevoeging, daaronder de vergelijking (kleur
// zegt beter of slechter, niet omhoog of omlaag; zonder basis grijs) en
// eventueel een sparklijn of meter. Met `hoofd` is het het hoofdcijfer van een
// blok: groter, en de rest staat er rustiger naast.

export type Oordeel = 'beter' | 'slechter' | 'gelijk' | null

export interface Verschil {
  tekst: string
  oordeel: Oordeel
}

export interface Trend {
  waarden: readonly (number | null)[]
  label: string
  lopend?: boolean
}

interface CijferTegelProps {
  label: string
  waarde: string
  eenheid?: string
  verschil?: Verschil | null
  /** Een rustige regel onder het cijfer (de basis of de periode). */
  sub?: ReactNode
  trend?: Trend | null
  /** Een meter (0 tot 1) onder het cijfer, bijvoorbeeld een bezetting. */
  meter?: { deel: number; label: string } | null
  hoofd?: boolean
  href?: string
  /** Een waarde zonder data: het cijfer wordt een grijs streepje. */
  leeg?: boolean
}

const OORDEEL_KLASSE: Record<Exclude<Oordeel, null>, string> = {
  beter: 'club-stat-delta--beter',
  slechter: 'club-stat-delta--slechter',
  gelijk: '',
}

export function Meter({ deel, label }: { deel: number; label: string }) {
  const veilig = Math.min(1, Math.max(0, deel))
  return (
    <span className="club-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(veilig * 100)}>
      <span className="club-meter-vul" style={{ '--deel': veilig } as CSSProperties} data-hoog={veilig >= 0.9 || undefined} />
    </span>
  )
}

function Inhoud({ label, waarde, eenheid, verschil, sub, trend, meter, hoofd, leeg }: CijferTegelProps) {
  return (
    <>
      <span className="club-stat-label">{label}</span>
      <span className="club-stat-rij">
        <strong className={hoofd ? 'club-stat-waarde club-stat-waarde--hoofd' : 'club-stat-waarde'} data-leeg={leeg || undefined}>
          {leeg ? '–' : waarde}
          {eenheid && !leeg ? <span className="club-stat-eenheid">{eenheid}</span> : null}
        </strong>
        {trend ? <Sparklijn waarden={trend.waarden} label={trend.label} lopend={trend.lopend} breedte={hoofd ? 168 : 96} hoogte={hoofd ? 44 : 30} /> : null}
      </span>
      {meter ? <Meter deel={meter.deel} label={meter.label} /> : null}
      {verschil ? <span className={`club-stat-delta ${verschil.oordeel ? OORDEEL_KLASSE[verschil.oordeel] : ''}`}>{verschil.tekst}</span> : null}
      {sub ? <span className="club-stat-sub">{sub}</span> : null}
    </>
  )
}

export function CijferTegel(props: CijferTegelProps) {
  const klasse = props.hoofd ? 'club-stat club-stat--hoofd' : 'club-stat'
  if (props.href) {
    return (
      <Link href={props.href} className={`${klasse} club-stat--link`}>
        <Inhoud {...props} />
      </Link>
    )
  }
  return (
    <div className={klasse}>
      <Inhoud {...props} />
    </div>
  )
}

/** Een rij cijfertegels in een vlak, gescheiden door haarlijnen (geen losse kaartjes). */
export function CijferStrook({ label, children, kolommen }: { label: string; children: ReactNode; kolommen?: number }) {
  return (
    <section className="club-stats" aria-label={label} style={kolommen ? ({ '--club-stats-kolommen': kolommen } as CSSProperties) : undefined}>
      {children}
    </section>
  )
}
