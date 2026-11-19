'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, ChevronDown, LoaderCircle } from 'lucide-react'
import { leesEmail } from '@/lib/aiyourgym/aanmelding'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { INLOGGEN } from '@/lib/aiyourgym/taal/woorden/website/inloggen'

// Wachtwoord vergeten op /inloggen: een uitklapper met een e-mailveld. De
// server antwoordt altijd hetzelfde, dus de bevestiging zegt nooit of het adres
// bekend is. De uitkomst staat in een vaste regel met aria-live, zodat een
// schermlezer hem voorleest zonder dat de focus verspringt.

const API = '/api/club/inloggen/vergeten'
const TE_VAAK = 429

type Uitkomst = { soort: 'verstuurd' | 'fout'; tekst: string } | null

export function WachtwoordVergetenFormulier() {
  const t = INLOGGEN[useTaal()]
  const [email, setEmail] = useState('')
  const [veldFout, setVeldFout] = useState<string | undefined>(undefined)
  const [bezig, setBezig] = useState(false)
  const [uitkomst, setUitkomst] = useState<Uitkomst>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const fout = !email.trim() ? t.emailLeeg : !leesEmail(email) ? t.emailOngeldig : undefined
    setVeldFout(fout)
    setUitkomst(null)
    if (fout) {
      document.getElementById('vergeten-email')?.focus()
      return
    }
    setBezig(true)
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (res.ok) setUitkomst({ soort: 'verstuurd', tekst: t.vergetenVerstuurd })
      else setUitkomst({ soort: 'fout', tekst: res.status === TE_VAAK ? t.vergetenTeVaak : t.vergetenMislukt })
    } catch {
      setUitkomst({ soort: 'fout', tekst: t.geenVerbinding })
    }
    setBezig(false)
  }

  return (
    <details className="aan-vergeten">
      <summary>
        {t.vergetenOpen}
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <form className="aan-vergeten-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <Veld id="vergeten-email" label={t.email} type="email" autoComplete="email" inputMode="email" maxLength={120}
          value={email} onChange={(e) => setEmail(e.target.value)} fout={veldFout} hint={t.vergetenUitleg} required />
        <button type="submit" className="ayg-knop ayg-knop--rand" disabled={bezig} aria-busy={bezig}>
          {t.vergetenKnop} {bezig ? <LoaderCircle size={18} aria-hidden="true" className="aan-draai" /> : <ArrowRight size={18} aria-hidden="true" />}
        </button>
        <div aria-live="polite">
          {uitkomst && <p className={uitkomst.soort === 'verstuurd' ? 'aan-melding aan-melding--rustig' : 'aan-melding'}>{uitkomst.tekst}</p>}
        </div>
      </form>
    </details>
  )
}
