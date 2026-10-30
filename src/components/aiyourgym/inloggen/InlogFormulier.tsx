'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { MAX_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { leesEmail } from '@/lib/aiyourgym/aanmelding'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { INLOGGEN } from '@/lib/aiyourgym/taal/woorden/website/inloggen'
import { kiesMeldingen } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// Inloggen op aiyourgym.com met e-mailadres en wachtwoord. Goed: door naar Club
// (de startwizard als de sportschool nog niet is ingericht). Lege of ongeldige
// velden krijgen een eigen melding bij het veld; dan gaat er niets naar de server.

interface VeldFouten {
  email?: string
  wachtwoord?: string
}

function controleer(email: string, wachtwoord: string, t: (typeof INLOGGEN)['nl']): VeldFouten {
  const fouten: VeldFouten = {}
  if (!email.trim()) fouten.email = t.emailLeeg
  else if (!leesEmail(email)) fouten.email = t.emailOngeldig
  if (!wachtwoord) fouten.wachtwoord = t.wachtwoordLeeg
  return fouten
}

export function InlogFormulier() {
  const taal = useTaal()
  const t = INLOGGEN[taal]
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [veldFouten, setVeldFouten] = useState<VeldFouten>({})

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const fouten = controleer(email, wachtwoord, t)
    setVeldFouten(fouten)
    if (fouten.email || fouten.wachtwoord) {
      setFout(null)
      document.getElementById(fouten.email ? 'inlog-email' : 'inlog-wachtwoord')?.focus()
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/inloggen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, wachtwoord }) })
      if (res.ok) {
        window.location.assign('/club?start=1')
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
        value={email} onChange={(e) => setEmail(e.target.value)} fout={veldFouten.email} required />
      <Veld id="inlog-wachtwoord" label={t.wachtwoord} type="password" autoComplete="current-password" maxLength={MAX_LENGTE}
        value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} fout={veldFouten.wachtwoord} required />
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
