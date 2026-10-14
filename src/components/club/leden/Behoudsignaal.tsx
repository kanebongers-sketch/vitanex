import { BEHOUD_LABEL, type Behoud } from '@/lib/club/leden/behoud'
import { BEHOUD_CHIP } from '@/lib/club/leden/weergave'

// Het behoudssignaal in een rij: een dunne meter, de score en de uitleg in
// mensentaal. Zonder score (gepauzeerd, opgezegd, gestopt) een rustig streepje.

interface BehoudsignaalProps {
  behoud: Behoud | null
  /** Leg uit waarom er geen score is. */
  geenTekst?: string
}

export function Behoudsignaal({ behoud, geenTekst = 'Geen bezoek verwacht' }: BehoudsignaalProps) {
  if (!behoud) return <span className="club-leden-behoud-geen">{geenTekst}</span>
  return (
    <div className={`club-leden-behoud club-leden-behoud--${behoud.label}`}>
      <div className="club-leden-behoud-boven">
        <span className={`club-chip ${BEHOUD_CHIP[behoud.label]}`}>{BEHOUD_LABEL[behoud.label]}</span>
        <span className="club-leden-behoud-score club-getal" aria-label={`Behoudsscore ${behoud.score} van 100`}>
          {behoud.score}
        </span>
        <span className="club-leden-meter" aria-hidden>
          <span style={{ transform: `scaleX(${behoud.score / 100})` }} />
        </span>
      </div>
      <span className="club-leden-behoud-uitleg">{behoud.uitleg}</span>
    </div>
  )
}
