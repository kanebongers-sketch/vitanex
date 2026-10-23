'use client'

import { useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { stuur } from '@/components/club/leden/stuur'

// De inlog van de platform-eigenaar (master account van Kane) op aiyourgym.com.
// Met de startlink de eerste keer een pincode kiezen (twee keer intikken), en
// daarna met dezelfde link inloggen. Na een goede pin meteen naar Club.

const PIN = /^\d{6}$/

interface PlatformInlogProps {
  code: string
  /** 'kiezen': nog geen pincode; 'inloggen': er is een pincode. */
  stand: 'kiezen' | 'inloggen'
}

function alleenCijfers(v: string): string {
  return v.replace(/\D/g, '').slice(0, 6)
}

export function PlatformInlog({ code, stand }: PlatformInlogProps) {
  const [pin, setPin] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const kiezen = stand === 'kiezen'
  const basis = `/api/club/inloggen/platform/${encodeURIComponent(code)}`

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!PIN.test(pin)) return setFout('Een pincode is precies 6 cijfers.')
    if (kiezen && pin !== herhaal) return setFout('De twee pincodes zijn niet gelijk.')
    setBezig(true)
    setFout(null)
    const uit = await stuur(kiezen ? `${basis}/pin` : basis, 'POST', { pin })
    setPin('')
    setHerhaal('')
    if (!uit.ok) {
      setBezig(false)
      return setFout(uit.fout)
    }
    window.location.assign('/club')
  }

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <p className="club-inlog-merk">
        <AygLogo opDonker className="club-inlog-ayg" />
        <span className="club-inlog-club">Platform</span>
      </p>
      <h1 id="club-inlog-kop">{kiezen ? 'Kies je pincode' : 'Inloggen'}</h1>
      <p className="club-inlog-rol">Platform-eigenaar</p>
      <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <p className="club-inlog-uitleg">
          {kiezen
            ? 'Kies een pincode van 6 cijfers. Daarna log je met deze link en die pincode in. Bewaar de link goed: hij is je vaste inloglink.'
            : 'Vul je pincode van 6 cijfers in.'}
        </p>
        <label className="club-veld">
          <span>{kiezen ? 'Nieuwe pincode' : 'Pincode'}</span>
          <input
            className="club-invoer club-inlog-pin"
            type="password"
            inputMode="numeric"
            autoComplete={kiezen ? 'new-password' : 'current-password'}
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(alleenCijfers(e.target.value))}
            aria-invalid={fout ? true : undefined}
            aria-describedby={fout ? 'club-inlog-fout' : undefined}
            autoFocus
          />
        </label>
        {kiezen && (
          <label className="club-veld">
            <span>Herhaal pincode</span>
            <input
              className="club-invoer club-inlog-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={herhaal}
              onChange={(e) => setHerhaal(alleenCijfers(e.target.value))}
            />
          </label>
        )}
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
          <LockKeyhole aria-hidden size={18} />
          {bezig ? 'Even wachten...' : kiezen ? 'Pincode kiezen' : 'Inloggen'}
        </button>
        {fout && (
          <p id="club-inlog-fout" className="club-melding club-melding--fout" role="alert">
            {fout}
          </p>
        )}
      </form>
    </section>
  )
}
