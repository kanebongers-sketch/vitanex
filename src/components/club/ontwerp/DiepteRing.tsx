import type { ReactNode } from 'react'
import { ringDeel } from '@/lib/club/ontwerp/reeks'

// Een voortgangsring met diepte, in gewone SVG: een verzonken spoor (schaduw
// aan de binnenkant), de boog in de accentkleur van de sportschool met een
// lichtrand erop, en het getal in het midden. Werkt zonder JavaScript en zonder
// WebGL. De ledenapp gebruikt alleen deze ring (geen three.js meer voor
// decoratie); bij reduced motion staat het intekenen stil (ontwerp.css).

interface DiepteRingProps {
  gedaan: number
  totaal: number
  /** Voor schermlezers: wat de ring betekent. */
  label: string
  /** Wat in het midden staat; standaard "gedaan / totaal". */
  midden?: ReactNode
  maat?: number
}

const STRAAL = 42
const OMTREK = 2 * Math.PI * STRAAL

export function DiepteRing({ gedaan, totaal, label, midden, maat = 148 }: DiepteRingProps) {
  const deel = ringDeel(gedaan, totaal)
  return (
    <div className="club-ring" style={{ width: maat, height: maat }} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="club-ring-spoor" cx="50" cy="50" r={STRAAL} />
        <circle className="club-ring-spoor-licht" cx="50" cy="50" r={STRAAL} />
        {deel > 0 && (
          <>
            <circle className="club-ring-boog" cx="50" cy="50" r={STRAAL} strokeDasharray={`${OMTREK * deel} ${OMTREK}`} />
            <circle className="club-ring-glans" cx="50" cy="50" r={STRAAL} strokeDasharray={`${OMTREK * deel} ${OMTREK}`} />
          </>
        )}
      </svg>
      <span className="club-ring-midden" aria-hidden>
        {midden ?? (
          <>
            <strong>{gedaan}</strong>
            <span>/{totaal}</span>
          </>
        )}
      </span>
    </div>
  )
}
