'use client'

import { useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { leesMeting, type Meting } from '@/lib/lifeos/pt-dashboard/metingen'
import { extraBody, type ExtraSleutel } from '@/lib/lifeos/pt-dashboard/meting-extra'
import { ExtraVelden } from './ExtraVelden'
import { Veld } from '../velden'
import { ptApi } from '../api'

// Snel wegen: datum, gewicht en eventueel vetpercentage — klaar in tien
// seconden na de training. Wordt een meting van soort 'weging' (telt niet mee
// als check-meting, wel in de gewichtslijn en het verschil sinds de start).

interface Props {
  code: string
  klantId: string
  vandaag: string
  /** Extra meetopties die bij deze klant eerder gemeten zijn: staan al klaar. */
  voorselectie: readonly ExtraSleutel[]
  onOpgeslagen: (m: Meting) => void
  onAnnuleer: () => void
}

export function WegingFormulier({ code, klantId, vandaag, voorselectie, onOpgeslagen, onAnnuleer }: Props) {
  const [datum, setDatum] = useState(vandaag)
  const [gewicht, setGewicht] = useState('')
  const [vet, setVet] = useState('')
  const [gekozen, setGekozen] = useState<ExtraSleutel[]>(() => [...voorselectie])
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/metingen`, 'POST', { datum, soort: 'weging', gewichtKg: gewicht, vetPct: vet, extra: extraBody(gekozen, extra) }, leesMeting)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ptd-kaart ffdos-logboek-form" onSubmit={(e) => void opslaan(e)} aria-label="Snel wegen">
      <div className="ffdos-velden ffdos-velden--rij">
        <Veld label="Datum" id="ffdos-weging-datum">
          <input id="ffdos-weging-datum" type="date" className="ptd-invoer" value={datum} max={vandaag} onChange={(e) => setDatum(e.target.value)} required />
        </Veld>
        <Veld label="Gewicht (kg)" id="ffdos-weging-kg">
          <input id="ffdos-weging-kg" type="text" inputMode="decimal" className="ptd-invoer" value={gewicht} onChange={(e) => setGewicht(e.target.value)} placeholder="82,4" required autoFocus />
        </Veld>
        <Veld label="Vet (%)" id="ffdos-weging-vet" hint="optioneel">
          <input id="ffdos-weging-vet" type="text" inputMode="decimal" className="ptd-invoer" value={vet} onChange={(e) => setVet(e.target.value)} placeholder="24,5" />
        </Veld>
      </div>
      <ExtraVelden
        idPrefix="ffdos-weging"
        gekozen={gekozen}
        waarden={extra}
        onGekozen={setGekozen}
        onWaarde={(s, w) => setExtra((x) => ({ ...x, [s]: w }))}
      />
      {fout ? <Foutmelding bericht={fout} /> : null}
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || gewicht.trim().length === 0}>{bezig ? 'Opslaan…' : 'Weging opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>Annuleer</button>
      </div>
    </form>
  )
}
