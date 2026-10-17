'use client'

import { useState, type FormEvent } from 'react'
import { MEETWAARDEN, type MeetSleutel, type Meting } from '@/lib/club/voortgang/meting'

export interface MedewerkerKeuze {
  id: string
  naam: string
}

interface MetingFormulierProps {
  /** Bestaande meting om te wijzigen, of undefined voor een nieuwe. */
  meting?: Meting
  medewerkers: readonly MedewerkerKeuze[]
  vandaag: string
  bezig: boolean
  onOpslaan: (velden: Record<string, unknown>) => Promise<boolean>
  onAnnuleer: () => void
}

type Waarden = Record<MeetSleutel | 'bloeddruk', string>

function beginWaarden(m?: Meting): Waarden {
  const uit = { bloeddruk: m?.waarden.bloeddruk ?? '' } as Waarden
  for (const w of MEETWAARDEN) {
    const n = m?.waarden[w.sleutel]
    uit[w.sleutel] = n === undefined ? '' : String(n).replace('.', ',')
  }
  return uit
}

/** Een losse meting toevoegen of wijzigen. Velden pas open na toestemming van het lid. */
export function MetingFormulier({ meting, medewerkers, vandaag, bezig, onOpslaan, onAnnuleer }: MetingFormulierProps) {
  const [toestemming, setToestemming] = useState(Boolean(meting))
  const [datum, setDatum] = useState(meting?.datum ?? vandaag)
  const [medewerkerId, setMedewerkerId] = useState(meting?.medewerkerId ?? '')
  const [waarden, setWaarden] = useState<Waarden>(() => beginWaarden(meting))
  const [notitie, setNotitie] = useState(meting?.notitie ?? '')
  const id = meting?.id ?? 'nieuw'

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    const gelukt = await onOpslaan({ toestemmingGezondheid: toestemming, datum, medewerkerId: medewerkerId || null, waarden, notitie })
    if (gelukt) onAnnuleer()
  }

  return (
    <form className="club-voortgang-formulier" onSubmit={verstuur} aria-label={meting ? 'Meting wijzigen' : 'Meting toevoegen'}>
      <label className="club-voortgang-toestemming">
        <input type="checkbox" checked={toestemming} onChange={(e) => setToestemming(e.target.checked)} />
        <span>
          <strong>Het lid geeft toestemming</strong> om deze lichaamsmetingen vast te leggen. Metingen zijn gezondheidsgegevens; zonder
          toestemming sla je niets op.
        </span>
      </label>
      <fieldset className="club-voortgang-velden" disabled={!toestemming || bezig}>
        <legend className="club-sr">Metingen</legend>
        <div className="club-voortgang-velden-kop">
          <label className="club-veld">
            <span className="club-label">Datum</span>
            <input className="club-invoer" type="date" value={datum} max={vandaag} onChange={(e) => setDatum(e.target.value)} required />
          </label>
          <label className="club-veld">
            <span className="club-label">Gemeten door</span>
            <select className="club-invoer" value={medewerkerId} onChange={(e) => setMedewerkerId(e.target.value)}>
              <option value="">Niet ingevuld</option>
              {medewerkers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.naam}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="club-voortgang-meetvelden">
          {MEETWAARDEN.map((w) => (
            <label key={w.sleutel} className="club-veld">
              <span className="club-label">{w.label}</span>
              <span className="club-voortgang-eenheid">
                <input
                  className="club-invoer"
                  inputMode="decimal"
                  value={waarden[w.sleutel]}
                  onChange={(e) => setWaarden({ ...waarden, [w.sleutel]: e.target.value })}
                  aria-describedby={`${id}-eenheid-${w.sleutel}`}
                />
                <small id={`${id}-eenheid-${w.sleutel}`}>{w.eenheid}</small>
              </span>
            </label>
          ))}
          <label className="club-veld">
            <span className="club-label">Bloeddruk</span>
            <input className="club-invoer" value={waarden.bloeddruk} placeholder="120/80" inputMode="numeric" onChange={(e) => setWaarden({ ...waarden, bloeddruk: e.target.value })} />
          </label>
        </div>
        <label className="club-veld">
          <span className="club-label">Notitie</span>
          <textarea className="club-invoer" rows={2} maxLength={1000} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Bijvoorbeeld: ochtend, nuchter, zelfde weegschaal" />
        </label>
      </fieldset>
      <p className="club-hint">Vul alleen in wat je gemeten hebt. Lege velden blijven leeg.</p>
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={!toestemming || bezig}>
          {bezig ? 'Bezig met opslaan' : meting ? 'Wijziging opslaan' : 'Meting opslaan'}
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer} disabled={bezig}>
          Annuleren
        </button>
      </div>
    </form>
  )
}
