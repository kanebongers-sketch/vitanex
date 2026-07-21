import { CheckCircle2, Circle } from 'lucide-react'
import type { Taak } from '@/lib/lifeos/taken/taken'

// De taken van één project: titel + afgevinkt-status. Open eerst, dan wat al af
// is — je wil zien wat er nóg moet. De status staat niet alleen in kleur of
// doorhaling: een verborgen tekstlabel zegt het ook in woorden voor een
// screenreader.

interface TakenLijstProps {
  taken: readonly Taak[]
}

export function TakenLijst({ taken }: TakenLijstProps) {
  if (taken.length === 0) {
    return <p className="proj-taken-leeg">Geen taken in dit project.</p>
  }

  // Immutable sorteren: open (false → 0) vóór afgevinkt (true → 1).
  const geordend = [...taken].sort((a, b) => Number(a.klaar) - Number(b.klaar))

  return (
    <ul className="proj-taken">
      {geordend.map((taak) => (
        <li key={taak.id} className={`proj-taak${taak.klaar ? ' proj-taak--klaar' : ''}`}>
          {taak.klaar ? (
            <CheckCircle2
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              className="proj-taak-ico proj-taak-ico--klaar"
            />
          ) : (
            <Circle size={15} strokeWidth={2} aria-hidden="true" className="proj-taak-ico" />
          )}
          <span className="proj-taak-titel">{taak.titel}</span>
          <span className="proj-sr">{taak.klaar ? '(afgevinkt)' : '(open)'}</span>
        </li>
      ))}
    </ul>
  )
}
