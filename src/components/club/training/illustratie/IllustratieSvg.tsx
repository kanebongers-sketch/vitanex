import type { CSSProperties } from 'react'
import type { Laag } from '@/lib/club/training/illustratie/laag'
import type { Animatie } from '@/lib/club/training/illustratie/scene'
import type { Kader } from '@/lib/club/training/illustratie/scene'
import { keyTimes, padStijl as padStijlRuw, viewBox, waarden } from '@/lib/club/training/illustratie/svg'

// PadStijl bevat CSS-variabelen; React kent die niet als CSSProperties.
const padStijl = (l: Laag): CSSProperties => padStijlRuw(l) as unknown as CSSProperties

// De tekening zelf: een SVG met een pad per laag. Stilstaand (lagen) of
// bewegend (animatie): dan krijgt elk pad een SMIL-animatie op zijn vorm. Dat
// draait in de browser zonder JavaScript per beeld, ook als losse afbeelding.
// Kleuren via CSS-variabelen (illustratie.css). Geen hooks: werkt op de server.

interface StilProps {
  lagen: readonly Laag[]
  kader: Kader
  label: string
}

export function IllustratieStil({ lagen, kader, label }: StilProps) {
  return (
    <svg viewBox={viewBox(kader)} role="img" aria-label={label} focusable="false">
      {lagen.map((l) => (
        <path key={l.sleutel} d={l.d} style={padStijl(l)} />
      ))}
    </svg>
  )
}

interface BewegendProps {
  animatie: Animatie
  label: string
}

export function IllustratieBewegend({ animatie: a, label }: BewegendProps) {
  const tijden = keyTimes(a)
  return (
    <svg viewBox={viewBox(a.kader)} role="img" aria-label={label} focusable="false">
      {a.sporen.map(({ laag, paden }) => (
        <path key={laag.sleutel} d={paden[0]} style={padStijl(laag)}>
          <animate attributeName="d" dur={`${a.duur}s`} repeatCount="indefinite" calcMode="linear" keyTimes={tijden} values={waarden(a, paden)} />
        </path>
      ))}
    </svg>
  )
}
