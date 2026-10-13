'use client'

import { useState, type FormEvent } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// E-mailadres van een clubmanager, voor de wekelijkse clubmail. Leeg = geen mail.

export function ClubmanagerEmail({ persoonId, naam, begin, onOpgeslagen }: { persoonId: string; naam: string; begin: string | null; onOpgeslagen: () => Promise<void> }) {
  const [email, setEmail] = useState(begin ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = email.trim() !== (begin ?? '')

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig || !gewijzigd) return
    setBezig(true)
    setFout(null)
    const uit = await haalJson('/api/lifeos/pt-app/clubmanagers', leesNiets, { method: 'PATCH', body: JSON.stringify({ persoonId, email }) })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    await onOpgeslagen()
  }

  return (
    <form className="kl-email" onSubmit={(e) => void opslaan(e)}>
      <label className="sr-only" htmlFor={`cm-email-${persoonId}`}>E-mailadres van {naam} voor de clubmail</label>
      <input
        id={`cm-email-${persoonId}`}
        className="ptd-invoer"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="e-mail voor de wekelijkse clubmail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={254}
      />
      <button type="submit" className="ptd-knop ptd-knop--klein" disabled={bezig || !gewijzigd}>{bezig ? 'Opslaan…' : 'Opslaan'}</button>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
