'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { MAX_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { INLOGGEN } from '@/lib/aiyourgym/taal/woorden/website/inloggen'
import { kiesMeldingen } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// Inloggen op aiyourgym.com met e-mailadres en wachtwoord. Goed: door naar Club
// (de startwizard als de sportschool nog niet is ingericht).

export function InlogFormulier() {
  const taal = useTaal()
  const t = INLOGGEN[taal]
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!email.trim() || !wachtwoord) return setFout(t.leeg)
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/inloggen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, wachtwoord }) })
      if (res.ok) {
        window.location.assign('/club')
        return
      }
      // De API van Club geeft Nederlands; kiesMeldingen vertaalt het voor de Engelse pagina.
      setFout(kiesMeldingen(await res.json().catch(() => null), taal).fout ?? t.mislukt)
    } catch {
      setFout(t.geenVerbinding)
    }
    setWachtwoord('')
    setBezig(false)
  }

  return (
    <form className="aan-inlog ayg-podium" onSubmit={(e) => void verstuur(e)} noValidate aria-describedby={fout ? 'inlog-fout' : undefined}>
      <Veld id="inlog-email" label={t.email} type="email" autoComplete="username" inputMode="email" maxLength={120}
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Veld id="inlog-wachtwoord" label={t.wachtwoord} type="password" autoComplete="current-password" maxLength={MAX_LENGTE}
        value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} required />
      {fout && (
        <p id="inlog-fout" className="aan-melding" role="alert">
          {fout}
        </p>
      )}
      <button type="submit" className="ayg-knop ayg-knop--accent" disabled={bezig} aria-busy={bezig}>
        {bezig ? (
          <>
            {t.knop} <LoaderCircle size={18} aria-hidden="true" className="aan-draai" />
          </>
        ) : (
          <>
            {t.knop} <ArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
