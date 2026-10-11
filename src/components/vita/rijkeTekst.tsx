// ─── Rijke tekst uit het woordenboek ─────────────────────────────────────────
// Een vertaalde zin met {plekken} waar een React-element moet komen (bv. een
// cyaan, vet woord). De vertaler laat onbekende {plekken} staan; hier knippen
// we de zin op die plekken en zetten de elementen ertussen. Zo blijft de hele
// zin in één sleutel, en kan elke taal de volgorde zelf kiezen.

import { Fragment, type ReactNode } from 'react'

export function rijkeTekst(sjabloon: string, delen: Record<string, ReactNode>): ReactNode {
  const stukken = sjabloon.split(/\{(\w+)\}/g)
  return stukken.map((stuk, i) =>
    i % 2 === 1
      ? <Fragment key={i}>{Object.prototype.hasOwnProperty.call(delen, stuk) ? delen[stuk] : `{${stuk}}`}</Fragment>
      : <Fragment key={i}>{stuk}</Fragment>,
  )
}
