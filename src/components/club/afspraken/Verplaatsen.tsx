'use client'

import { useState } from 'react'
import type { AfspraakWeergave } from '@/lib/club/afspraken/model'
import { nlDatumTijd } from '@/lib/club/afspraken/weergave'
import { VrijeTijden, slotSleutel, useVrijeTijden } from './VrijeTijden'
import type { SlotOptie } from './haal'
import type { Persoon } from './AfspraakFormulier'

// Een afspraak verplaatsen: nieuwe dag en eventueel een andere trainer, dan
// een vrij tijdstip. De afspraak zelf telt daarbij niet als bezet.

interface Props {
  afspraak: AfspraakWeergave
  vestiging: string
  trainers: readonly Persoon[]
  vandaag: string
  bezig: boolean
  onBevestig: (datum: string, tijd: string, medewerkerId: string) => void
  onAnnuleer: () => void
}

export function Verplaatsen({ afspraak, vestiging, trainers, vandaag, bezig, onBevestig, onAnnuleer }: Props) {
  const huidig = nlDatumTijd(afspraak.start).datum
  const [datum, setDatum] = useState(huidig < vandaag ? vandaag : huidig)
  const [medewerkerId, setMedewerkerId] = useState(afspraak.medewerkerId)
  const [slot, setSlot] = useState<SlotOptie | null>(null)
  const url = datum
    ? `/api/club/afspraken/sloten?${new URLSearchParams({ v: vestiging, type: afspraak.typeId, datum, medewerker: medewerkerId, negeer: afspraak.id })}`
    : null
  const tijden = useVrijeTijden(url)

  return (
    <fieldset className="club-afspraken-verplaats">
      <legend>Verplaatsen</legend>
      <div className="club-formrij">
        <label className="club-veld"><span>Dag</span>
          <input type="date" className="club-invoer" value={datum} min={vandaag} onChange={(e) => { setDatum(e.target.value); setSlot(null) }} />
        </label>
        <label className="club-veld"><span>Trainer</span>
          <select className="club-invoer" value={medewerkerId} onChange={(e) => { setMedewerkerId(e.target.value); setSlot(null) }}>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
          </select>
        </label>
      </div>
      <VrijeTijden sloten={tijden.sloten} laden={tijden.laden} fout={tijden.fout} gekozen={slot ? slotSleutel(slot) : null} onKies={setSlot} metTrainer={false} leegTekst="Geen vrije tijden op deze dag." />
      <div className="club-acties">
        <button type="button" className="club-knop club-knop--primair club-knop--klein" disabled={!slot || bezig} onClick={() => slot && onBevestig(datum, slot.tijd, slot.medewerkerId)}>
          {slot ? `Verplaatsen naar ${slot.tijd}` : 'Kies een tijd'}
        </button>
        <button type="button" className="club-knop club-knop--klein" onClick={onAnnuleer} disabled={bezig}>Terug</button>
      </div>
    </fieldset>
  )
}
