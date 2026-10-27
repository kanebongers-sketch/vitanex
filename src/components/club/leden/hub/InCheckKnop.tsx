'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { isCheckinAntwoord } from '@/lib/club/checkin/types'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { stuur } from '../stuur'

// Het lid inchecken vanaf de kaart, met dezelfde regels als de balie: past het
// niet bij het lidmaatschap, dan eerst de waarschuwing met "Toch inchecken".

interface InCheckKnopProps {
  lidId: string
  voornaam: string
  vestiging: string
}

type Melding = { soort: 'ok' | 'fout'; tekst: string } | { soort: 'waarschuwing'; tekst: string }

export function InCheckKnop({ lidId, voornaam, vestiging }: InCheckKnopProps) {
  const w = useTekst(LEDENKAART).inchecken
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding | null>(null)
  const [, startTransition] = useTransition()

  async function checkIn(toch: boolean) {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/checkin', 'POST', { lidId, vestiging, bron: 'balie', toch })
    setBezig(false)
    if (!uit.ok) return setMelding({ soort: 'fout', tekst: uit.fout })
    const a = isCheckinAntwoord(uit.data) ? uit.data : null
    if (!a) return setMelding({ soort: 'fout', tekst: w.niet(voornaam) })
    if (a.soort === 'vorm_waarschuwing') return setMelding({ soort: 'waarschuwing', tekst: a.reden })
    if (a.soort === 'ingecheckt') {
      setMelding({ soort: 'ok', tekst: w.gelukt(voornaam) })
      startTransition(() => router.refresh())
      return
    }
    setMelding(a.soort === 'dubbel' ? { soort: 'ok', tekst: w.alBinnen(voornaam) } : { soort: 'fout', tekst: w.niet(voornaam) })
  }

  return (
    <div className="club-lidhub-incheck">
      <button type="button" className="club-knop" onClick={() => void checkIn(false)} disabled={bezig} aria-busy={bezig || undefined}>
        <LogIn aria-hidden size={16} /> {bezig ? w.bezig : w.knop}
      </button>
      {melding?.soort === 'waarschuwing' ? (
        <div className="club-melding club-melding--fout club-lidhub-melding" role="alert">
          <p>{melding.tekst}</p>
          <div className="club-acties">
            <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void checkIn(true)}>{w.toch}</button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setMelding(null)}>{w.annuleer}</button>
          </div>
        </div>
      ) : melding ? (
        <p className={`club-melding ${melding.soort === 'ok' ? 'club-melding--ok' : 'club-melding--fout'} club-lidhub-melding`} role="status">{melding.tekst}</p>
      ) : null}
    </div>
  )
}
