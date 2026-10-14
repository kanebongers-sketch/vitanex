'use client'

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { NotitieSoort, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { Paneel } from './Paneel'
import { API, stuur, useActie } from './vraag'
import { dagVolledig } from './weergave'

// Mededelingen van een dag ("Muziek zachter voor Body balance") en blokken
// "geen afspraken" (iemand is er wel, maar plant dan niets in).

interface Props {
  vestiging: Vestiging
  datum: string
  notities: RoosterNotitie[]
  team: PersoneelLid[]
  sluitHref: string
}

export function NotitiePaneel({ vestiging, datum, notities, team, sluitHref }: Props) {
  const [soort, setSoort] = useState<NotitieSoort>('mededeling')
  const [van, setVan] = useState('')
  const [tot, setTot] = useState('')
  const [mw, setMw] = useState('')
  const [tekst, setTekst] = useState('')
  const { bezig, fout, voerUit } = useActie()
  const naam = (id: string | null) => team.find((l) => l.id === id)?.naam

  async function plaats(e: FormEvent) {
    e.preventDefault()
    await voerUit(
      () => stuur(`${API}/notities`, 'POST', { vestiging, datum, soort, van: van || null, tot: tot || null, medewerkerId: soort === 'geen_afspraken' ? mw || null : null, tekst }),
      () => setTekst(''),
    )
  }

  return (
    <Paneel titel="Mededelingen" boventitel="Rooster" sub={dagVolledig(datum)} sluitHref={sluitHref}>
      {notities.length > 0 && (
        <ul className="club-lijst">
          {notities.map((n) => (
            <li key={n.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{n.tekst}</span>
                <span className="club-rij-sub">
                  {[n.soort === 'geen_afspraken' ? 'Geen afspraken' : 'Mededeling', n.van ? `${n.van}${n.tot ? ` tot ${n.tot}` : ''}` : 'hele dag', naam(n.medewerkerId)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`Mededeling "${n.tekst}" verwijderen`} disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/notities/${n.id}`, 'DELETE'))}>
                <Trash2 aria-hidden size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="club-personeel-sectie" onSubmit={plaats}>
        <h3>Nieuw</h3>
        <div className="club-segment" role="group" aria-label="Soort">
          <button type="button" aria-pressed={soort === 'mededeling'} onClick={() => setSoort('mededeling')}>Mededeling</button>
          <button type="button" aria-pressed={soort === 'geen_afspraken'} onClick={() => setSoort('geen_afspraken')}>Geen afspraken</button>
        </div>
        <div className="club-formrij">
          <label className="club-veld">
            <span>Van (optioneel)</span>
            <input className="club-invoer" type="time" step={900} value={van} onChange={(e) => setVan(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>Tot (optioneel)</span>
            <input className="club-invoer" type="time" step={900} value={tot} onChange={(e) => setTot(e.target.value)} />
          </label>
        </div>
        {soort === 'geen_afspraken' && (
          <label className="club-veld">
            <span>Wie</span>
            <select className="club-invoer" value={mw} onChange={(e) => setMw(e.target.value)}>
              <option value="">Iedereen</option>
              {team.map((l) => (
                <option key={l.id} value={l.id}>{l.naam}</option>
              ))}
            </select>
          </label>
        )}
        <label className="club-veld">
          <span>Tekst</span>
          <input className="club-invoer" required maxLength={200} value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={soort === 'geen_afspraken' ? 'Geen afspraken HIIT' : 'Muziek zachter voor Body balance'} />
        </label>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || tekst.trim() === ''}>
          Plaatsen
        </button>
      </form>
    </Paneel>
  )
}
