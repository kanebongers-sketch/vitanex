'use client'

import { useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/app/verzoek'
import { LEDENAPP_PAD } from '@/lib/club/ledenlogin/contract'
import { isZwakkePin } from '@/lib/club/ledenlogin/pin-keuze'

// Pincode kiezen (eerste keer, twee keer intikken) of inloggen met de pincode.
// De code van de link gaat alleen mee op /mijn/start/<code>; op /mijn/inloggen
// leest de server de onthouden link uit een httpOnly-cookie.

interface Props {
  modus: 'kiezen' | 'inloggen'
  /** Alleen op /mijn/start/<code>. */
  code: string | null
}

const ALLEEN_CIJFERS = /\D/g
const FOUT_ID = 'pin-fout'
const HINT_ID = 'pin-hint'

interface PinVeldProps {
  id: string
  label: string
  waarde: string
  onWaarde: (w: string) => void
  autoFocus?: boolean
  /** Uitleg onder het veld (voorgelezen bij het veld). */
  hint?: string
  /** Er staat een foutmelding: het veld wordt als ongeldig gemeld en verwijst ernaar. */
  fout: boolean
}

function PinVeld({ id, label, waarde, onWaarde, autoFocus, hint, fout }: PinVeldProps) {
  const beschrijving = [hint ? HINT_ID : null, fout ? FOUT_ID : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="club-mijn-pin">
      <label htmlFor={id}>{label}</label>
      {hint ? <p id={HINT_ID} className="club-mijn-pin-hint">{hint}</p> : null}
      <input
        id={id}
        aria-invalid={fout || undefined}
        aria-describedby={beschrijving}
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
    // Meteen hier, zonder wachten op de server: zo blijft de eerste pincode staan.
    if (modus === 'kiezen' && isZwakkePin(pin)) return setFout('Deze pincode is te makkelijk te raden. Kies er een zonder reeks of herhaling.')
    if (modus === 'kiezen' && pin !== herhaal) {
      setHerhaal('')
      return setFout('De twee pincodes zijn niet gelijk. Vul hem nog een keer in.')
    }
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
          <PinVeld id="pin-nieuw" label="Kies een pincode van 6 cijfers" hint="Geen reeks of herhaling, zoals 123456 of 111111." waarde={pin} onWaarde={setPin} autoFocus fout={fout !== null} />
          <PinVeld id="pin-herhaal" label="Herhaal je pincode" waarde={herhaal} onWaarde={setHerhaal} fout={fout !== null} />
        </>
      ) : (
        <PinVeld id="pin" label="Je pincode" waarde={pin} onWaarde={setPin} autoFocus fout={fout !== null} />
      )}
      <div aria-live="assertive">{fout ? <p id={FOUT_ID} className="club-mijn-inlog-fout" role="alert">{fout}</p> : null}</div>
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig}>
        {bezig ? 'Even geduld...' : modus === 'kiezen' ? 'Pincode opslaan' : 'Inloggen'}
      </button>
    </form>
  )
}
