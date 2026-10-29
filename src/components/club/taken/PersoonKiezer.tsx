'use client'

import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { kortWie } from '@/lib/club/taken/typen'
import { PERSOON_VELD_ID, useAfvinken } from './AfvinkContext'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// "Afvinken als": wie er nu aan de balie staat. Kies een medewerker of vul
// initialen in (zoals op het papier). Blijft onthouden op dit apparaat.

const ANDERS = 'anders'

export function PersoonKiezer() {
  const { persoon, kiesPersoon, medewerkers, fout, meld } = useAfvinken()
  const [andersOpen, setAndersOpen] = useState(false)
  const t = useTekst(TAKEN).persoon
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
    <section className="club-taken-persoon" aria-label={t.label} data-leeg={persoon ? undefined : ''}>
      <span className="club-avatar" aria-hidden>
        {persoon ? kortWie(persoon.wie) : '?'}
      </span>
      <label className="club-taken-persoon-keuze">
        <span>{t.afvinkenAls}</span>
        <select id={PERSOON_VELD_ID} className="club-invoer" value={waarde} onChange={(e) => kies(e.target.value)}>
          <option value="">{t.kies}</option>
          {medewerkers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.naam}
            </option>
          ))}
          <option value={ANDERS}>{t.anders}</option>
        </select>
      </label>
      {toonAnders && (
        <form className="club-taken-persoon-anders" onSubmit={bevestig}>
          <label className="club-sr" htmlFor="club-taken-initialen">
            {t.naamOfInitialen}
          </label>
          <input
            id="club-taken-initialen"
            className="club-invoer"
            value={initialen}
            onChange={(e) => setInitialen(e.target.value)}
            placeholder={persoon && !persoon.medewerkerId ? persoon.wie : t.voorbeeld}
            maxLength={40}
            autoComplete="off"
          />
          <button type="submit" className="club-knop" disabled={!initialen.trim()}>
            {t.gebruik}
          </button>
        </form>
      )}
      {fout && (
        <p className="club-taken-persoon-fout" role="alert">
          {fout}
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => meld(null)} aria-label={t.sluit}>
            <X size={14} aria-hidden />
          </button>
        </p>
      )}
    </section>
  )
}
