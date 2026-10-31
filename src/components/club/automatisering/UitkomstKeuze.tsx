'use client'

import { useId } from 'react'
import { LID_UITKOMSTEN, type LidUitkomst } from '@/lib/club/behoud/uitkomst'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'

// Na Klaar op een opvolgtaak: wat leverde het op? Een klik op een uitkomst
// rondt de taak af (vaste lijst, src/lib/club/behoud/uitkomst.ts).

interface UitkomstKeuzeProps {
  bezig: boolean
  onKies: (uitkomst: LidUitkomst) => void
  onAnnuleer: () => void
}

export function UitkomstKeuze({ bezig, onKies, onAnnuleer }: UitkomstKeuzeProps) {
  const w = useTekst(BEHOUD_DATA).uitkomst
  const id = useId()
  return (
    <div className="club-opvolg-uitkomst" role="group" aria-labelledby={`${id}-kop`}>
      <p id={`${id}-kop`} className="club-label">{w.kop}</p>
      <div className="club-acties">
        {LID_UITKOMSTEN.map((u) => (
          <button key={u} type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => onKies(u)}>
            {w.lid[u]}
          </button>
        ))}
        <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={onAnnuleer}>
          {w.annuleer}
        </button>
      </div>
    </div>
  )
}
