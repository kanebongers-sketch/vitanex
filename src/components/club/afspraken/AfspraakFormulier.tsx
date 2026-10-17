'use client'

import { useId, useState, type FormEvent } from 'react'
import type { AfspraakType } from '@/lib/club/afspraken/model'
import { stuur } from '@/components/club/leden/stuur'
import { LidZoeker, type GekozenLid } from './LidZoeker'
import { VrijeTijden, slotSleutel, useVrijeTijden } from './VrijeTijden'
import type { SlotOptie } from './haal'

// Een nieuwe afspraak: soort, trainer (of de eerste die vrij is), dag, lid en
// een vrij tijdstip. Alleen tijden die echt vrij zijn staan erbij; de server
// controleert het bij het opslaan nog een keer.

export interface Persoon {
  id: string
  naam: string
}

export interface NieuwStart {
  datum: string
  medewerkerId: string | null
}

interface Props {
  vestiging: string
  typen: readonly AfspraakType[]
  /** Per type wie het mag geven. */
  typeTrainers: Readonly<Record<string, readonly string[]>>
  trainers: readonly Persoon[]
  leads: readonly Persoon[]
  start: NieuwStart
  vandaag: string
  onKlaar: (melding: string) => void
  onSluit: () => void
}

export function AfspraakFormulier({ vestiging, typen, typeTrainers, trainers, leads, start, vandaag, onKlaar, onSluit }: Props) {
  const id = useId()
  const actief = typen.filter((t) => t.actief)
  const [typeId, setTypeId] = useState(actief[0]?.id ?? '')
  const [medewerkerId, setMedewerkerId] = useState(start.medewerkerId ?? '')
  const [datum, setDatum] = useState(start.datum < vandaag ? vandaag : start.datum)
  const [lid, setLid] = useState<GekozenLid | null>(null)
  const [leadId, setLeadId] = useState('')
  const [notitie, setNotitie] = useState('')
  const [geboektDoor, setGeboektDoor] = useState<'balie' | 'trainer'>('balie')
  const [slot, setSlot] = useState<SlotOptie | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  const magGeven = trainers.filter((t) => (typeTrainers[typeId] ?? []).includes(t.id))
  const trainerGeldig = medewerkerId === '' || magGeven.some((t) => t.id === medewerkerId)
  const url = typeId && datum && trainerGeldig
    ? `/api/club/afspraken/sloten?${new URLSearchParams({ v: vestiging, type: typeId, datum, medewerker: medewerkerId })}`
    : null
  const tijden = useVrijeTijden(url)
  const slotGeldig = slot !== null && tijden.sloten.some((s) => slotSleutel(s) === slotSleutel(slot))

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!lid) return setFout('Kies eerst een lid.')
    if (!slot || !slotGeldig) return setFout('Kies een vrij tijdstip.')
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/afspraken', 'POST', {
      vestiging, typeId, medewerkerId: slot.medewerkerId, lidId: lid.id, leadId: leadId || null, datum, tijd: slot.tijd, notitie, geboektDoor,
    })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar(`Afspraak gemaakt met ${lid.naam} om ${slot.tijd}.`)
  }

  if (actief.length === 0) {
    return <p className="club-leeg">Er zijn nog geen actieve soorten afspraken. Maak er een aan bij Afspraaktypen.</p>
  }

  return (
    <form className="club-afspraken-form" onSubmit={opslaan} aria-labelledby={`${id}-kop`}>
      <h2 id={`${id}-kop`} className="club-afspraken-paneelkop">Nieuwe afspraak</h2>
      <div className="club-formrij">
        <label className="club-veld"><span>Soort *</span>
          <select className="club-invoer" value={typeId} onChange={(e) => { setTypeId(e.target.value); setSlot(null) }} required>
            {actief.map((t) => <option key={t.id} value={t.id}>{t.naam} ({t.duurMin} min)</option>)}
          </select>
        </label>
        <label className="club-veld"><span>Trainer</span>
          <select className="club-invoer" value={trainerGeldig ? medewerkerId : ''} onChange={(e) => { setMedewerkerId(e.target.value); setSlot(null) }}>
            <option value="">Eerste die vrij is</option>
            {magGeven.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
          </select>
        </label>
        <label className="club-veld"><span>Dag *</span>
          <input type="date" className="club-invoer" value={datum} min={vandaag} onChange={(e) => { setDatum(e.target.value); setSlot(null) }} required />
        </label>
      </div>
      <fieldset className="club-afspraken-tijdkeuze">
        <legend>Vrije tijden</legend>
        <VrijeTijden
          sloten={tijden.sloten}
          laden={tijden.laden}
          fout={tijden.fout}
          gekozen={slot ? slotSleutel(slot) : null}
          onKies={setSlot}
          metTrainer={medewerkerId === ''}
          leegTekst={magGeven.length === 0 ? 'Niemand in deze vestiging geeft dit soort afspraak.' : 'Geen vrije tijden op deze dag. Kies een andere dag of trainer.'}
        />
      </fieldset>
      <LidZoeker vestiging={vestiging} gekozen={lid} onKies={setLid} />
      <div className="club-formrij">
        {leads.length > 0 ? (
          <label className="club-veld"><span>Koppelen aan lead</span>
            <select className="club-invoer" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Geen lead</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.naam}</option>)}
            </select>
          </label>
        ) : null}
        <label className="club-veld"><span>Geboekt door</span>
          <select className="club-invoer" value={geboektDoor} onChange={(e) => setGeboektDoor(e.target.value === 'trainer' ? 'trainer' : 'balie')}>
            <option value="balie">Balie</option>
            <option value="trainer">Trainer</option>
          </select>
        </label>
      </div>
      <label className="club-veld"><span>Notitie</span>
        <textarea className="club-invoer" rows={3} maxLength={1000} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Bijvoorbeeld: doel, blessure of wat het lid wil bespreken" />
      </label>
      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Afspraak maken'}</button>
        <button type="button" className="club-knop" onClick={onSluit} disabled={bezig}>Annuleren</button>
      </div>
    </form>
  )
}
