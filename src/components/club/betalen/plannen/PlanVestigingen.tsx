'use client'

import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Op welke vestigingen een plan te koop is: alle (ook nieuwe) of een keuze.

interface Props {
  alle: boolean
  gekozen: readonly string[]
  onAlle: (alle: boolean) => void
  onKies: (lijst: string[]) => void
}

export function PlanVestigingen({ alle, gekozen, onAlle, onKies }: Props) {
  const vestigingen = useVestigingen()
  const t = useTekst(BETALEN).prijsContract
  if (vestigingen.length < 2) return null
  const wissel = (slug: string) => onKies(gekozen.includes(slug) ? gekozen.filter((x) => x !== slug) : [...gekozen, slug])
  return (
    <div className="club-plan-vestigingen">
      <label className="club-lidm-vink">
        <input type="checkbox" checked={alle} onChange={(e) => onAlle(e.target.checked)} /> {t.alleVestigingen}
      </label>
      {!alle && (
        <div className="club-lidm-vinkrij">
          {vestigingen.map((v) => (
            <label key={v.sleutel} className="club-lidm-vink">
              <input type="checkbox" checked={gekozen.includes(v.sleutel)} onChange={() => wissel(v.sleutel)} /> {v.naam}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
