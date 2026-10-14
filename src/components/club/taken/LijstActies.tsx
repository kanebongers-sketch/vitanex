'use client'

import { useState, type FormEvent } from 'react'
import { Copy, Plus } from 'lucide-react'
import { VESTIGINGEN, VESTIGING_LABEL, isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import { useBeheer } from './useBeheer'

// Een nieuwe lijst voor deze vestiging, en de lijsten van de ene vestiging
// kopieren naar een andere (zonder dubbelingen, zonder vinkjes).

export function NieuweLijst({ vestiging }: { vestiging: Vestiging }) {
  const { bezig, fout, stuur } = useBeheer()
  const [naam, setNaam] = useState('')

  async function maak(e: FormEvent) {
    e.preventDefault()
    const r = await stuur('/api/club/taken/lijst', 'POST', { vestiging, naam })
    if (r.ok) setNaam('')
  }

  return (
    <form className="club-kaart club-kaart--vlak club-taken-actieform" onSubmit={maak}>
      <h2>Nieuwe lijst</h2>
      <label className="club-veld">
        <span>Naam</span>
        <input className="club-invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={60} placeholder="Bijv. Maandelijks" required />
      </label>
      <button type="submit" className="club-knop" disabled={bezig || !naam.trim()}>
        <Plus size={16} aria-hidden />
        Lijst maken
      </button>
      {fout && (
        <p className="club-fout" role="alert">
          {fout}
        </p>
      )}
    </form>
  )
}

function antwoordTekst(data: unknown, naar: Vestiging): string {
  const taken = typeof data === 'object' && data !== null && 'taken' in data && typeof data.taken === 'number' ? data.taken : 0
  if (taken === 0) return `${VESTIGING_LABEL[naar]} had alles al. Er is niets bijgekomen.`
  return `${taken} ${taken === 1 ? 'taak' : 'taken'} gekopieerd naar ${VESTIGING_LABEL[naar]}.`
}

export function KopieerLijsten({ vestiging }: { vestiging: Vestiging }) {
  const { bezig, fout, stuur } = useBeheer()
  const [van, setVan] = useState<Vestiging>(vestiging)
  const [naar, setNaar] = useState<Vestiging>(VESTIGINGEN.find((v) => v !== vestiging) ?? vestiging)
  const [klaar, setKlaar] = useState<string | null>(null)

  async function kopieer(e: FormEvent) {
    e.preventDefault()
    setKlaar(null)
    const r = await stuur('/api/club/taken/kopieer', 'POST', { van, naar })
    if (r.ok) setKlaar(antwoordTekst(r.data, naar))
  }

  return (
    <form className="club-kaart club-kaart--vlak club-taken-actieform" onSubmit={kopieer}>
      <h2>Kopieer naar een vestiging</h2>
      <p className="club-hint">Lijsten met dezelfde naam worden aangevuld, bestaande taken blijven staan. Vinkjes gaan niet mee.</p>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Van</span>
          <select className="club-invoer" value={van} onChange={(e) => isVestiging(e.target.value) && setVan(e.target.value)}>
            {VESTIGINGEN.map((v) => (
              <option key={v} value={v}>
                {VESTIGING_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Naar</span>
          <select className="club-invoer" value={naar} onChange={(e) => isVestiging(e.target.value) && setNaar(e.target.value)}>
            {VESTIGINGEN.map((v) => (
              <option key={v} value={v}>
                {VESTIGING_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="club-knop" disabled={bezig || van === naar}>
        <Copy size={16} aria-hidden />
        {bezig ? 'Bezig met kopieren' : 'Kopieer lijsten'}
      </button>
      <div aria-live="polite">
        {klaar && <p className="club-melding club-melding--ok">{klaar}</p>}
        {fout && (
          <p className="club-fout" role="alert">
            {fout}
          </p>
        )}
      </div>
    </form>
  )
}
