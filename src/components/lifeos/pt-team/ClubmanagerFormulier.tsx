'use client'

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { CLUBS, CLUB_LABEL, isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// Een clubmanager toevoegen: naam en club. De manager krijgt een eigen link
// (fitfactorypt.nl/<naam>) en kiest daar zelf een pincode; jij keurt goed met
// de controlecode, net als bij een PT'er.

export function ClubmanagerFormulier({ onToegevoegd }: { onToegevoegd: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [club, setClub] = useState<Club | ''>('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (naam.trim().length < 2) return setFout('Vul de naam van de clubmanager in.')
    if (!club) return setFout('Kies de club.')
    setBezig(true)
    setFout(null)
    const uit = await haalJson('/api/lifeos/pt-app/clubmanagers', leesNiets, { method: 'POST', body: JSON.stringify({ naam, club }) })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNaam('')
    setClub('')
    setOpen(false)
    await onToegevoegd()
  }

  if (!open) {
    return (
      <div className="ptd-acties">
        <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => setOpen(true)}>
          <Plus size={14} aria-hidden /> Clubmanager toevoegen
        </button>
      </div>
    )
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="cm-kop">
      <h3 id="cm-kop">Nieuwe clubmanager</h3>
      <div className="ptd-raster">
        <div className="ptd-veld">
          <label htmlFor="cm-naam">Naam *</label>
          <input id="cm-naam" className="ptd-invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={60} autoComplete="off" required />
        </div>
        <div className="ptd-veld">
          <label htmlFor="cm-club">Club *</label>
          <select id="cm-club" className="ptd-invoer" value={club} onChange={(e) => setClub(isClub(e.target.value) ? e.target.value : '')} required>
            <option value="" disabled>Kies…</option>
            {CLUBS.map((c) => <option key={c} value={c}>{CLUB_LABEL[c]}</option>)}
          </select>
        </div>
      </div>
      <p className="ptd-hint">Ziet van zijn club: leads, klanten met abonnement en prestaties per PT&apos;er. Geen bedragen, dossiers of coachgesprekken; alleen lezen.</p>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Toevoegen'}</button>
        <button type="button" className="ptd-knop" onClick={() => setOpen(false)} disabled={bezig}>Annuleren</button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
