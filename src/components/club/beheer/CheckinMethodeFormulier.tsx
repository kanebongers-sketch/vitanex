'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKIN_METHODES, CHECKIN_METHODE_LABEL, type CheckinMethode } from '@/lib/club/kern/org-instellingen'
import { stuur } from '@/components/club/leden/stuur'

// Hoe leden inchecken: met de wisselende QR-code in de app (balie-camera,
// scanner of het zelf-check-in scherm), door zoeken aan de balie, of allebei.

const UITLEG: Record<CheckinMethode, string> = {
  beide: 'Leden tonen de QR-code in de app of de balie zoekt ze op. Het zelf-check-in scherm staat aan.',
  qr: 'De balie opent meteen de camera en het zelf-check-in scherm staat aan. Vergeet iemand zijn telefoon, dan zoekt de balie op naam.',
  balie: 'De app toont geen QR-code en het zelf-check-in scherm staat uit. Werkt ook met pasjes of bandjes.',
}

export function CheckinMethodeFormulier({ begin }: { begin: CheckinMethode }) {
  const router = useRouter()
  const [methode, setMethode] = useState<CheckinMethode>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { checkin: { methode } })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: 'Opgeslagen. Balie en ledenapp gebruiken dit meteen.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">Hoe checken leden in?</legend>
        {CHECKIN_METHODES.map((m) => (
          <label key={m} className="club-beheer-keuze">
            <input type="radio" name="checkin-methode" value={m} checked={methode === m} onChange={() => setMethode(m)} />
            <span>
              {CHECKIN_METHODE_LABEL[m]}
              <small className="club-hint" style={{ display: 'block' }}>{UITLEG[m]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || methode === begin} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
