'use client'

import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'
import { HONINGPOT_VELD } from '@/lib/club/app-uitnodigen/velden'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// Zelf een link aanvragen: e-mailadres invullen. Het antwoord is altijd
// hetzelfde (of het adres nu bekend is of niet). Het verborgen veld is een
// honingpot: alleen robots vullen het in.

interface Props {
  /** De sportschool (slug of id) voor fitfactorypt.nl; op een subdomein telt het adres. */
  sportschool: string
}

export function AanvraagFormulier({ sportschool }: Props) {
  const [email, setEmail] = useState('')
  const taal = useTaal()
  const t = LID_INLOGGEN[taal].aanvragen
  const bezigTekst = LID_INLOGGEN[taal].inloggen.bezig
  const [honing, setHoning] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFout(t.ongeldig)
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/lid/aanvragen', 'POST', { email: email.trim(), s: sportschool, [HONINGPOT_VELD]: honing })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setKlaar(typeof uit.data.bericht === 'string' ? uit.data.bericht : t.bekend)
  }

  if (klaar) {
    return (
      <div className="club-mijn-aanvraag-klaar" role="status">
        <MailCheck size={22} aria-hidden />
        <p>{klaar} {t.spam}</p>
      </div>
    )
  }

  return (
    <form className="club-mijn-blok" onSubmit={(e) => void verstuur(e)} noValidate>
      <div className="club-mijn-email">
        <label htmlFor="aanvraag-email">{t.email}</label>
        <input
          id="aanvraag-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.voorbeeld}
        />
      </div>
      <div className="club-mijn-honing" aria-hidden="true">
        <label htmlFor="aanvraag-website">Website</label>
        <input id="aanvraag-website" type="text" tabIndex={-1} autoComplete="off" value={honing} onChange={(e) => setHoning(e.target.value)} />
      </div>
      <div aria-live="assertive">{fout ? <p className="club-mijn-inlog-fout" role="alert">{fout}</p> : null}</div>
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig}>
        {bezig ? bezigTekst : t.knop}
      </button>
    </form>
  )
}
