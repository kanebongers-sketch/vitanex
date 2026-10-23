'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LENGTE, MIN_LENGTE, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'

// De uitnodiging van een medewerker: een keer een sterk wachtwoord kiezen en
// meteen binnen. Daarna logt hij in op /inloggen met e-mailadres en wachtwoord.
// De server controleert het wachtwoord opnieuw; hier alleen voor snelle uitleg.

interface Props {
  token: string
  sportschool: string
  voornaam: string
  naam: string
  rol: string
  email: string
}

export function MedewerkerWachtwoordKiezen({ token, sportschool, voornaam, naam, rol, email }: Props) {
  const router = useRouter()
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const zwak = wachtwoordFout(wachtwoord, { email, naam })
    if (zwak) return setFout(zwak)
    if (wachtwoord !== herhaal) return setFout('De twee wachtwoorden zijn niet gelijk.')
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/inloggen/medewerker/${encodeURIComponent(token)}`, 'POST', { wachtwoord })
    if (!uit.ok) {
      setBezig(false)
      setHerhaal('')
      return setFout(uit.fout)
    }
    router.replace('/club')
  }

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <p className="club-inlog-merk">
        <span>{sportschool}</span>
        <span className="club-inlog-club">Club</span>
      </p>
      <h1 id="club-inlog-kop">Welkom, {voornaam}</h1>
      <p className="club-inlog-rol">{rol}</p>

      <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <p className="club-inlog-uitleg">
          Kies een wachtwoord van minstens {MIN_LENGTE} tekens. Daarna log je in met je e-mailadres en dit wachtwoord.
        </p>
        <label className="club-veld">
          <span>E-mailadres</span>
          <input className="club-invoer" type="email" name="email" autoComplete="username" value={email} readOnly />
        </label>
        <label className="club-veld">
          <span>Nieuw wachtwoord</span>
          <input
            className="club-invoer"
            type="password"
            autoComplete="new-password"
            maxLength={MAX_LENGTE}
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            aria-invalid={fout ? true : undefined}
            aria-describedby={fout ? 'club-inlog-fout' : 'club-inlog-tip'}
            autoFocus
          />
        </label>
        <p id="club-inlog-tip" className="club-hint">Een zin van een paar woorden is sterk en makkelijk te onthouden.</p>
        <label className="club-veld">
          <span>Herhaal wachtwoord</span>
          <input className="club-invoer" type="password" autoComplete="new-password" maxLength={MAX_LENGTE} value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
          <LockKeyhole aria-hidden size={18} />
          {bezig ? 'Even wachten...' : 'Wachtwoord kiezen'}
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
