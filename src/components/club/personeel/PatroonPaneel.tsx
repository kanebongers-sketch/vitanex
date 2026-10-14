'use client'

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { Sjabloon } from '@/lib/club/personeel/typen'
import { Paneel } from './Paneel'
import { API, getalUit, stuur, useActie } from './vraag'
import { dagMaandLang } from './weergave'

// Vaste patronen: deze week opslaan als patroon en een patroon vooruit zetten
// voor een aantal weken (vanaf de week die nu open staat).

interface Props {
  vestiging: Vestiging
  maandag: string
  sjablonen: Sjabloon[]
  sluitHref: string
}

function PatroonRij({ s, vestiging, maandag }: { s: Sjabloon; vestiging: Vestiging; maandag: string }) {
  const [weken, setWeken] = useState('4')
  const [vervang, setVervang] = useState(false)
  const [klaar, setKlaar] = useState<string | null>(null)
  const { bezig, fout, voerUit } = useActie()
  const id = `club-personeel-patroon-${s.id}`
  return (
    <li className="club-personeel-patroon">
      <div className="club-rij-hoofd">
        <span className="club-rij-titel">{s.naam}</span>
        <span className="club-rij-sub">{s.diensten.length} diensten per week</span>
      </div>
      <div className="club-personeel-patroonacties">
        <label className="club-veld" htmlFor={`${id}-weken`}>
          <span>Weken</span>
          <input id={`${id}-weken`} className="club-invoer" type="number" min={1} max={12} value={weken} onChange={(e) => setWeken(e.target.value)} />
        </label>
        <label className="club-personeel-vink">
          <input type="checkbox" checked={vervang} onChange={(e) => setVervang(e.target.checked)} /> Vervangen
        </label>
        <button
          type="button"
          className="club-knop club-knop--primair club-knop--klein"
          disabled={bezig}
          onClick={() =>
            voerUit(
              () => stuur(`${API}/patronen/${s.id}/toepassen`, 'POST', { vestiging, maandag, weken: Number(weken), vervang }),
              (data) => setKlaar(`${getalUit(data, 'toegevoegd') ?? 0} diensten gezet.`),
            )
          }
        >
          Toepassen
        </button>
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`Patroon ${s.naam} verwijderen`} disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/patronen/${s.id}`, 'DELETE'))}>
          <Trash2 aria-hidden size={15} />
        </button>
      </div>
      {klaar && <p className="club-hint" role="status">{klaar}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </li>
  )
}

export function PatroonPaneel({ vestiging, maandag, sjablonen, sluitHref }: Props) {
  const [naam, setNaam] = useState('')
  const { bezig, fout, voerUit } = useActie()

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    await voerUit(() => stuur(`${API}/patronen`, 'POST', { vestiging, maandag, naam }), () => setNaam(''))
  }

  return (
    <Paneel titel="Vast patroon" boventitel="Snel plannen" sub={`Toepassen vanaf de week van ${dagMaandLang(maandag)}`} sluitHref={sluitHref}>
      <form className="club-personeel-sectie" onSubmit={bewaar}>
        <h3>Deze week bewaren</h3>
        <label className="club-veld">
          <span>Naam van het patroon</span>
          <input className="club-invoer" required maxLength={60} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld: Winterrooster" />
        </label>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop" disabled={bezig || naam.trim() === ''}>
          Opslaan als patroon
        </button>
      </form>
      <section className="club-personeel-sectie">
        <h3>Patronen</h3>
        {sjablonen.length === 0 ? (
          <p className="club-leeg">Nog geen patronen. Plan een goede week en bewaar die hierboven.</p>
        ) : (
          <ul className="club-lijst">
            {sjablonen.map((s) => (
              <PatroonRij key={s.id} s={s} vestiging={vestiging} maandag={maandag} />
            ))}
          </ul>
        )}
        <p className="club-hint">Toepassen vult aan wat er nog niet staat. Met vervangen gaan eerst de geplande diensten van die weken eruit; diensten met uren blijven altijd staan.</p>
      </section>
    </Paneel>
  )
}
