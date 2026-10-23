'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { MAX_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import '@/components/aiyourgym/aanmelden/aanmelden.css'

// Inloggen op aiyourgym.com met e-mailadres en wachtwoord. Goed: door naar Club
// (de startwizard als de sportschool nog niet is ingericht).

export function InlogFormulier() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!email.trim() || !wachtwoord) return setFout('Vul je e-mailadres en wachtwoord in.')
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/inloggen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, wachtwoord }) })
      if (res.ok) {
        window.location.assign('/club')
        return
      }
      const json = (await res.json().catch(() => null)) as { fout?: unknown } | null
      setFout(typeof json?.fout === 'string' ? json.fout : 'Inloggen lukte niet. Probeer het opnieuw.')
    } catch {
      setFout('Geen verbinding. Controleer je internet en probeer het opnieuw.')
    }
    setWachtwoord('')
    setBezig(false)
  }

  return (
    <form className="aan-inlog ayg-podium" onSubmit={(e) => void verstuur(e)} noValidate aria-describedby={fout ? 'inlog-fout' : undefined}>
      <Veld id="inlog-email" label="E-mailadres" type="email" autoComplete="username" inputMode="email" maxLength={120}
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Veld id="inlog-wachtwoord" label="Wachtwoord" type="password" autoComplete="current-password" maxLength={MAX_LENGTE}
        value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} required />
      {fout && (
        <p id="inlog-fout" className="aan-melding" role="alert">
          {fout}
        </p>
      )}
      <button type="submit" className="ayg-knop ayg-knop--accent" disabled={bezig} aria-busy={bezig}>
        {bezig ? (
          <>
            Inloggen <LoaderCircle size={18} aria-hidden="true" className="aan-draai" />
          </>
        ) : (
          <>
            Inloggen <ArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
