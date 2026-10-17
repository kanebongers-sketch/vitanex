'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'

// Het plan van een lid weghalen, met een bevestiging.

interface VerwijderPlanProps {
  lidId: string
  terugHref: string
}

export function VerwijderPlan({ lidId, terugHref }: VerwijderPlanProps) {
  const router = useRouter()
  const [vraag, setVraag] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function weg() {
    setBezig(true)
    const uit = await stuur(`/api/club/voeding/leden/${lidId}`, 'DELETE')
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.push(terugHref)
    router.refresh()
  }

  if (!vraag) {
    return (
      <button type="button" className="club-knop club-knop--stil" onClick={() => setVraag(true)}>
        Plan weghalen
      </button>
    )
  }
  return (
    <span className="club-voeding-acties" role="group" aria-label="Plan weghalen bevestigen">
      <span className="club-voeding-hint">Het lid ziet dan geen plan meer.</span>
      <button type="button" className="club-knop club-knop--gevaar club-knop--klein" disabled={bezig} onClick={() => void weg()}>
        {bezig ? 'Even geduld...' : 'Ja, weghalen'}
      </button>
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setVraag(false)}>
        Toch niet
      </button>
      {fout && <span className="club-melding club-melding--fout">{fout}</span>}
    </span>
  )
}
