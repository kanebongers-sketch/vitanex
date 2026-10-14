'use client'

import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import { keuzeNaarWaarde, waardeNaarKeuze, type OefeningFilter } from '@/lib/club/training/filter'
import { SPIER_GROEP_LABEL, SPIER_GROEPEN, SPIER_INFO, spierenInGroep } from '@/lib/club/training/spieren'
import { MATERIAAL_LABEL, MATERIALEN, NIVEAU_LABEL, NIVEAUS, isMateriaal, isNiveau } from '@/lib/club/training/typen'

interface OefeningFiltersProps {
  filter: OefeningFilter
  onFilter: (f: OefeningFilter) => void
  /** Ook de keuzes "inactieve tonen" en "zonder beeld" (alleen in de bibliotheek). */
  metInactiefKeuze?: boolean
  zoekLabel?: string
}

/** Zoeken plus filters op spier (of een hele groep), materiaal en niveau. */
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
        <span>Spier</span>
        <select className="club-invoer" value={keuzeNaarWaarde(filter.spier)} onChange={(e) => zet({ spier: waardeNaarKeuze(e.target.value) })}>
          <option value="">Alle spieren</option>
          {SPIER_GROEPEN.map((g) => (
            <optgroup key={g} label={SPIER_GROEP_LABEL[g]}>
              <option value={`g:${g}`}>{SPIER_GROEP_LABEL[g]}: alles</option>
              {spierenInGroep(g).map((sp) => <option key={sp} value={`s:${sp}`}>{SPIER_INFO[sp].naam} ({SPIER_INFO[sp].ook})</option>)}
            </optgroup>
          ))}
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
      <div className="club-training-vinken">
        <label className="club-training-vink">
          <input type="checkbox" checked={filter.ookMeewerkend} onChange={(e) => zet({ ookMeewerkend: e.target.checked })} />
          <span>Ook meewerkend</span>
        </label>
        {metInactiefKeuze && (
          <>
            <label className="club-training-vink">
              <input type="checkbox" checked={filter.metInactief} onChange={(e) => zet({ metInactief: e.target.checked })} />
              <span>Ook inactieve</span>
            </label>
            <label className="club-training-vink">
              <input type="checkbox" checked={filter.zonderBeeld} onChange={(e) => zet({ zonderBeeld: e.target.checked })} />
              <span>Zonder beeld</span>
            </label>
          </>
        )}
      </div>
    </div>
  )
})
