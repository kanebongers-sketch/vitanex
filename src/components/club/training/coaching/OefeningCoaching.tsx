'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import { CoachingBlok } from './CoachingBlok'
import { CoachingEditor } from './CoachingEditor'
import { useCoaching, vergeetCoaching } from './useCoaching'

// Laadt de coaching van een oefening en toont die. Is er (nog) geen coaching,
// of lukt het laden niet, dan blijft de korte uitleg en de aandachtspunten uit
// de bibliotheek staan: er is altijd iets te lezen. In de bibliotheek
// (bewerkbaar) kan de sportschool de coaching zelf aanpassen of schrijven.

interface OefeningCoachingProps {
  naam: string
  uitleg: string | null
  aandachtspunten: string | null
  kop?: 'h3' | 'h4'
  /** Tekst als er helemaal geen uitleg is. */
  leeg: string
  /** Met een id kan de coaching worden aangepast (alleen in de bibliotheek). */
  oefeningId?: string
}

const LEEG: Coaching = {
  kernpunten: [{ punt: '', uitleg: '' }, { punt: '', uitleg: '' }, { punt: '', uitleg: '' }],
  opstelling: [''],
  stappen: ['', ''],
  fouten: [{ fout: '', beter: '' }, { fout: '', beter: '' }],
  ademhaling: '',
  tempo: '',
}

function Laden() {
  return (
    <div className="club-coach-laden" role="status" aria-busy="true">
      <span className="club-sr">Uitleg laden</span>
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </div>
  )
}

export function OefeningCoaching({ naam, uitleg, aandachtspunten, kop: Kop = 'h3', leeg, oefeningId }: OefeningCoachingProps) {
  const [versie, setVersie] = useState(0)
  const [bewerken, setBewerken] = useState(false)
  const staat = useCoaching(naam, versie)
  if (staat.status === 'laden') return <Laden />

  const coaching = staat.status === 'klaar' ? staat.coaching : null
  const eigen = staat.status === 'klaar' && staat.eigen

  if (bewerken && oefeningId) {
    const opnieuw = () => {
      vergeetCoaching(naam)
      setBewerken(false)
      setVersie((v) => v + 1)
    }
    return <CoachingEditor oefeningId={oefeningId} begin={coaching ?? LEEG} eigen={eigen} onKlaar={opnieuw} onAnnuleer={() => setBewerken(false)} />
  }

  const knop = oefeningId && staat.status === 'klaar' && (
    <div className="club-coach-bewerk">
      {eigen && <span className="club-chip club-chip--info">Eigen coaching</span>}
      <button type="button" className="club-knop club-knop--klein" onClick={() => setBewerken(true)}>
        <PenLine aria-hidden size={15} /> {coaching ? 'Coaching aanpassen' : 'Coaching schrijven'}
      </button>
    </div>
  )

  if (coaching) {
    return (
      <>
        {knop}
        <CoachingBlok coaching={coaching} kop={Kop} />
      </>
    )
  }
  return (
    <div className="club-coach">
      {knop}
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
