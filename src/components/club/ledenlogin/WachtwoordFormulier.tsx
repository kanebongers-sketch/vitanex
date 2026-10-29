'use client'

import { useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/app/verzoek'
import { LEDENAPP_PAD } from '@/lib/club/ledenlogin/contract'
import { MAX_LENGTE, MIN_LENGTE, normaalEmail, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { LidFout, LidVeld } from './LidVeld'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// E-mailadres bevestigen en een sterk wachtwoord kiezen (twee keer intikken).
// Twee plekken:
//   - /mijn/start/<code>: de uitnodiging van de sportschool (eerste keer of
//     wachtwoord vergeten); daarna meteen de app in.
//   - Profiel in de app: een lid dat nog met een oude pincode binnen is.
// De regels voor een sterk wachtwoord staan in kern/wachtwoord-regels.ts en
// gelden hier en op de server hetzelfde.

interface Props {
  /** Met code: de uitnodiging gebruiken. Zonder: in de app (alleen met een sessie). */
  code: string | null
  /** Het bekende e-mailadres, als voorstel. */
  standaardEmail: string | null
  /** Naam van het lid: die mag niet in het wachtwoord. */
  naam: string
  knop: string
}

export function WachtwoordFormulier({ code, standaardEmail, naam, knop }: Props) {
  const [email, setEmail] = useState(standaardEmail ?? '')
  const taal = useTaal()
  const t = LID_INLOGGEN[taal].wachtwoord
  const [wachtwoord, setWachtwoord] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)
  const [bezig, setBezig] = useState(false)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const adres = normaalEmail(email)
    if (!adres) return setFout(LID_INLOGGEN[taal].aanvragen.ongeldig)
    // Meteen hier, zonder wachten op de server: zo blijft het eerste wachtwoord staan.
    const zwak = wachtwoordFout(wachtwoord, { email: adres, naam, taal })
    if (zwak) return setFout(zwak)
    if (wachtwoord !== herhaal) {
      setHerhaal('')
      return setFout(t.ongelijk)
    }
    setBezig(true)
    setFout(null)
    const uit = code
      ? await stuur('/api/club/lid/activeren', 'POST', { code, email: adres, wachtwoord })
      : await stuur('/api/club/lid/wachtwoord', 'POST', { email: adres, wachtwoord })
    if (uit.ok && code) {
      // Vervangen, niet toevoegen: terug gaat niet naar de pagina met de code.
      window.location.replace(LEDENAPP_PAD)
      return
    }
    setBezig(false)
    setWachtwoord('')
    setHerhaal('')
    if (uit.ok) return setKlaar(true)
    setFout(uit.fout)
  }

  if (klaar) {
    return (
      <p className="club-mijn-veld-klaar" role="status">
        {t.opgeslagen(normaalEmail(email) ?? email)}
      </p>
    )
  }

  return (
    <form className="club-mijn-blok" onSubmit={(e) => void verstuur(e)} noValidate>
      <LidVeld
        id="wachtwoord-email" label={t.email} hint={t.emailHint} type="email" inputMode="email" autoComplete="username"
        autoCapitalize="none" spellCheck={false} maxLength={120} required waarde={email} onWaarde={setEmail} fout={fout !== null}
      />
      <LidVeld
        id="wachtwoord-nieuw" label={t.kies} hint={t.kiesHint(MIN_LENGTE)}
        type="password" autoComplete="new-password" maxLength={MAX_LENGTE} required autoFocus={Boolean(standaardEmail)}
        waarde={wachtwoord} onWaarde={setWachtwoord} fout={fout !== null}
      />
      <LidVeld
        id="wachtwoord-herhaal" label={t.herhaal} type="password" autoComplete="new-password" maxLength={MAX_LENGTE} required
        waarde={herhaal} onWaarde={setHerhaal} fout={fout !== null}
      />
      <LidFout fout={fout} />
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig} aria-busy={bezig}>
        {bezig ? t.bezig : knop}
      </button>
    </form>
  )
}
