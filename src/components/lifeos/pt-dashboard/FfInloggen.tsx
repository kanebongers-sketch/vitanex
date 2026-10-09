'use client'

import { useId, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'

// Inloggen voor de beheerder van de PT-app, in de Fit Factory-stijl. Op
// fitfactorypt.nl/login komt dit scherm i.p.v. het algemene inlogscherm (zie
// src/proxy.ts), zodat er op het Fit Factory-domein niets anders te zien is.
// PT'ers loggen niet hier in maar met hun pincode op hun eigen pagina.

type Status = 'klaar' | 'bezig' | 'fout_gegevens' | 'te_vaak' | 'fout'

/** Alleen een pad op déze site ("/kane"); anders geen terugkeer (open redirect). */
function veiligTerugPad(ruw: string | null): string {
  if (!ruw || !ruw.startsWith('/')) return '/'
  try {
    const url = new URL(ruw, window.location.origin)
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : '/'
  } catch {
    return '/'
  }
}

function statusVan(melding: string): Status {
  const m = melding.toLowerCase()
  if (m.includes('invalid') || m.includes('credentials')) return 'fout_gegevens'
  if (m.includes('too many') || m.includes('rate limit')) return 'te_vaak'
  return 'fout'
}

const MELDING: Partial<Record<Status, string>> = {
  fout_gegevens: 'E-mailadres of wachtwoord klopt niet.',
  te_vaak: 'Te veel pogingen. Wacht even en probeer het dan opnieuw.',
  fout: 'Inloggen lukte niet. Probeer het opnieuw.',
}

export function FfInloggen() {
  const router = useRouter()
  const terug = useSearchParams().get('next')
  const mailId = useId()
  const wwId = useId()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [status, setStatus] = useState<Status>('klaar')

  async function inloggen(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !wachtwoord || status === 'bezig') return
    setStatus('bezig')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: wachtwoord })
    if (error) {
      setStatus(statusVan(error.message))
      return
    }
    router.push(veiligTerugPad(terug))
  }

  const melding = MELDING[status]
  return (
    <form onSubmit={(e) => void inloggen(e)} className="ptd-form ptd-smal" aria-labelledby="ff-login-kop">
      <h2 id="ff-login-kop">Inloggen als beheerder</h2>
      <div className="ptd-veld">
        <label htmlFor={mailId}>E-mailadres</label>
        <input
          id={mailId}
          className="ptd-invoer"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="ptd-veld">
        <label htmlFor={wwId}>Wachtwoord</label>
        <input
          id={wwId}
          className="ptd-invoer"
          type="password"
          autoComplete="current-password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          required
        />
      </div>
      {melding ? (
        <p role="alert" className="ptd-hint">
          {melding}
        </p>
      ) : null}
      <div>
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={status === 'bezig'}>
          {status === 'bezig' ? 'Bezig…' : 'Inloggen'}
        </button>
      </div>
      <p className="ptd-hint">Ben je PT&apos;er? Ga naar je eigen pagina en log in met je pincode.</p>
    </form>
  )
}
