'use client'

import { useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { leesKlant, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { ptApi } from '../api'
import { Veld } from '../velden'

// Vrije notities bij de klant (pt_klanten.notitie, dezelfde als op de
// klantkaart). Opslaan via de bestaande klant-API.

const MAX = 1000

interface Props {
  code: string
  klant: PtKlant
  onOpgeslagen: (k: PtKlant) => void
  /** Meekijken (eigenaar): alleen lezen, geen opslaan. */
  alleenLezen?: boolean
}

export function NotitiesPaneel({ code, klant, onOpgeslagen, alleenLezen = false }: Props) {
  const [tekst, setTekst] = useState(klant.notitie ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const gewijzigd = tekst.trim() !== (klant.notitie ?? '')

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `klanten/${klant.id}`, 'PUT', { ...klant, notitie: tekst }, leesKlant)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setTekst(uit.waarde.notitie ?? '')
    setOpgeslagen(true)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ptd-sectie" onSubmit={(e) => void opslaan(e)} aria-labelledby="ffdos-notities-kop">
      <div className="ptd-sectiekop">
        <h2 id="ffdos-notities-kop">Notities</h2>
        <span>{tekst.length}/{MAX}</span>
      </div>
      <Veld label="Notities over deze klant" id="ffdos-notitie" hint="Ook zichtbaar op de klantkaart. Gezondheidsinformatie hoort in de intake, niet hier.">
        <textarea
          id="ffdos-notitie"
          className="ptd-invoer"
          rows={8}
          maxLength={MAX}
          value={tekst}
          readOnly={alleenLezen}
          onChange={(e) => {
            setTekst(e.target.value)
            setOpgeslagen(false)
          }}
        />
      </Veld>
      {fout ? <Foutmelding bericht={fout} /> : null}
      {alleenLezen ? null : (
        <div className="ptd-acties">
          <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || !gewijzigd}>
            {bezig ? 'Opslaan…' : 'Notities opslaan'}
          </button>
          <span className="ptd-hint" role="status">{opgeslagen && !gewijzigd ? 'Opgeslagen' : ''}</span>
        </div>
      )}
    </form>
  )
}
