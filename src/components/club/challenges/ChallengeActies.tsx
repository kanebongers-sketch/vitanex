'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Square } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'

// Wijzigen (opent het formulier via de URL) en stoppen (met bevestiging).
// Stoppen telt vanaf vandaag niets meer mee; de stand blijft terug te zien.

interface Props {
  id: string
  titel: string
  wijzigHref: string
}

export function ChallengeActies({ id, titel, wijzigHref }: Props) {
  const router = useRouter()
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const t = useTekst(CHALLENGES).acties

  async function stop() {
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/challenges/${id}`, 'PATCH', { actie: 'stoppen' })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setBevestig(false)
    router.refresh()
  }

  return (
    <div className="club-challenges-acties">
      {bevestig ? (
        <div className="club-challenges-bevestig" role="group" aria-label={t.stoppenLabel(titel)}>
          <span>{t.stoppenVraag}</span>
          <button type="button" className="club-knop club-knop--gevaar club-knop--klein" onClick={() => void stop()} disabled={bezig}>
            {bezig ? t.bezig : t.jaStoppen}
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setBevestig(false)} disabled={bezig}>
            {t.nee}
          </button>
        </div>
      ) : (
        <>
          <Link href={wijzigHref} scroll={false} className="club-knop club-knop--klein">
            <Pencil size={14} aria-hidden /> {t.wijzigen}
          </Link>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setBevestig(true)}>
            <Square size={14} aria-hidden /> {t.stoppen}
          </button>
        </>
      )}
      <div role="alert" aria-live="assertive" className="club-challenges-fout">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
    </div>
  )
}
