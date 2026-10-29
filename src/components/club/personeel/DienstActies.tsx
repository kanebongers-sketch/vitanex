'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Thermometer, Trash2 } from 'lucide-react'
import type { Dienst, PersoneelLid } from '@/lib/club/personeel/typen'
import { API, stuur, useActie } from './vraag'
import { dagMaand, weekdagKort } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// Ziek melden (dienst wordt open), ruilen met een andere dienst en verwijderen.
// Verwijderen vraagt een tweede klik; alles werkt alleen zolang er nog geen
// uren op de dienst staan.

interface Props {
  dienst: Dienst
  alle: Dienst[]
  team: PersoneelLid[]
  sluitHref: string
}

export function DienstActies({ dienst, alle, team, sluitHref }: Props) {
  const router = useRouter()
  const { bezig, fout, voerUit } = useActie()
  const [ruilMet, setRuilMet] = useState('')
  const [zeker, setZeker] = useState(false)
  const taal = useTaal()
  const alles = useTekst(PERSONEEL)
  const tk = alles.acties
  const naam = (id: string | null) => team.find((l) => l.id === id)?.naam ?? alles.algemeen.open

  if (dienst.uurStatus !== 'gepland') {
    return <p className="club-hint">{tk.urenStaan}</p>
  }

  const kanZiek = dienst.medewerkerId !== null && dienst.uursoort === 'werk'
  const opties = alle.filter((d) => d.id !== dienst.id && d.uurStatus === 'gepland' && d.uursoort === 'werk' && d.medewerkerId !== dienst.medewerkerId)
  const klaar = () => router.push(sluitHref, { scroll: false })

  return (
    <section className="club-personeel-sectie" aria-labelledby="club-personeel-acties-titel">
      <h3 id="club-personeel-acties-titel">{tk.titel}</h3>
      {kanZiek && (
        <button type="button" className="club-knop club-knop--gevaar" disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/diensten/${dienst.id}/ziek`, 'POST'), klaar)}>
          <Thermometer aria-hidden size={16} /> {tk.ziekMelden(naam(dienst.medewerkerId))}
        </button>
      )}
      {kanZiek && <p className="club-hint">{tk.ziekUitleg}</p>}

      <div className="club-personeel-ruil">
        <label className="club-veld">
          <span>{tk.ruilenMet}</span>
          <select className="club-invoer" value={ruilMet} onChange={(e) => setRuilMet(e.target.value)}>
            <option value="">{tk.kiesDienst}</option>
            {opties.map((d) => (
              <option key={d.id} value={d.id}>
                {weekdagKort(d.datum, taal)} {dagMaand(d.datum, taal)} {alles.algemeen.vanTot(d.begin, d.eind)}, {naam(d.medewerkerId)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="club-knop" disabled={bezig || ruilMet === ''} onClick={() => voerUit(() => stuur(`${API}/ruilen`, 'POST', { a: dienst.id, b: ruilMet }), klaar)}>
          <ArrowLeftRight aria-hidden size={16} /> {tk.ruilen}
        </button>
      </div>

      {zeker ? (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--gevaar" disabled={bezig} onClick={() => voerUit(() => stuur(`${API}/diensten/${dienst.id}`, 'DELETE'), klaar)}>
            {tk.jaVerwijderen}
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={() => setZeker(false)}>
            {alles.algemeen.tochNiet}
          </button>
        </div>
      ) : (
        <button type="button" className="club-knop club-knop--stil" onClick={() => setZeker(true)}>
          <Trash2 aria-hidden size={16} /> {tk.verwijderen}
        </button>
      )}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
