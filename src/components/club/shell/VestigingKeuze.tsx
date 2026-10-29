'use client'

import { Building2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { useVestigingen } from './VestigingenContext'

// De keuze van de vestiging, in de balk (pc en tablet) en in het menupaneel
// (telefoon). Wisselen houdt je op hetzelfde onderdeel.

interface VestigingKeuzeProps {
  vestiging: Vestiging | null
  /** Zet " (pilot)" achter de standaardvestiging (alleen bij Fit Factory). */
  pilot: boolean
  onWissel: (v: string) => void
}

export function VestigingKeuze({ vestiging, pilot, onWissel }: VestigingKeuzeProps) {
  const vestigingen = useVestigingen()
  const t = useTekst(MENU)
  if (!vestiging || vestigingen.length === 0) return null
  // Een vestiging: niets te kiezen, alleen laten zien waar je bent.
  if (vestigingen.length === 1) {
    return (
      <span className="club-vestiging club-vestiging--vast">
        <Building2 aria-hidden size={16} />
        <span>{vestigingen[0].naam}</span>
      </span>
    )
  }
  return (
    <label className="club-vestiging">
      <Building2 aria-hidden size={16} />
      <span className="club-sr">{t.kop.vestiging}</span>
      <select value={vestiging} onChange={(e) => onWissel(e.target.value)}>
        {vestigingen.map((v) => (
          <option key={v.sleutel} value={v.sleutel}>
            {v.naam}
            {pilot && v.standaard ? ` ${t.kop.pilot}` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
