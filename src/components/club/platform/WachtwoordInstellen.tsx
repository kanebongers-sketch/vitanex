'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LENGTE, MIN_LENGTE, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'

// Alleen zolang het master account nog geen wachtwoord heeft (oude pincode-sessie):
// een keer een wachtwoord zetten. Daarna inloggen met e-mailadres en wachtwoord.

export function WachtwoordInstellen({ email }: { email: string }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [staat, setStaat] = useState<'invullen' | 'bezig' | 'klaar'>('invullen')
  const [fout, setFout] = useState<string | null>(null)
  const taal = useTaal()
  const t = useTekst(PLATFORM).wachtwoord

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    const probleem = wachtwoordFout(wachtwoord, { email, taal })
    if (probleem) return setFout(probleem)
    if (wachtwoord !== herhaal) return setFout(t.ongelijk)
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
        <h2>{t.klaarKop}</h2>
        <p>{t.klaar(email)}</p>
      </section>
    )
  }
  return (
    <section className="club-kaart" aria-labelledby="ww-kop">
      <h2 id="ww-kop">
        <KeyRound size={16} aria-hidden /> {t.kop}
      </h2>
      <p>{t.uitleg(email, MIN_LENGTE)}</p>
      <form className="club-ww-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <label className="club-veld">
          <span>{t.nieuw}</span>
          <input className="club-invoer" type="password" autoComplete="new-password" minLength={MIN_LENGTE} maxLength={MAX_LENGTE} value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{t.herhaal}</span>
          <input className="club-invoer" type="password" autoComplete="new-password" maxLength={MAX_LENGTE} value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={staat === 'bezig'}>
          {staat === 'bezig' ? t.bezig : t.opslaan}
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
