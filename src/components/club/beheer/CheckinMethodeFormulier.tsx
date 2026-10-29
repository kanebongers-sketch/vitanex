'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKIN_METHODES, checkinMethodeLabel, type CheckinMethode } from '@/lib/club/kern/org-instellingen'
import { stuur } from '@/components/club/leden/stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// Hoe leden inchecken: met de wisselende QR-code in de app (balie-camera,
// scanner of het zelf-check-in scherm), door zoeken aan de balie, of allebei.

export function CheckinMethodeFormulier({ begin }: { begin: CheckinMethode }) {
  const router = useRouter()
  const [methode, setMethode] = useState<CheckinMethode>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const taal = useTaal()
  const tekst = useTekst(BEHEER)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { checkin: { methode } })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: tekst.checkin.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">{tekst.checkin.vraag}</legend>
        {CHECKIN_METHODES.map((m) => (
          <label key={m} className="club-beheer-keuze">
            <input type="radio" name="checkin-methode" value={m} checked={methode === m} onChange={() => setMethode(m)} />
            <span>
              {checkinMethodeLabel(m, taal)}
              <small className="club-hint" style={{ display: 'block' }}>{tekst.checkin.uitleg[m]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || methode === begin} onClick={() => void bewaar()}>
          {bezig ? tekst.algemeen.bezig : tekst.algemeen.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
