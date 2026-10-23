'use client'

import { useState, type ReactNode } from 'react'
import { renderVoor, spierZin } from '@/components/aiyourgym/inhoud/oefenrenders'
import { Oefenbeeld } from '@/components/aiyourgym/mockups/Oefenbeeld'

// De blikvanger van de voorpagina: een echte oefening uit de bibliotheek als
// onze eigen render (besluit Kane 23-10-2026), met de kop en de genummerde
// kernpunten ernaast. Zonder render valt het beeld terug op het 3D-figuur in
// een doek dat van oefening wisselt, dus nooit meer dan een 3D-beeld tegelijk.
// Bij een render staan de werkende spieren onder de naam.

export interface BlikOefening {
  naam: string
  kort: string
  voorschrift: string
  kernpunten: readonly { punt: string; uitleg: string }[]
}

interface Props {
  oefeningen: readonly BlikOefening[]
  /** Label, kop en inleiding: op de pc rechts boven de kernpunten, op de telefoon boven het beeld. */
  kop: ReactNode
  /** De regel onder de kernpunten. */
  onder: ReactNode
}

export function SchemaBlikvanger({ oefeningen, kop, onder }: Props) {
  const [index, setIndex] = useState(0)
  const o = oefeningen[index]
  if (!o) return null
  const spieren = renderVoor(o.naam)?.spieren
  return (
    <div className="ayg-blik">
      <div className="ayg-blik-kop">{kop}</div>
      <figure className="ayg-blik-beeld">
        <Oefenbeeld
          naam={o.naam}
          passend
          bediening
          sizes="(max-width: 959px) min(90vw, 560px), 46vw"
          label={`${o.naam} als bewegend beeld, zoals het lid hem in de app ziet`}
        />
        <figcaption>
          <b>{o.naam}</b>
          <span>{o.voorschrift}</span>
          {spieren && spieren.length > 0 && <span className="ayg-blik-spieren">Werkt vooral op {spierZin(spieren)}</span>}
        </figcaption>
      </figure>
      <div className="ayg-blik-tekst">
        <div className="ayg-blik-keuze" role="group" aria-label="Kies een oefening">
          {oefeningen.map((x, i) => (
            <button key={x.naam} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>
              {x.kort}
            </button>
          ))}
        </div>
        <ol className="ayg-blik-kern" aria-label={`Kernpunten bij ${o.naam}`} aria-live="polite">
          {o.kernpunten.map((k, i) => (
            <li key={k.punt}>
              <span className="ayg-blik-nr" aria-hidden>
                {i + 1}
              </span>
              <span>
                <strong>{k.punt}</strong>
                <span>{k.uitleg}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="ayg-blik-onder">{onder}</div>
    </div>
  )
}
