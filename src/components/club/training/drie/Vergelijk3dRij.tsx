'use client'

import { useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import { Oefening3dLazy } from './Oefening3dLazy'
import type { Stand3d } from './Oefening3d'

// Een rij op de vergelijkpagina voor een oefening die alleen een 3D-versie heeft
// (nog geen eigen tekening): uitleg, het huidige beeld en het 3D-beeld.

interface Vergelijk3dRijProps {
  naam: string
  toont: readonly string[]
  /** Het huidige beeld (server-weergave van OefeningBeeld). */
  huidig: ReactNode
}

export function Vergelijk3dRij({ naam, toont, huidig }: Vergelijk3dRijProps) {
  const [stand, setStand] = useState<Stand3d>('speelt')
  const speelt = stand === 'speelt'
  const kopId = `ill-3d-${naam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section className="club-beelden-rij" aria-labelledby={kopId}>
      <div className="club-beelden-info">
        <h2 id={kopId}>{naam}</h2>
        <p className="club-beelden-meta">Alleen in 3D · lus van een herhaling</p>
        <ul className="club-beelden-toont">
          {toont.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div className="club-beelden-knoppen" role="group" aria-label={`Bediening ${naam}`}>
          <button type="button" className="club-knop club-knop--klein club-knop--primair" aria-pressed={speelt} onClick={() => setStand(speelt ? 'begin' : 'speelt')}>
            {speelt ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
            {speelt ? 'Pauze' : 'Afspelen'}
          </button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'begin'} onClick={() => setStand('begin')}>Begin</button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'eind'} onClick={() => setStand('eind')}>Eind</button>
        </div>
      </div>
      <div className="club-beelden-huidig">
        <p className="club-beelden-label">Nu (RepDB)</p>
        {huidig}
      </div>
      <div className="club-beelden-nieuw">
        <p className="club-beelden-label">Nieuw in 3D (prototype)</p>
        <Oefening3dLazy naam={naam} stand={stand} label={`${naam} in 3D`} />
      </div>
    </section>
  )
}
