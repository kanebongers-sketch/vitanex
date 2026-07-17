'use client'

import { useId } from 'react'

// ─── De schaalkiezer ────────────────────────────────────────────────────────
// Stress (1–10) en stemming (1–5) kiezen hetzelfde soort ding: één waarde op een
// benoemde schaal. Eén component, twee gebruikers — anders staat dezelfde
// radio-groep binnen een week in twee bestanden.
//
// Waarom radio's en geen rij knoppen: een radiogroep is één tab-stop, je loopt
// er met de pijltjestoetsen doorheen, en de legenda wordt voorgelezen als de
// vraag waar hij bij hoort. Met knoppen moet je dat allemaal namaken — en dan
// mis je de helft.
//
// De styling zit in globals.css (`.os-schaal`), niet hier: :checked, :hover en
// :focus-visible horen bij het element, niet bij een React-render.

export interface SchaalWaarde {
  waarde: number
  /** Wat deze waarde betekent. Wordt de voorleesnaam: "3 — Neutraal". */
  label: string
}

interface SchaalKiezerProps {
  /** De vraag. Wordt de `<legend>` van de groep. */
  legenda: string
  /** Uniek per groep op de pagina; koppelt de radio's aan elkaar. */
  naam: string
  waarden: readonly SchaalWaarde[]
  /** `null` = nog niets gekozen. Nooit een default: dat zou een niet-gemaakte keuze als meting laten lezen. */
  gekozen: number | null
  onKies: (waarde: number) => void
  disabled?: boolean
  /** Het woord onder de laagste en hoogste waarde. Zonder dit is "7" betekenisloos. */
  uiteinden?: { laag: string; hoog: string }
}

export function SchaalKiezer({
  legenda,
  naam,
  waarden,
  gekozen,
  onKies,
  disabled = false,
  uiteinden,
}: SchaalKiezerProps) {
  // useId: er kunnen meerdere kiezers op één pagina staan (stress én stemming),
  // en dan moeten de input-id's uit elkaar blijven.
  const idBasis = useId()

  return (
    <fieldset className="os-schaal">
      <legend className="os-schaal__legenda">{legenda}</legend>

      <div className="os-schaal__rij">
        {waarden.map((optie) => {
          const id = `${idBasis}-${naam}-${optie.waarde}`
          return (
            <div key={optie.waarde} style={{ display: 'grid', minWidth: 0 }}>
              <input
                className="os-schaal__invoer"
                type="radio"
                id={id}
                name={`${idBasis}-${naam}`}
                value={optie.waarde}
                checked={gekozen === optie.waarde}
                disabled={disabled}
                onChange={() => onKies(optie.waarde)}
                // Het cijfer alleen is geen naam: "3" zegt niets zonder de schaal
                // erbij. Deze aria-label overschrijft de zichtbare "3".
                aria-label={`${optie.waarde} — ${optie.label}`}
              />
              <label className="os-schaal__vak" htmlFor={id}>
                {/* Het cijfer is de visuele vorm; de naam staat in aria-label. */}
                <span aria-hidden="true">{optie.waarde}</span>
              </label>
            </div>
          )
        })}
      </div>

      {uiteinden ? (
        // aria-hidden: de aria-labels op de radio's zeggen dit al per waarde.
        // Twee keer voorlezen maakt de groep langer, niet duidelijker.
        <p className="os-schaal__uiteinden" aria-hidden="true">
          <span>{uiteinden.laag}</span>
          <span>{uiteinden.hoog}</span>
        </p>
      ) : null}
    </fieldset>
  )
}
