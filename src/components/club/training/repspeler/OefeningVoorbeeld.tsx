'use client'

import { useState, type ReactNode } from 'react'
import type { OefeningBeelden } from '@/lib/club/training/beeld'
import { OefeningSpeler } from '../coaching/OefeningSpeler'
import { RepSpeler } from './RepSpeler'
import { repRenderVoor } from './render-bron'

// Het grote oefenbeeld bij een oefening bekijken (bibliotheek, oefeningblad in
// de ledenapp): met een Blender-render de rep-speler in voorbeeldstand (zonder
// vastleggen), anders de bekende illustratie. Zonder schema speelt hij 10
// herhalingen op 2-0-2-0; met een schemaregel het echte voorschrift.

interface OefeningVoorbeeldProps {
  naam: string
  beeld: OefeningBeelden | null
  herhalingen?: string | null
  tijdSec?: number | null
  tempo?: string | null
  rustSec?: number | null
}

export function OefeningVoorbeeld({ naam, beeld, ...set }: OefeningVoorbeeldProps) {
  const render = repRenderVoor(naam)
  if (!render) return <OefeningSpeler naam={naam} beeld={beeld} />
  return <RepSpeler render={render} naam={naam} {...set} />
}

interface RenderDuimProps {
  naam: string
  /** Wat er staat als er geen render is (het gewone kleine beeld). */
  anders: ReactNode
}

/** Klein beeld in een lijst: de poster van de render, met de muis erop de lus. Zonder render het gewone beeld. */
export function RenderDuim({ naam, anders }: RenderDuimProps) {
  const [lus, setLus] = useState(false)
  const render = repRenderVoor(naam)
  if (!render) return <>{anders}</>
  return (
    <span className="club-rep-duim" aria-hidden onPointerEnter={() => setLus(true)}>
      <img src={render.posterKlein} alt="" width={52} height={52} loading="lazy" decoding="async" />
      {lus && <img className="club-rep-duim-lus" src={render.lusKlein} alt="" width={52} height={52} decoding="async" />}
    </span>
  )
}
