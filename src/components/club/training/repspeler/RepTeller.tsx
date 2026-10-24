'use client'

import type { RefObject } from 'react'
import { toonKlok } from '@/lib/club/app/sets'
import type { RepPlan, SegmentSoort } from '@/lib/club/training/repspeler/typen'

// De teller naast het beeld: groot "7 / 15" (of de tijd die over is bij een
// plank), het fasewoord en een ring die per herhaling vol loopt. De ring tekent
// de speler zelf per frame (stroke-dashoffset via de ref, geen React-state).
// Schermlezers horen alleen een nieuwe herhaling, niet elke fase.

export interface Weergave {
  rep: number
  gedaan: number
  label: string
  segment: SegmentSoort
  segmentIndex: number
  overSec: number
  piek: boolean
}

interface RepTellerProps {
  plan: RepPlan
  weergave: Weergave
  status: 'wacht' | 'loopt' | 'pauze' | 'klaar'
  ring: RefObject<SVGCircleElement | null>
  setNr: number | null
  sets: number | null
}

function woord(status: RepTellerProps['status'], label: string): string {
  if (status === 'wacht') return 'Klaar?'
  if (status === 'klaar') return 'Klaar'
  if (status === 'pauze') return 'Pauze'
  return label
}

function meldingVan(plan: RepPlan, w: Weergave, status: RepTellerProps['status']): string {
  if (status === 'wacht') return ''
  if (plan.soort === 'vasthouden') {
    if (status === 'klaar') return 'Tijd is om, set klaar'
    return w.overSec % 10 === 0 ? `Nog ${w.overSec} seconden` : ''
  }
  if (status === 'klaar') return `${plan.reps} van ${plan.reps}, set klaar`
  return `Herhaling ${w.rep} van ${plan.reps}`
}

export function RepTeller({ plan, weergave: w, status, ring, setNr, sets }: RepTellerProps) {
  const vast = plan.soort === 'vasthouden'
  const nu = status === 'wacht' ? 0 : status === 'klaar' && !vast ? plan.reps : w.rep
  return (
    <div className="club-rep-teller" data-segment={status === 'loopt' ? w.segment : undefined}>
      {setNr !== null && (
        <p className="club-rep-set">
          Set {setNr}
          {sets ? <span> van {sets}</span> : null}
        </p>
      )}
      <div className="club-rep-ring">
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle className="club-rep-ring-baan" cx="60" cy="60" r="54" />
          <circle
            ref={ring} className="club-rep-ring-vol" cx="60" cy="60" r="54"
            pathLength={100} strokeDasharray="100" strokeDashoffset={status === 'klaar' ? 0 : 100} transform="rotate(-90 60 60)"
          />
        </svg>
        <p className="club-rep-getal" aria-hidden>
          {vast ? (
            <strong>{toonKlok(status === 'wacht' ? plan.totaal : w.overSec)}</strong>
          ) : (
            <>
              <strong>{nu}</strong>
              <span>/ {plan.reps}</span>
            </>
          )}
        </p>
      </div>
      <p className="club-rep-fase" aria-hidden>{woord(status, w.label)}</p>
      <p className="club-sr" aria-live="polite" aria-atomic="true">{meldingVan(plan, w, status)}</p>
    </div>
  )
}
