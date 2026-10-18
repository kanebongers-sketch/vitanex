'use client'

import { useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/app/verzoek'
import { LEDENAPP_PAD } from '@/lib/club/ledenlogin/contract'

// Pincode kiezen (eerste keer, twee keer intikken) of inloggen met de pincode.
// De code van de link gaat alleen mee op /mijn/start/<code>; op /mijn/inloggen
// leest de server de onthouden link uit een httpOnly-cookie.

interface Props {
  modus: 'kiezen' | 'inloggen'
  /** Alleen op /mijn/start/<code>. */
  code: string | null
}

const ALLEEN_CIJFERS = /\D/g

function PinVeld({ id, label, waarde, onWaarde, autoFocus }: { id: string; label: string; waarde: string; onWaarde: (w: string) => void; autoFocus?: boolean }) {
  return (
    <div className="club-mijn-pin">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete={id === 'pin-nieuw' || id === 'pin-herhaal' ? 'new-password' : 'current-password'}
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus={autoFocus}
        value={waarde}
        onChange={(e) => onWaarde(e.target.value.replace(ALLEEN_CIJFERS, '').slice(0, 6))}
      />
    </div>
  )
}

export function LidInlogFormulier({ modus, code }: Props) {
  const [pin, setPin] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (pin.length !== 6) return setFout('Vul 6 cijfers in.')
    if (modus === 'kiezen' && pin !== herhaal) return setFout('De twee pincodes zijn niet gelijk.')
    setBezig(true)
    setFout(null)
    const body = code ? { pin, code } : { pin }
    const uit = await stuur(modus === 'kiezen' ? '/api/club/lid/pin' : '/api/club/lid/inloggen', 'POST', body)
    if (uit.ok) {
      // Vervangen, niet toevoegen: terug gaat niet naar de inlogpagina met de code.
      window.location.replace(LEDENAPP_PAD)
      return
    }
    setBezig(false)
    setPin('')
    setHerhaal('')
    setFout(uit.fout)
  }

  return (
    <form className="club-mijn-blok" onSubmit={(e) => void verstuur(e)} noValidate>
      {modus === 'kiezen' ? (
        <>
          <PinVeld id="pin-nieuw" label="Kies een pincode van 6 cijfers" waarde={pin} onWaarde={setPin} autoFocus />
          <PinVeld id="pin-herhaal" label="Nog een keer" waarde={herhaal} onWaarde={setHerhaal} />
        </>
      ) : (
        <PinVeld id="pin" label="Je pincode" waarde={pin} onWaarde={setPin} autoFocus />
      )}
      <div aria-live="assertive">{fout ? <p className="club-mijn-inlog-fout" role="alert">{fout}</p> : null}</div>
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig}>
        {bezig ? 'Even geduld...' : modus === 'kiezen' ? 'Pincode opslaan' : 'Inloggen'}
      </button>
    </form>
  )
}
