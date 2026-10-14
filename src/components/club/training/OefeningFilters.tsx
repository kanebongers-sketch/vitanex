'use client'

import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import type { OefeningFilter } from '@/lib/club/training/filter'
import {
  MATERIAAL_LABEL, MATERIALEN, NIVEAU_LABEL, NIVEAUS, SPIERGROEP_LABEL, SPIERGROEPEN,
  isMateriaal, isNiveau, isSpiergroep,
} from '@/lib/club/training/typen'

interface OefeningFiltersProps {
  filter: OefeningFilter
  onFilter: (f: OefeningFilter) => void
  /** Ook de keuze "inactieve tonen" (alleen in de bibliotheek). */
  metInactiefKeuze?: boolean
  zoekLabel?: string
}

/** Zoeken plus filters op spiergroep, materiaal en niveau. */
export const OefeningFilters = forwardRef<HTMLInputElement, OefeningFiltersProps>(function OefeningFilters(
  { filter, onFilter, metInactiefKeuze, zoekLabel = 'Zoek oefening' },
  zoekRef,
) {
  const zet = (deel: Partial<OefeningFilter>) => onFilter({ ...filter, ...deel })
  return (
    <div className="club-training-filters">
      <label className="club-veld club-training-filter-zoek">
        <span>{zoekLabel}</span>
        <span className="club-training-zoekveld">
          <Search aria-hidden size={16} />
          <input ref={zoekRef} className="club-invoer" type="search" value={filter.zoek} onChange={(e) => zet({ zoek: e.target.value })} placeholder="Naam van de oefening" />
        </span>
      </label>
      <label className="club-veld">
        <span>Spiergroep</span>
        <select className="club-invoer" value={filter.spiergroep ?? ''} onChange={(e) => zet({ spiergroep: isSpiergroep(e.target.value) ? e.target.value : null })}>
          <option value="">Alle</option>
          {SPIERGROEPEN.map((s) => <option key={s} value={s}>{SPIERGROEP_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="club-veld">
        <span>Materiaal</span>
        <select className="club-invoer" value={filter.materiaal ?? ''} onChange={(e) => zet({ materiaal: isMateriaal(e.target.value) ? e.target.value : null })}>
          <option value="">Alles</option>
          {MATERIALEN.map((m) => <option key={m} value={m}>{MATERIAAL_LABEL[m]}</option>)}
        </select>
      </label>
      <label className="club-veld">
        <span>Niveau</span>
        <select
          className="club-invoer"
          value={filter.niveau ?? ''}
          onChange={(e) => {
            const n = Number(e.target.value)
            zet({ niveau: isNiveau(n) ? n : null })
          }}
        >
          <option value="">Alle</option>
          {NIVEAUS.map((n) => <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>)}
        </select>
      </label>
      {metInactiefKeuze && (
        <label className="club-training-vink">
          <input type="checkbox" checked={filter.metInactief} onChange={(e) => zet({ metInactief: e.target.checked })} />
          <span>Ook inactieve</span>
        </label>
      )}
    </div>
  )
})
