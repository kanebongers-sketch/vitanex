'use client'

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { CLUBS, CLUB_LABEL, type Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// Een clubmanager toevoegen: naam en één of meer clubs (bv. Someren én
// Eindhoven Boschdijk: één inlog voor beide). De manager krijgt een eigen link
// (fitfactorypt.nl/<naam>) en kiest daar zelf een pincode; jij keurt goed met
// de controlecode, net als bij een PT'er.

export function ClubmanagerFormulier({ onToegevoegd }: { onToegevoegd: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [clubs, setClubs] = useState<readonly Club[]>([])
  const wissel = (c: Club) => setClubs((nu) => (nu.includes(c) ? nu.filter((x) => x !== c) : CLUBS.filter((x) => x === c || nu.includes(x))))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (naam.trim().length < 2) return setFout('Vul de naam van de clubmanager in.')
    if (clubs.length === 0) return setFout('Kies minstens één club.')
    setBezig(true)
    setFout(null)
    const uit = await haalJson('/api/lifeos/pt-app/clubmanagers', leesNiets, { method: 'POST', body: JSON.stringify({ naam, clubs }) })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNaam('')
    setClubs([])
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
      </div>
      <fieldset className="ptd-veld">
        <legend>Club(s) *</legend>
        <div className="ptd-filters">
          {CLUBS.map((c) => (
            <button key={c} type="button" className="ptd-chip" aria-pressed={clubs.includes(c)} onClick={() => wissel(c)}>
              {CLUB_LABEL[c]}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="ptd-hint">Ziet van zijn club(s): leads, klanten met abonnement en prestaties per PT&apos;er. Geen bedragen, dossiers of coachgesprekken; alleen lezen.</p>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Toevoegen'}</button>
        <button type="button" className="ptd-knop" onClick={() => setOpen(false)} disabled={bezig}>Annuleren</button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
