'use client'

import { useMemo, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { filterOefeningen, LEEG_FILTER, type OefeningFilter } from '@/lib/club/training/filter'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL, NIVEAU_LABEL, SPIERGROEP_LABEL } from '@/lib/club/training/typen'
import { OefeningFilters } from './OefeningFilters'
import { Zijpaneel } from './Zijpaneel'

interface OefeningKiezerProps {
  oefeningen: Oefening[]
  dagLabel: string
  /** Oefeningen die al op deze dag staan (met een vinkje). */
  opDag: ReadonlySet<string>
  onKies: (oefening: Oefening) => void
  onSluit: () => void
}

/** Oefeningen zoeken met filters en met een klik aan de dag toevoegen. Het paneel blijft open voor meer. */
export function OefeningKiezer({ oefeningen, dagLabel, opDag, onKies, onSluit }: OefeningKiezerProps) {
  const [filter, setFilter] = useState<OefeningFilter>(LEEG_FILTER)
  const lijst = useMemo(() => filterOefeningen(oefeningen, filter).slice(0, 60), [oefeningen, filter])

  return (
    <Zijpaneel titel={`Toevoegen aan ${dagLabel}`} boventitel="Oefening kiezen" onSluit={onSluit} breed>
      <OefeningFilters filter={filter} onFilter={setFilter} />
      {lijst.length === 0 ? (
        <p className="club-leeg">Geen oefeningen gevonden. Voeg nieuwe toe onder het tabblad Oefeningen.</p>
      ) : (
        <ul className="club-lijst club-training-kieslijst">
          {lijst.map((o) => {
            const al = opDag.has(o.id)
            return (
              <li key={o.id}>
                <button type="button" className="club-rij club-training-kiesrij" onClick={() => onKies(o)}>
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{o.naam}</span>
                    <span className="club-rij-sub">{SPIERGROEP_LABEL[o.spiergroep]} · {MATERIAAL_LABEL[o.materiaal]} · {NIVEAU_LABEL[o.niveau]}</span>
                  </span>
                  {al ? <Check aria-label="Staat al op deze dag" size={18} className="club-training-al" /> : <Plus aria-hidden size={18} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <button type="button" className="club-knop" onClick={onSluit}>Klaar</button>
    </Zijpaneel>
  )
}
