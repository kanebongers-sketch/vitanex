'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LENGTE, MIN_LENGTE, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'

// Alleen zolang het master account nog geen wachtwoord heeft (oude pincode-sessie):
// een keer een wachtwoord zetten. Daarna inloggen met e-mailadres en wachtwoord.

export function WachtwoordInstellen({ email }: { email: string }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [staat, setStaat] = useState<'invullen' | 'bezig' | 'klaar'>('invullen')
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    const probleem = wachtwoordFout(wachtwoord, { email })
    if (probleem) return setFout(probleem)
    if (wachtwoord !== herhaal) return setFout('De twee wachtwoorden zijn niet gelijk.')
    setStaat('bezig')
    setFout(null)
    const uit = await stuur('/api/club/platform/wachtwoord', 'POST', { wachtwoord })
    if (!uit.ok) {
      setStaat('invullen')
      return setFout(uit.fout)
    }
    setWachtwoord('')
    setHerhaal('')
    setStaat('klaar')
  }

  if (staat === 'klaar') {
    return (
      <section className="club-kaart" role="status">
        <h2>Wachtwoord ingesteld</h2>
        <p>Voortaan log je in op aiyourgym.com/inloggen met {email} en je wachtwoord. De pincode werkt niet meer.</p>
      </section>
    )
  }
  return (
    <section className="club-kaart" aria-labelledby="ww-kop">
      <h2 id="ww-kop">
        <KeyRound size={16} aria-hidden /> Kies een wachtwoord
      </h2>
      <p>Op aiyourgym.com log je voortaan in met {email} en een wachtwoord in plaats van een pincode. Minstens {MIN_LENGTE} tekens; een zin van 16 tekens of meer is het sterkst.</p>
      <form className="club-ww-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <label className="club-veld">
          <span>Nieuw wachtwoord</span>
          <input className="club-invoer" type="password" autoComplete="new-password" minLength={MIN_LENGTE} maxLength={MAX_LENGTE} value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Herhaal wachtwoord</span>
          <input className="club-invoer" type="password" autoComplete="new-password" maxLength={MAX_LENGTE} value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={staat === 'bezig'}>
          {staat === 'bezig' ? 'Opslaan...' : 'Wachtwoord opslaan'}
        </button>
        {fout && (
          <p className="club-melding club-melding--fout" role="alert">
            {fout}
          </p>
        )}
      </form>
    </section>
  )
}
