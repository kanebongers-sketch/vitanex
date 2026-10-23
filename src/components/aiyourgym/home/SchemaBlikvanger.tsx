'use client'

import { useState, type ReactNode } from 'react'
import { Oefenbeeld3d } from '@/components/aiyourgym/mockups/Oefenbeeld3d'

// De blikvanger van de voorpagina: een echte oefening uit de bibliotheek als
// eigen 3D-figuur, met de kop en de genummerde kernpunten ernaast. Een doek dat
// van oefening wisselt, dus nooit meer dan een 3D-beeld tegelijk in dit blok.
// Het figuur staat passend in het doek: hoofd tot voeten altijd in beeld.

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
  return (
    <div className="ayg-blik">
      <div className="ayg-blik-kop">{kop}</div>
      <figure className="ayg-blik-beeld">
        <Oefenbeeld3d naam={o.naam} passend label={`${o.naam} als bewegend 3D-beeld, zoals het lid hem in de app ziet`} />
        <figcaption>
          <b>{o.naam}</b>
          <span>{o.voorschrift}</span>
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
