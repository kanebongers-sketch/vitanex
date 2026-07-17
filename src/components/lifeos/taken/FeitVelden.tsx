'use client'

import { useId, useState } from 'react'
import { ENERGIE_LABEL, ENERGIE_UITLEG, IMPACT_SCHAAL } from '@/lib/lifeos/taken/feiten'
import {
  ENERGIE_NIVEAUS,
  MAX_INSPANNING,
  MIN_INSPANNING,
  type EnergieNiveau,
} from '@/lib/lifeos/taken/prioriteit'
import { HINT, INVOER, LABEL, VELD } from './detailStijl'
import { Segment } from './Segment'

// De drie velden die een OORDEEL dragen: hoeveel maakt het uit, wat kost het,
// welke energie vraagt het. Apart van `TaakDetail`, waar deadline en project
// staan — dat zijn feiten die je opzoekt, geen oordelen die je velt.
//
// Alle drie kunnen terug naar "weet ik niet". Zie de kop van `TaakDetail`.

interface ImpactVeldProps {
  impact: number | null
  onKies: (v: number | null) => void
}

export function ImpactVeld({ impact, onKies }: ImpactVeldProps) {
  return (
    <fieldset style={VELD}>
      <legend style={LABEL}>Impact</legend>
      <Segment
        opties={IMPACT_SCHAAL.map((stap) => ({
          waarde: stap.waarde,
          kort: String(stap.waarde),
          titel: stap.label,
        }))}
        gekozen={impact}
        onKies={onKies}
        legeTekst="Weet ik niet"
      />
      <p style={HINT}>
        {impact === null
          ? 'Zonder impact of deadline kan ik deze taak niet wegen.'
          : IMPACT_SCHAAL.find((s) => s.waarde === impact)?.label}
      </p>
    </fieldset>
  )
}

interface InspanningVeldProps {
  minuten: number | null
  onZet: (v: number | null) => void
}

/** Onbekend is een leeg veld, geen '0' — dat zou een schatting zijn die niemand gaf. */
function alsTekst(minuten: number | null): string {
  return minuten === null ? '' : String(minuten)
}

/**
 * Vrije invoer in minuten. Pas bij blur (of Enter) gaat het naar de server —
 * anders schiet er een PATCH weg bij elke toetsaanslag, en zou "45" onderweg
 * even "4" zijn.
 */
export function InspanningVeld({ minuten, onZet }: InspanningVeldProps) {
  const id = useId()
  const [tekst, setTekst] = useState(() => alsTekst(minuten))

  // De server (of een rollback) is de waarheid: verandert de taak van buitenaf,
  // dan volgt het veld. Zonder dit blijft een mislukte wijziging in beeld staan
  // alsof hij gelukt is.
  //
  // Dit is React's "state aanpassen tijdens de render"-patroon en bewust GEEN
  // useEffect: een effect zou pas ná de eerste render corrigeren, en dan zie je
  // de oude waarde één frame lang staan. Zo rendert React direct opnieuw, vóór
  // er iets op het scherm komt.
  const [gezien, setGezien] = useState(minuten)
  if (gezien !== minuten) {
    setGezien(minuten)
    setTekst(alsTekst(minuten))
  }

  const commit = () => {
    const schoon = tekst.trim()
    if (schoon.length === 0) {
      if (minuten !== null) onZet(null)
      return
    }
    const getal = Number(schoon)
    if (!Number.isInteger(getal) || getal < MIN_INSPANNING || getal > MAX_INSPANNING) {
      // Ongeldig → terug naar de laatste echte waarde. Niets doorsturen: de
      // server zou 'm toch weigeren, en dan had je een foutmelding voor een
      // typfout die we hier al zien.
      setTekst(alsTekst(minuten))
      return
    }
    if (getal !== minuten) onZet(getal)
  }

  return (
    <div style={VELD}>
      <label htmlFor={id} style={LABEL}>
        Tijdsinschatting
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={MIN_INSPANNING}
          max={MAX_INSPANNING}
          step={5}
          value={tekst}
          placeholder="—"
          onChange={(e) => setTekst(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          style={{ ...INVOER, width: 88 }}
        />
        <span style={HINT}>
          {minuten === null ? 'minuten — zonder dit plan ik hem niet in' : 'minuten'}
        </span>
      </div>
    </div>
  )
}

interface EnergieVeldProps {
  energie: EnergieNiveau | null
  onKies: (v: EnergieNiveau | null) => void
}

export function EnergieVeld({ energie, onKies }: EnergieVeldProps) {
  return (
    <fieldset style={VELD}>
      <legend style={LABEL}>Energie</legend>
      <Segment
        opties={ENERGIE_NIVEAUS.map((n) => ({
          waarde: n,
          kort: ENERGIE_LABEL[n],
          titel: ENERGIE_UITLEG[n],
        }))}
        gekozen={energie}
        onKies={onKies}
        legeTekst="Maakt niet uit"
      />
      <p style={HINT}>
        {energie === null ? 'Geen eis — past op elk moment.' : ENERGIE_UITLEG[energie]}
      </p>
    </fieldset>
  )
}
