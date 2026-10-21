'use client'

import { useState } from 'react'
import { Oefenbeeld3d } from '@/components/aiyourgym/mockups/Oefenbeeld3d'

// De blikvanger van de voorpagina: een echte oefening uit de bibliotheek als
// eigen 3D-figuur, met de genummerde kernpunten ernaast. Een doek dat van
// oefening wisselt, dus nooit meer dan een 3D-beeld tegelijk in dit blok.

export interface BlikOefening {
  naam: string
  kort: string
  voorschrift: string
  kernpunten: readonly { punt: string; uitleg: string }[]
}

interface Props {
  oefeningen: readonly BlikOefening[]
}

export function SchemaBlikvanger({ oefeningen }: Props) {
  const [index, setIndex] = useState(0)
  const o = oefeningen[index]
  if (!o) return null
  return (
    <div className="ayg-blik">
      <figure className="ayg-blik-beeld">
        <Oefenbeeld3d naam={o.naam} label={`${o.naam} als bewegend 3D-beeld, zoals het lid hem in de app ziet`} />
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
    </div>
  )
}
