'use client'

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { Sjabloon } from '@/lib/club/personeel/typen'
import { Paneel } from './Paneel'
import { API, getalUit, stuur, useActie } from './vraag'
import { dagMaandLang } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

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
  const tk = useTekst(PERSONEEL).patroon
  const id = `club-personeel-patroon-${s.id}`
  return (
    <li className="club-personeel-patroon">
      <div className="club-rij-hoofd">
        <span className="club-rij-titel">{s.naam}</span>
        <span className="club-rij-sub">{tk.perWeek(s.diensten.length)}</span>
      </div>
      <div className="club-personeel-patroonacties">
        <label className="club-veld" htmlFor={`${id}-weken`}>
          <span>{tk.weken}</span>
          <input id={`${id}-weken`} className="club-invoer" type="number" min={1} max={12} value={weken} onChange={(e) => setWeken(e.target.value)} />
        </label>
        <label className="club-personeel-vink">
          <input type="checkbox" checked={vervang} onChange={(e) => setVervang(e.target.checked)} /> {tk.vervangen}
        </label>
        <button
          type="button"
          className="club-knop club-knop--primair club-knop--klein"
          disabled={bezig}
          onClick={() =>
            voerUit(
              () => stuur(`${API}/patronen/${s.id}/toepassen`, 'POST', { vestiging, maandag, weken: Number(weken), vervang }),
              (data) => setKlaar(tk.gezet(getalUit(data, 'toegevoegd') ?? 0)),
            )
          }
        >
          {tk.toepassen}
        </button>
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={tk.verwijderen(s.naam)} disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/patronen/${s.id}`, 'DELETE'))}>
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
  const taal = useTaal()
  const tk = useTekst(PERSONEEL).patroon

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    await voerUit(() => stuur(`${API}/patronen`, 'POST', { vestiging, maandag, naam }), () => setNaam(''))
  }

  return (
    <Paneel titel={tk.titel} boventitel={tk.boventitel} sub={tk.vanaf(dagMaandLang(maandag, taal))} sluitHref={sluitHref}>
      <form className="club-personeel-sectie" onSubmit={bewaar}>
        <h3>{tk.bewaren}</h3>
        <label className="club-veld">
          <span>{tk.naam}</span>
          <input className="club-invoer" required maxLength={60} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder={tk.naamPlaats} />
        </label>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop" disabled={bezig || naam.trim() === ''}>
          {tk.opslaanAls}
        </button>
      </form>
      <section className="club-personeel-sectie">
        <h3>{tk.patronen}</h3>
        {sjablonen.length === 0 ? (
          <p className="club-leeg">{tk.geen}</p>
        ) : (
          <ul className="club-lijst">
            {sjablonen.map((s) => (
              <PatroonRij key={s.id} s={s} vestiging={vestiging} maandag={maandag} />
            ))}
          </ul>
        )}
        <p className="club-hint">{tk.uitleg}</p>
      </section>
    </Paneel>
  )
}
