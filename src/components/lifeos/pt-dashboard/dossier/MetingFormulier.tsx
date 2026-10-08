'use client'

import { useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import {
  KRACHT_RM, MAAT_VELDEN, METING_SOORTEN, METING_SOORT_LABEL, leesMeting, leesMetingInvoer, type KrachtRm, type MaatSleutel, type Meting,
} from '@/lib/lifeos/pt-dashboard/metingen'
import type { MetingSoort } from '@/lib/lifeos/pt-dashboard/traject'
import { Keuzes, Veld } from '../velden'
import { ptApi } from '../api'

// Een meting vastleggen: dezelfde metingen als op het intakeformulier, onder
// dezelfde omstandigheden. Alles optioneel, minstens één waarde.

interface Props {
  code: string
  klantId: string
  vandaag: string
  standaardSoort: MetingSoort
  onOpgeslagen: (m: Meting) => void
  onAnnuleer: () => void
}

interface Concept {
  datum: string
  soort: MetingSoort
  maten: Record<MaatSleutel, string>
  cardiotest: string
  krachtOefening: string
  krachtRm: KrachtRm | null
  krachtKg: string
  fotosGemaakt: boolean
  notitie: string
}

const SOORT_OPTIES = METING_SOORTEN.map((s) => ({ waarde: s, label: METING_SOORT_LABEL[s] }))
const RM_OPTIES = KRACHT_RM.map((r) => ({ waarde: String(r) as '1' | '5', label: `${r}RM` }))
const LEEG = Object.fromEntries(MAAT_VELDEN.map((v) => [v.sleutel, ''])) as Record<MaatSleutel, string>

export function MetingFormulier({ code, klantId, vandaag, standaardSoort, onOpgeslagen, onAnnuleer }: Props) {
  const [c, setC] = useState<Concept>({
    datum: vandaag, soort: standaardSoort, maten: LEEG, cardiotest: '', krachtOefening: '', krachtRm: null, krachtKg: '', fotosGemaakt: false, notitie: '',
  })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof Concept>(k: K, w: Concept[K]) => setC((x) => ({ ...x, [k]: w }))

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    const body = { ...c, ...c.maten, maten: undefined }
    const check = leesMetingInvoer(body, vandaag)
    if (!check.ok) return setFout(check.fout)
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/metingen`, 'POST', check.waarde, leesMeting)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="ffdos-meting-kop">
      <h3 id="ffdos-meting-kop">Nieuwe meting</h3>
      <div className="ptd-raster">
        <Veld label="Datum *" id="meting-datum">
          <input id="meting-datum" type="date" className="ptd-invoer" value={c.datum} max={vandaag} onChange={(e) => zet('datum', e.target.value)} required />
        </Veld>
        <Keuzes label="Soort meting" opties={SOORT_OPTIES} waarde={c.soort} onKies={(w) => w && zet('soort', w)} />
      </div>

      <div className="ptd-raster ffdos-maten">
        {MAAT_VELDEN.map((v) => (
          <Veld key={v.sleutel} label={`${v.label} (${v.eenheid})`} id={`meting-${v.sleutel}`}>
            <input
              id={`meting-${v.sleutel}`}
              className="ptd-invoer"
              inputMode="decimal"
              autoComplete="off"
              value={c.maten[v.sleutel]}
              onChange={(e) => zet('maten', { ...c.maten, [v.sleutel]: e.target.value })}
            />
          </Veld>
        ))}
      </div>

      <div className="ptd-raster">
        <Veld label="Cardiotest (eGym)" id="meting-cardio" hint="De uitkomst zoals het toestel hem geeft.">
          <input id="meting-cardio" className="ptd-invoer" maxLength={80} value={c.cardiotest} onChange={(e) => zet('cardiotest', e.target.value)} autoComplete="off" />
        </Veld>
        <Veld label="Krachttest: oefening" id="meting-oefening">
          <input id="meting-oefening" className="ptd-invoer" maxLength={80} value={c.krachtOefening} onChange={(e) => zet('krachtOefening', e.target.value)} autoComplete="off" />
        </Veld>
        <Veld label="Krachttest: gewicht (kg)" id="meting-kracht">
          <input id="meting-kracht" className="ptd-invoer" inputMode="decimal" value={c.krachtKg} onChange={(e) => zet('krachtKg', e.target.value)} autoComplete="off" />
        </Veld>
        <Keuzes
          label="Krachttest: 1RM of 5RM"
          opties={RM_OPTIES}
          waarde={c.krachtRm === null ? null : (String(c.krachtRm) as '1' | '5')}
          onKies={(w) => zet('krachtRm', w === null ? null : (Number(w) as KrachtRm))}
          leegToegestaan
        />
      </div>

      <label className="ptd-vinkje">
        <input type="checkbox" checked={c.fotosGemaakt} onChange={(e) => zet('fotosGemaakt', e.target.checked)} /> Foto’s gemaakt
      </label>
      <Veld label="Notitie" id="meting-notitie">
        <textarea id="meting-notitie" className="ptd-invoer" rows={2} maxLength={500} value={c.notitie} onChange={(e) => zet('notitie', e.target.value)} />
      </Veld>

      {fout ? <Foutmelding bericht={fout} /> : null}
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>
          {bezig ? 'Opslaan…' : 'Meting opslaan'}
        </button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>
          Annuleren
        </button>
      </div>
    </form>
  )
}
