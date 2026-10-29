'use client'

import { useState, type FormEvent } from 'react'
import { MEETWAARDEN, type MeetSleutel, type Meting } from '@/lib/club/voortgang/meting'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'

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
  const tv = useTekst(VOORTGANG)
  const t = tv.formulier

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    const gelukt = await onOpslaan({ toestemmingGezondheid: toestemming, datum, medewerkerId: medewerkerId || null, waarden, notitie })
    if (gelukt) onAnnuleer()
  }

  return (
    <form className="club-voortgang-formulier" onSubmit={verstuur} aria-label={meting ? t.wijzigen : t.toevoegen}>
      <label className="club-voortgang-toestemming">
        <input type="checkbox" checked={toestemming} onChange={(e) => setToestemming(e.target.checked)} />
        <span>
          <strong>{t.toestemmingKop}</strong> {t.toestemmingRest}
        </span>
      </label>
      <fieldset className="club-voortgang-velden" disabled={!toestemming || bezig}>
        <legend className="club-sr">{t.metingen}</legend>
        <div className="club-voortgang-velden-kop">
          <label className="club-veld">
            <span className="club-label">{t.datum}</span>
            <input className="club-invoer" type="date" value={datum} max={vandaag} onChange={(e) => setDatum(e.target.value)} required />
          </label>
          <label className="club-veld">
            <span className="club-label">{t.gemetenDoor}</span>
            <select className="club-invoer" value={medewerkerId} onChange={(e) => setMedewerkerId(e.target.value)}>
              <option value="">{t.nietIngevuld}</option>
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
              <span className="club-label">{tv.meet[w.sleutel].label}</span>
              <span className="club-voortgang-eenheid">
                <input
                  className="club-invoer"
                  inputMode="decimal"
                  value={waarden[w.sleutel]}
                  onChange={(e) => setWaarden({ ...waarden, [w.sleutel]: e.target.value })}
                  aria-describedby={`${id}-eenheid-${w.sleutel}`}
                />
                <small id={`${id}-eenheid-${w.sleutel}`}>{w.eenheid === 'per min' ? tv.perMinuut : w.eenheid}</small>
              </span>
            </label>
          ))}
          <label className="club-veld">
            <span className="club-label">{t.bloeddruk}</span>
            <input className="club-invoer" value={waarden.bloeddruk} placeholder="120/80" inputMode="numeric" onChange={(e) => setWaarden({ ...waarden, bloeddruk: e.target.value })} />
          </label>
        </div>
        <label className="club-veld">
          <span className="club-label">{t.notitie}</span>
          <textarea className="club-invoer" rows={2} maxLength={1000} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder={t.notitieVoorbeeld} />
        </label>
      </fieldset>
      <p className="club-hint">{t.hint}</p>
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={!toestemming || bezig}>
          {bezig ? t.bezig : meting ? t.wijzigingOpslaan : t.opslaan}
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer} disabled={bezig}>
          {t.annuleren}
        </button>
      </div>
    </form>
  )
}
