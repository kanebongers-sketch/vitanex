'use client'

import { useId } from 'react'
import { Calculator } from 'lucide-react'
import {
  ACTIVITEITEN,
  bereken,
  controleerInvoer,
  DOELEN,
  GESLACHTEN,
  GRENZEN,
  type RekenInvoer,
  type RekenUitkomst,
} from '@/lib/club/voeding/rekenhulp'
import { veldenNaarInvoer, type RekenVelden } from '@/lib/club/voeding/startwaarden'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

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
  const taal = useTaal()
  const tv = useTekst(VOEDING)
  const t = tv.reken
  const zet = <K extends keyof RekenVelden>(k: K, v: RekenVelden[K]) => onWijzig({ ...velden, [k]: v })
  const invoer = veldenNaarInvoer(velden)
  const fouten = controleerInvoer(invoer, taal)
  const uitkomst = fouten.length === 0 ? bereken(invoer as RekenInvoer) : null

  return (
    <section className="club-kaart club-voeding-reken" aria-labelledby={`${id}-kop`}>
      <div className="club-voeding-reken-kop">
        <h2 id={`${id}-kop`}>{t.titel}</h2>
        <Calculator size={18} aria-hidden />
      </div>
      <div className="club-voeding-velden">
        <GetalVeld label={t.gewicht} eenheid="kg" waarde={velden.gewicht} grens={GRENZEN.gewicht} stap="0.1" onWijzig={(v) => zet('gewicht', v)} />
        <GetalVeld label={t.lengte} eenheid="cm" waarde={velden.lengte} grens={GRENZEN.lengte} stap="1" onWijzig={(v) => zet('lengte', v)} />
        <GetalVeld label={t.leeftijd} eenheid={t.jaar} waarde={velden.leeftijd} grens={GRENZEN.leeftijd} stap="1" onWijzig={(v) => zet('leeftijd', v)} />
      </div>

      <fieldset className="club-voeding-keuzes">
        <legend className="club-label">{t.geslacht}</legend>
        {GESLACHTEN.map((g) => (
          <label key={g}>
            <input type="radio" name={`${id}-geslacht`} checked={velden.geslacht === g} onChange={() => zet('geslacht', g)} />
            <span>{tv.geslacht[g]}</span>
          </label>
        ))}
      </fieldset>

      <label className="club-veld">
        <span>{t.activiteit}</span>
        <select className="club-invoer" value={velden.activiteit} onChange={(e) => zet('activiteit', e.target.value as RekenVelden['activiteit'])}>
          {ACTIVITEITEN.map((a) => (
            <option key={a} value={a}>
              {tv.activiteit[a].label}: {tv.activiteit[a].uitleg.toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="club-voeding-keuzes">
        <legend className="club-label">{t.doel}</legend>
        {DOELEN.map((d) => (
          <label key={d} title={tv.doel[d].uitleg}>
            <input type="radio" name={`${id}-doel`} checked={velden.doel === d} onChange={() => zet('doel', d)} />
            <span>{tv.doel[d].label}</span>
          </label>
        ))}
      </fieldset>

      <div className="club-voeding-velden">
        <GetalVeld label={t.eiwitPerKilo} eenheid="g/kg" waarde={velden.eiwitPerKg} grens={GRENZEN.eiwitPerKg} stap="0.1" onWijzig={(v) => zet('eiwitPerKg', v)} />
        <GetalVeld label={t.vet} eenheid="%" waarde={velden.vetPercentage} grens={GRENZEN.vetPercentage} stap="1" onWijzig={(v) => zet('vetPercentage', v)} />
      </div>

      {uitkomst ? (
        <div className="club-voeding-uitkomst" aria-live="polite">
          <dl>
            <dt>{t.rustverbruik}</dt>
            <dd>{uitkomst.rustverbruik} kcal</dd>
            <dt>{t.dagverbruik}</dt>
            <dd>{uitkomst.dagverbruik} kcal</dd>
            <dt>{t.dagdoel(tv.doel[velden.doel].label.toLowerCase())}</dt>
            <dd className="is-totaal">{uitkomst.kcal} kcal</dd>
            <dt>{t.macros}</dt>
            <dd>
              {uitkomst.eiwitG} g · {uitkomst.koolhydratenG} g · {uitkomst.vetG} g
            </dd>
          </dl>
          {uitkomst.geenRuimteKh && <p className="club-voeding-hint club-voeding-hint--let-op">{t.geenRuimte}</p>}
          {uitkomst.begrensd && <p className="club-voeding-hint">{t.begrensd}</p>}
          <div className="club-voeding-acties">
            <button type="button" className="club-knop club-knop--primair club-knop--klein" onClick={() => onOvernemen(uitkomst, invoer as RekenInvoer)}>
              {t.overnemen}
            </button>
          </div>
        </div>
      ) : (
        <p className="club-voeding-hint">{t.nogNodig(fouten.join(', ').toLowerCase())}</p>
      )}
      <p className="club-voeding-hint">{t.schatting}</p>
    </section>
  )
}
