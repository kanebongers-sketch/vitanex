'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LENGTE, MIN_LENGTE, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'

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
  const taal = useTaal()
  const tekst = useTekst(CLUB_INLOGGEN)
  const t = tekst.wachtwoord

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const zwak = wachtwoordFout(wachtwoord, { email, naam, taal })
    if (zwak) return setFout(zwak)
    if (wachtwoord !== herhaal) return setFout(t.nietGelijk)
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/inloggen/medewerker/${encodeURIComponent(token)}`, 'POST', { wachtwoord })
    if (!uit.ok) {
      setBezig(false)
      setHerhaal('')
      return setFout(uit.fout)
    }
    router.replace('/club?start=1')
  }

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <p className="club-inlog-merk">
        <span>{sportschool}</span>
        <span className="club-inlog-club">Club</span>
      </p>
      <h1 id="club-inlog-kop">{tekst.welkom(voornaam)}</h1>
      <p className="club-inlog-rol">{rol}</p>

      <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <p className="club-inlog-uitleg">
          {t.kiesMin(MIN_LENGTE)}
        </p>
        <label className="club-veld">
          <span>{t.email}</span>
          <input className="club-invoer" type="email" name="email" autoComplete="username" value={email} readOnly />
        </label>
        <label className="club-veld">
          <span>{t.nieuw}</span>
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
        <p id="club-inlog-tip" className="club-hint">{t.tip}</p>
        <label className="club-veld">
          <span>{t.herhaal}</span>
          <input className="club-invoer" type="password" autoComplete="new-password" maxLength={MAX_LENGTE} value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
          <LockKeyhole aria-hidden size={18} />
          {bezig ? t.bezig : t.kiezen}
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
