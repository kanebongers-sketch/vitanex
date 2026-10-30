'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_LENGTE, MIN_LENGTE, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'

// Een keer een sterk wachtwoord kiezen met een uitnodigings- of startlink (twee
// keer intikken). Na opslaan is de persoon meteen ingelogd en gaat hij naar Club;
// voortaan inloggen op /inloggen met e-mailadres en wachtwoord.

interface WachtwoordKiezenProps {
  /** De route die het wachtwoord opslaat en de sessie zet. */
  api: string
  /** Logo of merk boven de kaart. */
  merk: ReactNode
  rol: string
  /** Voor de regel "niet je naam of e-mailadres" al in de browser. */
  email?: string | null
  naam?: string | null
}

export function WachtwoordKiezen({ api, merk, rol, email, naam }: WachtwoordKiezenProps) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const taal = useTaal()
  const t = useTekst(CLUB_INLOGGEN).wachtwoord

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const probleem = wachtwoordFout(wachtwoord, { email, naam, taal })
    if (probleem) return setFout(probleem)
    if (wachtwoord !== herhaal) return setFout(t.nietGelijk)
    setBezig(true)
    setFout(null)
    const uit = await stuur(api, 'POST', { wachtwoord })
    if (!uit.ok) {
      setBezig(false)
      return setFout(uit.fout)
    }
    window.location.assign('/club?start=1')
  }

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <p className="club-inlog-merk">{merk}</p>
      <h1 id="club-inlog-kop">{t.kop}</h1>
      <p className="club-inlog-rol">{rol}</p>
      <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <p className="club-inlog-uitleg">
          {t.sterkst(MIN_LENGTE)} {email ? t.daarnaMet(email) : t.daarna} {t.eenKeer}
        </p>
        <label className="club-veld">
          <span>{t.nieuw}</span>
          <input
            className="club-invoer"
            type="password"
            autoComplete="new-password"
            minLength={MIN_LENGTE}
            maxLength={MAX_LENGTE}
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            aria-invalid={fout ? true : undefined}
            aria-describedby={fout ? 'club-inlog-fout' : undefined}
            autoFocus
          />
        </label>
        <label className="club-veld">
          <span>{t.herhaal}</span>
          <input className="club-invoer" type="password" autoComplete="new-password" maxLength={MAX_LENGTE} value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
          <LockKeyhole aria-hidden size={18} />
          {bezig ? t.bezig : t.opslaanStart}
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
