'use client'

import { useState, type FormEvent } from 'react'
import { KLEUREN, type Kleur, type PersoneelLid } from '@/lib/club/personeel/typen'
import { API, stuur, useActie } from './vraag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// Contracturen per week en de vaste roosterkleur van een medewerker.

export function MedewerkerInstellingen({ lid }: { lid: PersoneelLid }) {
  const [uren, setUren] = useState(lid.contracturen === null ? '' : String(lid.contracturen))
  const [kleur, setKleur] = useState<Kleur>(lid.kleur)
  const [klaar, setKlaar] = useState(false)
  const { bezig, fout, voerUit } = useActie()
  const alles = useTekst(PERSONEEL)
  const tk = alles.instellingen

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setKlaar(false)
    const contracturen = uren.trim() === '' ? null : Number(uren.replace(',', '.'))
    await voerUit(() => stuur(`${API}/medewerkers/${lid.id}`, 'PATCH', { contracturen, kleur }), () => setKlaar(true))
  }

  return (
    <form className="club-personeel-instellingen" onSubmit={bewaar}>
      <label className="club-veld">
        <span>{tk.contracturen}</span>
        <input className="club-invoer" inputMode="decimal" value={uren} onChange={(e) => setUren(e.target.value)} placeholder={tk.contracturenPlaats} />
      </label>
      <fieldset className="club-personeel-kleuren">
        <legend className="club-label">{tk.kleur}</legend>
        {KLEUREN.map((k) => (
          <label key={k} className="club-personeel-kleurkeuze" data-kleur={k}>
            <input type="radio" name={`kleur-${lid.id}`} value={k} checked={kleur === k} onChange={() => setKleur(k)} />
            <span className="club-personeel-stip" aria-hidden />
            <span>{alles.labels.kleur[k]}</span>
          </label>
        ))}
      </fieldset>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {klaar && <p className="club-hint" role="status">{alles.algemeen.opgeslagen}</p>}
      <button type="submit" className="club-knop" disabled={bezig}>
        {alles.algemeen.opslaan}
      </button>
    </form>
  )
}
