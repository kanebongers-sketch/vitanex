'use client'

import { useId } from 'react'
import { Calculator } from 'lucide-react'
import {
  ACTIVITEIT_INFO,
  ACTIVITEITEN,
  bereken,
  controleerInvoer,
  DOEL_INFO,
  DOELEN,
  GESLACHT_LABEL,
  GESLACHTEN,
  GRENZEN,
  type RekenInvoer,
  type RekenUitkomst,
} from '@/lib/club/voeding/rekenhulp'
import { veldenNaarInvoer, type RekenVelden } from '@/lib/club/voeding/startwaarden'

// De rekenhulp: Mifflin-St Jeor maal activiteit, plus of min het doel.
// Rekent live mee; "Overnemen" zet de uitkomst in de dagdoelen van het plan.

interface RekenhulpPaneelProps {
  velden: RekenVelden
  onWijzig: (velden: RekenVelden) => void
  onOvernemen: (uitkomst: RekenUitkomst, invoer: RekenInvoer) => void
}

interface GetalVeldProps {
  label: string
  eenheid: string
  waarde: string
  grens: { min: number; max: number }
  stap: string
  onWijzig: (v: string) => void
}

function GetalVeld({ label, eenheid, waarde, grens, stap, onWijzig }: GetalVeldProps) {
  return (
    <label className="club-veld">
      <span>{label}</span>
      <span className="club-voeding-eenheid">
        <input className="club-invoer" type="number" inputMode="decimal" min={grens.min} max={grens.max} step={stap} value={waarde} onChange={(e) => onWijzig(e.target.value)} />
        <em aria-hidden>{eenheid}</em>
      </span>
    </label>
  )
}

export function RekenhulpPaneel({ velden, onWijzig, onOvernemen }: RekenhulpPaneelProps) {
  const id = useId()
  const zet = <K extends keyof RekenVelden>(k: K, v: RekenVelden[K]) => onWijzig({ ...velden, [k]: v })
  const invoer = veldenNaarInvoer(velden)
  const fouten = controleerInvoer(invoer)
  const uitkomst = fouten.length === 0 ? bereken(invoer as RekenInvoer) : null

  return (
    <section className="club-kaart club-voeding-reken" aria-labelledby={`${id}-kop`}>
      <div className="club-voeding-reken-kop">
        <h2 id={`${id}-kop`}>Rekenhulp</h2>
        <Calculator size={18} aria-hidden />
      </div>
      <div className="club-voeding-velden">
        <GetalVeld label="Gewicht" eenheid="kg" waarde={velden.gewicht} grens={GRENZEN.gewicht} stap="0.1" onWijzig={(v) => zet('gewicht', v)} />
        <GetalVeld label="Lengte" eenheid="cm" waarde={velden.lengte} grens={GRENZEN.lengte} stap="1" onWijzig={(v) => zet('lengte', v)} />
        <GetalVeld label="Leeftijd" eenheid="jaar" waarde={velden.leeftijd} grens={GRENZEN.leeftijd} stap="1" onWijzig={(v) => zet('leeftijd', v)} />
      </div>

      <fieldset className="club-voeding-keuzes">
        <legend className="club-label">Geslacht</legend>
        {GESLACHTEN.map((g) => (
          <label key={g}>
            <input type="radio" name={`${id}-geslacht`} checked={velden.geslacht === g} onChange={() => zet('geslacht', g)} />
            <span>{g === 'anders' ? 'Anders' : GESLACHT_LABEL[g]}</span>
          </label>
        ))}
      </fieldset>

      <label className="club-veld">
        <span>Activiteit</span>
        <select className="club-invoer" value={velden.activiteit} onChange={(e) => zet('activiteit', e.target.value as RekenVelden['activiteit'])}>
          {ACTIVITEITEN.map((a) => (
            <option key={a} value={a}>
              {ACTIVITEIT_INFO[a].label}: {ACTIVITEIT_INFO[a].uitleg.toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="club-voeding-keuzes">
        <legend className="club-label">Doel</legend>
        {DOELEN.map((d) => (
          <label key={d} title={DOEL_INFO[d].uitleg}>
            <input type="radio" name={`${id}-doel`} checked={velden.doel === d} onChange={() => zet('doel', d)} />
            <span>{DOEL_INFO[d].label}</span>
          </label>
        ))}
      </fieldset>

      <div className="club-voeding-velden">
        <GetalVeld label="Eiwit per kilo" eenheid="g/kg" waarde={velden.eiwitPerKg} grens={GRENZEN.eiwitPerKg} stap="0.1" onWijzig={(v) => zet('eiwitPerKg', v)} />
        <GetalVeld label="Vet" eenheid="%" waarde={velden.vetPercentage} grens={GRENZEN.vetPercentage} stap="1" onWijzig={(v) => zet('vetPercentage', v)} />
      </div>

      {uitkomst ? (
        <div className="club-voeding-uitkomst" aria-live="polite">
          <dl>
            <dt>Rustverbruik</dt>
            <dd>{uitkomst.rustverbruik} kcal</dd>
            <dt>Dagverbruik</dt>
            <dd>{uitkomst.dagverbruik} kcal</dd>
            <dt>Dagdoel ({DOEL_INFO[velden.doel].label.toLowerCase()})</dt>
            <dd className="is-totaal">{uitkomst.kcal} kcal</dd>
            <dt>Eiwit, koolhydraten, vet</dt>
            <dd>
              {uitkomst.eiwitG} g · {uitkomst.koolhydratenG} g · {uitkomst.vetG} g
            </dd>
          </dl>
          {uitkomst.geenRuimteKh && <p className="club-voeding-hint club-voeding-hint--let-op">Eiwit en vet laten weinig ruimte voor koolhydraten. Verlaag de eiwitnorm of het vet.</p>}
          {uitkomst.begrensd && <p className="club-voeding-hint">Het dagdoel staat op het rustverbruik: lager raden we niet aan.</p>}
          <div className="club-voeding-acties">
            <button type="button" className="club-knop club-knop--primair club-knop--klein" onClick={() => onOvernemen(uitkomst, invoer as RekenInvoer)}>
              Overnemen in het plan
            </button>
          </div>
        </div>
      ) : (
        <p className="club-voeding-hint">Nog nodig: {fouten.join(', ').toLowerCase()}.</p>
      )}
      <p className="club-voeding-hint">Mifflin-St Jeor is een schatting. Kijk na een paar weken naar gewicht, energie en herstel, en stel bij.</p>
    </section>
  )
}
