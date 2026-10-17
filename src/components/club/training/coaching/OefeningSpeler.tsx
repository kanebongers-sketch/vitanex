'use client'

import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import type { OefeningBeelden } from '@/lib/club/training/beeld'
import { OefeningBeeld } from '../OefeningBeeld'
import './coaching.css'

// De bewegende illustratie groot, met bediening zoals bij een video: afspelen
// of pauzeren, en de begin- of eindhouding los vasthouden om rustig te bekijken.
// Klikken op het beeld zelf zet de beweging stil of weer aan (een snelkoppeling
// voor de muis; de echte bediening zijn de knoppen eronder).
// Bij prefers-reduced-motion staan beide houdingen naast elkaar en is er niets
// te bedienen (zie coaching.css). Geef een key per oefening mee, zodat de stand
// niet blijft hangen bij de volgende.

type Stand = 'loop' | 'start' | 'eind'

interface OefeningSpelerProps {
  naam: string
  beeld: OefeningBeelden | null
}

const STANDEN: { stand: Exclude<Stand, 'loop'>; label: string }[] = [
  { stand: 'start', label: 'Begin' },
  { stand: 'eind', label: 'Eind' },
]

export function OefeningSpeler({ naam, beeld }: OefeningSpelerProps) {
  const [stand, setStand] = useState<Stand>('loop')
  const beweegt = beeld !== null && !beeld.enkel
  if (!beweegt) return <OefeningBeeld naam={naam} beeld={beeld} formaat="groot" />

  const speelt = stand === 'loop'
  const wissel = () => setStand(speelt ? 'start' : 'loop')
  return (
    <figure className="club-speler" data-stand={stand}>
      <button type="button" className="club-speler-beeld" onClick={wissel} tabIndex={-1} aria-hidden>
        <OefeningBeeld naam={naam} beeld={beeld} formaat="groot" decoratief />
        {stand !== 'loop' && <span className="club-speler-stand">{stand === 'start' ? 'Begin' : 'Eind'}</span>}
      </button>
      <div className="club-speler-bediening" role="group" aria-label={`Beweging van ${naam}`}>
        <button type="button" className="club-speler-knop club-speler-knop--spelen" onClick={wissel}>
          {speelt ? <Pause aria-hidden size={16} /> : <Play aria-hidden size={16} />}
          {speelt ? 'Pauze' : 'Afspelen'}
        </button>
        <span className="club-speler-standen">
          {STANDEN.map((s) => (
            <button key={s.stand} type="button" className="club-speler-knop" aria-pressed={stand === s.stand} onClick={() => setStand(s.stand)}>
              {s.label}
            </button>
          ))}
        </span>
      </div>
    </figure>
  )
}
