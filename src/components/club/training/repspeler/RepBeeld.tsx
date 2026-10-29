'use client'

import type { RefObject } from 'react'
import type { RepRender } from './render-bron'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { REPSPELER } from '@/lib/aiyourgym/taal/woorden/ledenapp/repspeler'

// Het beeld van de rep-speler: de poster (beginhouding) tot de frames klaar zijn
// en de speler loopt, daarna het canvas waarop de speler elk frame tekent.
// Bij minder beweging geen canvas: de beginhouding en het zwaarste punt wisselen
// als stilstaande beelden mee met de fases, zodat het tellen gewoon werkt.

interface RepBeeldProps {
  meet: (el: HTMLDivElement | null) => void
  canvas: RefObject<HTMLCanvasElement | null>
  render: RepRender
  naam: string
  minder: boolean
  /** Het canvas staat in beeld (frames klaar en de speler is begonnen). */
  zichtbaar: boolean
  /** Bij minder beweging: het zwaarste punt tonen in plaats van de beginhouding. */
  piek: boolean
  /** 0 tot 1: hoe ver de frames geladen zijn. */
  laadDeel: number
}

export function RepBeeld({ meet, canvas, render, naam, minder, zichtbaar, piek, laadDeel }: RepBeeldProps) {
  const t = REPSPELER[useTaal()]
  return (
    <div ref={meet} className="club-rep-beeld" data-canvas={zichtbaar || undefined} role="img" aria-label={t.beeld(naam)}>
      <span className="club-rep-vloer" aria-hidden />
      <img
        className="club-rep-still" src={render.poster} alt="" aria-hidden width={1080} height={1080}
        decoding="async" fetchPriority="high" data-weg={(zichtbaar || piek) || undefined}
      />
      {minder ? (
        <img className="club-rep-still" src={render.piek} alt="" aria-hidden width={1080} height={1080} decoding="async" data-weg={!piek || undefined} />
      ) : (
        <canvas ref={canvas} className="club-rep-doek" aria-hidden />
      )}
      {laadDeel < 1 && (
        <span className="club-rep-laden" aria-hidden>
          <span style={{ transform: `scaleX(${laadDeel})` }} />
        </span>
      )}
    </div>
  )
}
