'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'
import { foutTekst } from '@/lib/club/tweestaps/melding'

// De tweede inlogstap van het master account: de code uit de authenticator-app,
// of een herstelcode. Goed: door naar Club. Verlopen: terug naar inloggen.

interface TweestapsInlogProps {
  /** Er is een geldige wachtstap (goed wachtwoord, minder dan vijf minuten geleden). */
  geldig: boolean
}

export function TweestapsInlog({ geldig }: TweestapsInlogProps) {
  const taal = useTaal()
  const t = useTekst(TWEESTAPS)
  const [code, setCode] = useState('')
  const [herstel, setHerstel] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [verlopen, setVerlopen] = useState(!geldig)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!code.trim()) return setFout(t.fouten.leeg)
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/inloggen/tweestaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const data: unknown = await res.json().catch(() => null)
      if (res.ok) {
        window.location.assign('/club?start=1')
        return
      }
      const r = typeof data === 'object' && data !== null ? (data as { code?: unknown }) : {}
      if (r.code === 'verlopen' || r.code === 'gesloten') setVerlopen(r.code === 'verlopen')
      setFout(foutTekst(data, taal))
    } catch {
      setFout(t.fouten.verbinding)
    }
    setCode('')
    setBezig(false)
  }

  if (verlopen) {
    return (
      <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
        <h1 id="club-inlog-kop">{t.inlog.verlopenKop}</h1>
        <p className="club-inlog-rol">{t.inlog.rol}</p>
        <div className="club-inlog-wacht">
          <p>{t.inlog.verlopen}</p>
          <Link href="/inloggen" className="club-knop club-knop--primair club-knop--groot">
            {t.inlog.naarInloggen}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <h1 id="club-inlog-kop">{t.inlog.titel}</h1>
      <p className="club-inlog-rol">{t.inlog.rol}</p>
      <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
        <p className="club-inlog-uitleg">{herstel ? t.inlog.herstelUitleg : t.inlog.uitleg}</p>
        <label className="club-veld">
          <span>{herstel ? t.inlog.herstel : t.inlog.code}</span>
          <input
            key={herstel ? 'herstel' : 'app'}
            className="club-invoer club-inlog-pin"
            inputMode={herstel ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={herstel ? 20 : 8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={fout ? true : undefined}
            aria-describedby={fout ? 'club-inlog-fout' : undefined}
            autoFocus
          />
        </label>
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig} aria-busy={bezig}>
          <ShieldCheck aria-hidden size={18} />
          {bezig ? t.inlog.bezig : t.inlog.knop}
        </button>
        <button type="button" className="club-knop club-knop--klein" onClick={() => { setHerstel(!herstel); setCode(''); setFout(null) }}>
          {herstel ? t.inlog.naarApp : t.inlog.naarHerstel}
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
