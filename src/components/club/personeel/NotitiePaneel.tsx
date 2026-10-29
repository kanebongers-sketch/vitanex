'use client'

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { NotitieSoort, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { Paneel } from './Paneel'
import { API, stuur, useActie } from './vraag'
import { dagVolledig } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

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
  const taal = useTaal()
  const alles = useTekst(PERSONEEL)
  const tk = alles.notitie
  const naam = (id: string | null) => team.find((l) => l.id === id)?.naam

  async function plaats(e: FormEvent) {
    e.preventDefault()
    await voerUit(
      () => stuur(`${API}/notities`, 'POST', { vestiging, datum, soort, van: van || null, tot: tot || null, medewerkerId: soort === 'geen_afspraken' ? mw || null : null, tekst }),
      () => setTekst(''),
    )
  }

  return (
    <Paneel titel={tk.titel} boventitel={tk.boventitel} sub={dagVolledig(datum, taal)} sluitHref={sluitHref}>
      {notities.length > 0 && (
        <ul className="club-lijst">
          {notities.map((n) => (
            <li key={n.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{n.tekst}</span>
                <span className="club-rij-sub">
                  {[n.soort === 'geen_afspraken' ? tk.geenAfspraken : tk.mededeling, n.van ? (n.tot ? alles.algemeen.vanTot(n.van, n.tot) : n.van) : tk.heleDag, naam(n.medewerkerId)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={tk.verwijderen(n.tekst)} disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/notities/${n.id}`, 'DELETE'))}>
                <Trash2 aria-hidden size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="club-personeel-sectie" onSubmit={plaats}>
        <h3>{tk.nieuw}</h3>
        <div className="club-segment" role="group" aria-label={tk.soort}>
          <button type="button" aria-pressed={soort === 'mededeling'} onClick={() => setSoort('mededeling')}>{tk.mededeling}</button>
          <button type="button" aria-pressed={soort === 'geen_afspraken'} onClick={() => setSoort('geen_afspraken')}>{tk.geenAfspraken}</button>
        </div>
        <div className="club-formrij">
          <label className="club-veld">
            <span>{tk.vanOptioneel}</span>
            <input className="club-invoer" type="time" step={900} value={van} onChange={(e) => setVan(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{tk.totOptioneel}</span>
            <input className="club-invoer" type="time" step={900} value={tot} onChange={(e) => setTot(e.target.value)} />
          </label>
        </div>
        {soort === 'geen_afspraken' && (
          <label className="club-veld">
            <span>{tk.wie}</span>
            <select className="club-invoer" value={mw} onChange={(e) => setMw(e.target.value)}>
              <option value="">{tk.iedereen}</option>
              {team.map((l) => (
                <option key={l.id} value={l.id}>{l.naam}</option>
              ))}
            </select>
          </label>
        )}
        <label className="club-veld">
          <span>{tk.tekst}</span>
          <input className="club-invoer" required maxLength={200} value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={soort === 'geen_afspraken' ? tk.plaatsGeenAfspraken : tk.plaatsMededeling} />
        </label>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || tekst.trim() === ''}>
          {tk.plaatsen}
        </button>
      </form>
    </Paneel>
  )
}
