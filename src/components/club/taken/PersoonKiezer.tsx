'use client'

import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { kortWie } from '@/lib/club/taken/typen'
import { PERSOON_VELD_ID, useAfvinken } from './AfvinkContext'

// "Afvinken als": wie er nu aan de balie staat. Kies een medewerker of vul
// initialen in (zoals op het papier). Blijft onthouden op dit apparaat.

const ANDERS = 'anders'

export function PersoonKiezer() {
  const { persoon, kiesPersoon, medewerkers, fout, meld } = useAfvinken()
  const [andersOpen, setAndersOpen] = useState(false)
  const [initialen, setInitialen] = useState('')
  const toonAnders = andersOpen || (persoon !== null && persoon.medewerkerId === null)
  const waarde = persoon?.medewerkerId ?? (toonAnders ? ANDERS : '')

  function kies(id: string) {
    meld(null)
    if (id === ANDERS) {
      setAndersOpen(true)
      return
    }
    setAndersOpen(false)
    const m = medewerkers.find((x) => x.id === id)
    kiesPersoon(m ? { medewerkerId: m.id, wie: m.naam } : null)
  }

  function bevestig(e: FormEvent) {
    e.preventDefault()
    const wie = initialen.replace(/\s+/g, ' ').trim().slice(0, 40)
    if (!wie) return
    meld(null)
    kiesPersoon({ medewerkerId: null, wie: wie.length <= 4 ? wie.toUpperCase() : wie })
    setInitialen('')
  }

  return (
    <section className="club-taken-persoon" aria-label="Wie vinkt af" data-leeg={persoon ? undefined : ''}>
      <span className="club-avatar" aria-hidden>
        {persoon ? kortWie(persoon.wie) : '?'}
      </span>
      <label className="club-taken-persoon-keuze">
        <span>Afvinken als</span>
        <select id={PERSOON_VELD_ID} className="club-invoer" value={waarde} onChange={(e) => kies(e.target.value)}>
          <option value="">Kies wie je bent</option>
          {medewerkers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.naam}
            </option>
          ))}
          <option value={ANDERS}>Iemand anders (initialen)</option>
        </select>
      </label>
      {toonAnders && (
        <form className="club-taken-persoon-anders" onSubmit={bevestig}>
          <label className="club-sr" htmlFor="club-taken-initialen">
            Naam of initialen
          </label>
          <input
            id="club-taken-initialen"
            className="club-invoer"
            value={initialen}
            onChange={(e) => setInitialen(e.target.value)}
            placeholder={persoon && !persoon.medewerkerId ? persoon.wie : 'Bijv. LM'}
            maxLength={40}
            autoComplete="off"
          />
          <button type="submit" className="club-knop" disabled={!initialen.trim()}>
            Gebruik
          </button>
        </form>
      )}
      {fout && (
        <p className="club-taken-persoon-fout" role="alert">
          {fout}
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => meld(null)} aria-label="Melding sluiten">
            <X size={14} aria-hidden />
          </button>
        </p>
      )}
    </section>
  )
}
