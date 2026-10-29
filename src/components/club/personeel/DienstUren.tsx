'use client'

import { useState } from 'react'
import type { Dienst } from '@/lib/club/personeel/typen'
import { duurMin } from '@/lib/club/personeel/regels'
import { urenKlok, werkelijk } from '@/lib/club/personeel/uren'
import type { UrenActie } from '@/lib/club/personeel/invoer'
import { API, stuur, useActie } from './vraag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// Urenregistratie van een dienst: standaard de geplande tijd, aan te passen
// naar het werkelijke begin en eind, met pauze en opmerking. Daarna bevestigen
// (medewerker of manager) en goedkeuren (manager). Verwerkt = op slot.
// Een trainer of instructeur ziet alleen bij zijn eigen dienst knoppen en
// nooit Goedkeuren (uren-rechten.ts; de API controleert hetzelfde).

const STAPPEN = ['gepland', 'gewerkt', 'goedgekeurd', 'verwerkt'] as const

interface Props {
  dienst: Dienst
  magGoedkeuren: boolean
  /** Bevestigen of aanpassen (bij de eigen dienst, zolang niet goedgekeurd); wie goedkeurt, mag dit altijd. */
  magWijzigen: boolean
}

export function DienstUren({ dienst, magGoedkeuren, magWijzigen }: Props) {
  const w = werkelijk(dienst)
  const [begin, setBegin] = useState(w.begin)
  const [eind, setEind] = useState(w.eind)
  const [pauze, setPauze] = useState(String(dienst.pauzeMin))
  const [opmerking, setOpmerking] = useState(dienst.urenOpmerking ?? '')
  const { bezig, fout, setFout, voerUit } = useActie()
  const alles = useTekst(PERSONEEL)
  const tk = alles.uren
  const opSlot = dienst.uurStatus === 'verwerkt' || !magWijzigen
  const pauzeMin = Number(pauze) || 0
  const netto = eind > begin ? duurMin(begin, eind) - pauzeMin : 0
  const afwijkend = begin !== dienst.begin || eind !== dienst.eind

  function doe(actie: UrenActie) {
    if (eind <= begin) return setFout(tk.eindNaBegin)
    void voerUit(() => stuur(`${API}/diensten/${dienst.id}/uren`, 'PATCH', { actie, gewerktBegin: begin, gewerktEind: eind, pauzeMin, opmerking }))
  }

  return (
    <section className="club-personeel-sectie club-personeel-uren" aria-labelledby="club-personeel-uren-paneel">
      <h3 id="club-personeel-uren-paneel">{tk.titel}</h3>
      <ol className="club-personeel-stappen" aria-label={tk.status}>
        {STAPPEN.map((s) => (
          <li key={s} data-klaar={STAPPEN.indexOf(s) <= STAPPEN.indexOf(dienst.uurStatus) || undefined} aria-current={s === dienst.uurStatus ? 'step' : undefined}>
            {alles.labels.uurStatus[s]}
          </li>
        ))}
      </ol>
      <fieldset className="club-personeel-velden" disabled={opSlot || bezig}>
        <legend className="club-sr">{tk.gewerkteTijd}</legend>
        <div className="club-formrij">
          <label className="club-veld">
            <span>{tk.gewerktVan}</span>
            <input className="club-invoer" type="time" step={300} value={begin} onChange={(e) => setBegin(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{tk.tot}</span>
            <input className="club-invoer" type="time" step={300} value={eind} onChange={(e) => setEind(e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{tk.pauze}</span>
            <input className="club-invoer" type="number" min={0} max={240} step={5} value={pauze} onChange={(e) => setPauze(e.target.value)} />
          </label>
        </div>
        <label className="club-veld">
          <span>{tk.opmerking}</span>
          <input className="club-invoer" maxLength={300} value={opmerking} onChange={(e) => setOpmerking(e.target.value)} placeholder={tk.opmerkingPlaats} />
        </label>
      </fieldset>
      <p className="club-hint">
        {tk.netto} <strong className="club-getal">{urenKlok(netto)}</strong> {tk.uur}
        {afwijkend && <span className="club-personeel-afwijkend">{tk.anders(dienst.begin, dienst.eind)}</span>}
      </p>
      {!magWijzigen && dienst.uurStatus !== 'verwerkt' && (
        <p className="club-hint">{tk.zelfBevestigen}</p>
      )}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {!opSlot && (
        <div className="club-acties">
          {(dienst.uurStatus === 'gepland' || dienst.uurStatus === 'gewerkt') && (
            <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => doe('bevestig')}>
              {dienst.uurStatus === 'gepland' ? tk.bevestig : alles.algemeen.opslaan}
            </button>
          )}
          {magGoedkeuren && dienst.uurStatus !== 'goedgekeurd' && (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('goedkeuren')}>
              {tk.goedkeuren}
            </button>
          )}
          {dienst.uurStatus === 'goedgekeurd' && (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => doe('opslaan')}>
              {alles.algemeen.opslaan}
            </button>
          )}
          {dienst.uurStatus !== 'gepland' && (
            <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => doe('terug')}>
              {tk.stapTerug}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
