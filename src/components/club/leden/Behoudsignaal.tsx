import { behoudLabel, type Behoud } from '@/lib/club/leden/behoud'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { BEHOUD_CHIP } from '@/lib/club/leden/weergave'

// Het behoudssignaal in een rij: een dunne meter, de score en de uitleg in
// mensentaal (precies dezelfde als op de ledenkaart). Zonder score (gepauzeerd,
// opgezegd, gestopt) een korte reden.

interface BehoudsignaalProps {
  behoud: Behoud | null
  /** Leg uit waarom er geen score is. */
  geenTekst?: string
  taal: Taal
}

export function Behoudsignaal({ behoud, geenTekst, taal }: BehoudsignaalProps) {
  const t = LEDEN[taal].behoud
  if (!behoud) return <span className="club-leden-behoud-geen">{geenTekst ?? t.geenBezoekVerwacht}</span>
  return (
    <div className={`club-leden-behoud club-leden-behoud--${behoud.label}`}>
      <div className="club-leden-behoud-boven">
        <span className={`club-chip ${BEHOUD_CHIP[behoud.label]}`}>{behoudLabel(behoud.label, taal)}</span>
        <span className="club-leden-behoud-score club-getal" aria-label={t.score(behoud.score)}>
          {behoud.score}
        </span>
        <span className="club-leden-meter" aria-hidden>
          <span style={{ transform: `scaleX(${behoud.score / 100})` }} />
        </span>
      </div>
      <span className="club-leden-behoud-uitleg" title={behoud.uitleg}>{behoud.uitleg}</span>
    </div>
  )
}
