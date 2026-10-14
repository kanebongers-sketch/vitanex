'use client'

import { useState } from 'react'
import { UUR_STATUS_LABEL, type Dienst } from '@/lib/club/personeel/typen'
import { duurMin } from '@/lib/club/personeel/regels'
import { urenKlok, werkelijk } from '@/lib/club/personeel/uren'
import type { UrenActie } from '@/lib/club/personeel/invoer'
import { API, stuur, useActie } from './vraag'

// Urenregistratie van een dienst: standaard de geplande tijd, aan te passen
// naar het werkelijke begin en eind, met pauze en opmerking. Daarna bevestigen
// (medewerker of manager) en goedkeuren (manager). Verwerkt = op slot.

const STAPPEN = ['gepland', 'gewerkt', 'goedgekeurd', 'verwerkt'] as const

export function DienstUren({ dienst }: { dienst: Dienst }) {
  const w = werkelijk(dienst)
  const [begin, setBegin] = useState(w.begin)
  const [eind, setEind] = useState(w.eind)
  const [pauze, setPauze] = useState(String(dienst.pauzeMin))
  const [opmerking, setOpmerking] = useState(dienst.urenOpmerking ?? '')
  const { bezig, fout, setFout, voerUit } = useActie()
  const opSlot = dienst.uurStatus === 'verwerkt'
  const pauzeMin = Number(pauze) || 0
  const netto = eind > begin ? duurMin(begin, eind) - pauzeMin : 0
  const afwijkend = begin !== dienst.begin || eind !== dienst.eind

  function doe(actie: UrenActie) {
    if (eind <= begin) return setFout('Het einde moet na het begin liggen.')
    void voerUit(() => stuur(`${API}/diensten/${dienst.id}/uren`, 'PATCH', { actie, gewerktBegin: begin, gewerktEind: eind, pauzeMin, opmerking }))
  }

  return (
    <section className="club-personeel-sectie club-personeel-uren" aria-labelledby="club-personeel-uren-paneel">
      <h3 id="club-personeel-uren-paneel">Uren</h3>
      <ol className="club-personeel-stappen" aria-label="Status van de uren">
        {STAPPEN.map((s) => (
          <li key={s} data-klaar={STAPPEN.indexOf(s) <= STAPPEN.indexOf(dienst.uurStatus) || undefined} aria-current={s === dienst.uurStatus ? 'step' : undefined}>
            {UUR_STATUS_LABEL[s]}
          </li>
        ))}
      </ol>
      <fieldset className="club-personeel-velden" disabled={opSlot || bezig}>
        <legend className="club-sr">Gewerkte tijd</legend>
        <div className="club-formrij">
          <label className="club-veld">
            <span>Gewerkt van</span>
            <input className="club-invoer" type="time" step={300} value={begin} onChange={(e) => setBegin(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>Tot</span>
            <input className="club-invoer" type="time" step={300} value={eind} onChange={(e) => setEind(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>Pauze (min)</span>
            <input className="club-invoer" type="number" min={0} max={240} step={5} value={pauze} onChange={(e) => setPauze(e.target.value)} />
          </label>
        </div>
        <label className="club-veld">
          <span>Opmerking</span>
          <input className="club-invoer" maxLength={300} value={opmerking} onChange={(e) => setOpmerking(e.target.value)} placeholder="Waarom anders dan gepland?" />
        </label>
      </fieldset>
      <p className="club-hint">
        Netto <strong className="club-getal">{urenKlok(netto)}</strong> uur
        {afwijkend && <span className="club-personeel-afwijkend"> · anders dan gepland ({dienst.begin} tot {dienst.eind})</span>}
      </p>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {!opSlot && (
        <div className="club-acties">
          {(dienst.uurStatus === 'gepland' || dienst.uurStatus === 'gewerkt') && (
            <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => doe('bevestig')}>
              {dienst.uurStatus === 'gepland' ? 'Bevestig gewerkt' : 'Opslaan'}
            </button>
          )}
          {dienst.uurStatus !== 'goedgekeurd' && (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('goedkeuren')}>
              Goedkeuren
            </button>
          )}
          {dienst.uurStatus === 'goedgekeurd' && (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('opslaan')}>
              Opslaan
            </button>
          )}
          {dienst.uurStatus !== 'gepland' && (
            <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => doe('terug')}>
              Stap terug
            </button>
          )}
        </div>
      )}
    </section>
  )
}
