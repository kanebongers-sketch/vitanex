'use client'

import { CoachingBlok } from './CoachingBlok'
import { useCoaching } from './useCoaching'

// Laadt de coaching van een oefening en toont die. Is er (nog) geen coaching,
// of lukt het laden niet, dan blijft de korte uitleg en de aandachtspunten uit
// de bibliotheek staan: er is altijd iets te lezen.

interface OefeningCoachingProps {
  naam: string
  uitleg: string | null
  aandachtspunten: string | null
  kop?: 'h3' | 'h4'
  /** Tekst als er helemaal geen uitleg is. */
  leeg: string
}

export function OefeningCoaching({ naam, uitleg, aandachtspunten, kop: Kop = 'h3', leeg }: OefeningCoachingProps) {
  const staat = useCoaching(naam)
  if (staat.status === 'laden') {
    return (
      <div className="club-coach-laden" aria-busy="true" aria-label="Uitleg laden">
        <span />
        <span />
        <span />
      </div>
    )
  }
  if (staat.status === 'klaar' && staat.coaching) return <CoachingBlok coaching={staat.coaching} kop={Kop} />
  return (
    <div className="club-coach">
      <section>
        <Kop className="club-coach-kop">Uitvoering</Kop>
        <p className="club-coach-tekst">{uitleg ?? leeg}</p>
      </section>
      {aandachtspunten && (
        <section>
          <Kop className="club-coach-kop">Aandachtspunten</Kop>
          <p className="club-coach-tekst">{aandachtspunten}</p>
        </section>
      )}
    </div>
  )
}
