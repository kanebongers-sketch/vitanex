'use client'

import { useState } from 'react'
import type { AfspraakWeergave } from '@/lib/club/afspraken/model'
import { nlDatumTijd } from '@/lib/club/afspraken/weergave'
import { VrijeTijden, slotSleutel, useVrijeTijden } from './VrijeTijden'
import type { SlotOptie } from './haal'
import type { Persoon } from './AfspraakFormulier'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

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
  const t = useTekst(AFSPRAKEN).verplaatsen

  return (
    <fieldset className="club-afspraken-verplaats">
      <legend>{t.titel}</legend>
      <div className="club-formrij">
        <label className="club-veld"><span>{t.dag}</span>
          <input type="date" className="club-invoer" value={datum} min={vandaag} onChange={(e) => { setDatum(e.target.value); setSlot(null) }} />
        </label>
        <label className="club-veld"><span>{t.trainer}</span>
          <select className="club-invoer" value={medewerkerId} onChange={(e) => { setMedewerkerId(e.target.value); setSlot(null) }}>
            {trainers.map((m) => <option key={m.id} value={m.id}>{m.naam}</option>)}
          </select>
        </label>
      </div>
      <VrijeTijden sloten={tijden.sloten} laden={tijden.laden} fout={tijden.fout} gekozen={slot ? slotSleutel(slot) : null} onKies={setSlot} metTrainer={false} leegTekst={t.geenTijden} />
      <div className="club-acties">
        <button type="button" className="club-knop club-knop--primair club-knop--klein" disabled={!slot || bezig} onClick={() => slot && onBevestig(datum, slot.tijd, slot.medewerkerId)}>
          {slot ? t.naar(slot.tijd) : t.kiesTijd}
        </button>
        <button type="button" className="club-knop club-knop--klein" onClick={onAnnuleer} disabled={bezig}>{t.terug}</button>
      </div>
    </fieldset>
  )
}
