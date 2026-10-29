'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

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
  const t = useTekst(VOEDING).weghalen

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
        {t.knop}
      </button>
    )
  }
  return (
    <span className="club-voeding-acties" role="group" aria-label={t.bevestig}>
      <span className="club-voeding-hint">{t.gevolg}</span>
      <button type="button" className="club-knop club-knop--gevaar club-knop--klein" disabled={bezig} onClick={() => void weg()}>
        {bezig ? t.bezig : t.ja}
      </button>
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setVraag(false)}>
        {t.nee}
      </button>
      {fout && <span className="club-melding club-melding--fout">{fout}</span>}
    </span>
  )
}
