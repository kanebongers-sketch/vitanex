'use client'

import { useState, type ReactNode } from 'react'
import { ClipboardCheck } from 'lucide-react'
import type { CoachFase, WeekBlok } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { WeekBlokjes } from '@/components/lifeos/pt-eigenaar/WeekBlokjes'
import { CoachingAfronden } from '@/components/lifeos/pt/CoachingAfronden'
import { CoachInplanForm } from '@/components/lifeos/pt/CoachInplanForm'
import { LeadLinkRegel } from '@/components/lifeos/pt/LeadLinkRegel'
import { CoachRijOpbouw } from '@/components/lifeos/pt-eigenaar/CoachRijOpbouw'
import { useCoachBeheer } from './CoachgesprekkenBeheer'

// Een PT'er in het coach-overzicht van de beheerder: dezelfde rustige regel als
// bij eigenaren, met de acties erbij. De blokjes van deze en volgende week: een
// leeg blokje opent het inplannen in die week. Verslag invullen na een gesprek,
// Afronden altijd. Het formulier opent onder de
// regel; de lead-link en pincode staan in de uitklap.

type Modus = 'dicht' | 'inplannen' | 'afronden'

interface Props {
  ptId: string
  fase: CoachFase
  kop: ReactNode
  /** Blokjes van deze en volgende week; een leeg blokje opent het inplannen in die week. */
  weken: { deze: WeekBlok; volgende: WeekBlok }
  samenvatting: string
  inhoud: ReactNode
}

export function CoachRijBeheer({ ptId, fase, kop, weken, samenvatting, inhoud }: Props) {
  const beheer = useCoachBeheer()
  const pt = beheer?.pt(ptId) ?? null
  const [modus, setModus] = useState<Modus>('dicht')
  const [voorstel, setVoorstel] = useState<string | undefined>(undefined)

  async function sluitEnVernieuw() {
    setModus('dicht')
    await beheer?.vernieuw()
  }

  function plan(dag: string) {
    setVoorstel(dag)
    setModus('inplannen')
  }

  const teVerslaan = pt?.extra?.teVerslaan === true
  // De blokjes staan er altijd; klikken kan zodra de gegevens voor inplannen geladen zijn.
  const acties = (
    <>
      <WeekBlokjes deze={weken.deze} volgende={weken.volgende} onKies={pt && modus === 'dicht' ? plan : undefined} />
      {pt && modus === 'dicht' ? (
        <button
          type="button"
          className={`ptd-knop ptd-knop--klein${teVerslaan ? ' ptd-knop--primair' : ''}`}
          onClick={() => setModus('afronden')}
        >
          <ClipboardCheck size={14} strokeWidth={2.2} aria-hidden /> {teVerslaan ? 'Verslag invullen' : 'Afronden'}
        </button>
      ) : null}
    </>
  )

  const formulier =
    pt && modus === 'inplannen' ? (
      <CoachInplanForm key={voorstel} pt={pt} startDatum={voorstel} onKlaar={sluitEnVernieuw} onAnnuleer={() => setModus('dicht')} />
    ) : pt && modus === 'afronden' ? (
      <CoachingAfronden pt={pt} onKlaar={sluitEnVernieuw} onAnnuleer={() => setModus('dicht')} />
    ) : null

  return (
    <CoachRijOpbouw
      fase={fase}
      kop={kop}
      acties={acties}
      formulier={formulier}
      samenvatting={samenvatting}
      inhoud={inhoud}
      extra={pt && beheer ? <LeadLinkRegel pt={pt} onVernieuw={beheer.vernieuw} /> : null}
    />
  )
}
