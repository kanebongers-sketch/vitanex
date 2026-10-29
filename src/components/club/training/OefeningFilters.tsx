'use client'

import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import { keuzeNaarWaarde, waardeNaarKeuze, type OefeningFilter } from '@/lib/club/training/filter'
import { SPIER_GROEPEN, spierenInGroep } from '@/lib/club/training/spieren'
import { MATERIALEN, NIVEAUS, isMateriaal, isNiveau } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'

interface OefeningFiltersProps {
  filter: OefeningFilter
  onFilter: (f: OefeningFilter) => void
  /** Ook de keuzes "inactieve tonen" en "zonder beeld" (alleen in de bibliotheek). */
  metInactiefKeuze?: boolean
  zoekLabel?: string
}

/** Zoeken plus filters op spier (of een hele groep), materiaal en niveau. */
export const OefeningFilters = forwardRef<HTMLInputElement, OefeningFiltersProps>(function OefeningFilters(
  { filter, onFilter, metInactiefKeuze, zoekLabel },
  zoekRef,
) {
  const zet = (deel: Partial<OefeningFilter>) => onFilter({ ...filter, ...deel })
  const t = useTekst(CLUB_TRAINING).filters
  const l = useTekst(TRAINING_LABELS)
  return (
    <div className="club-training-filters">
      <label className="club-veld club-training-filter-zoek">
        <span>{zoekLabel ?? t.zoek}</span>
        <span className="club-training-zoekveld">
          <Search aria-hidden size={16} />
          <input ref={zoekRef} className="club-invoer" type="search" value={filter.zoek} onChange={(e) => zet({ zoek: e.target.value })} placeholder={t.zoekPlaats} />
        </span>
      </label>
      <label className="club-veld">
        <span>{t.spier}</span>
        <select className="club-invoer" value={keuzeNaarWaarde(filter.spier)} onChange={(e) => zet({ spier: waardeNaarKeuze(e.target.value) })}>
          <option value="">{t.alleSpieren}</option>
          {SPIER_GROEPEN.map((g) => (
            <optgroup key={g} label={l.spierGroep[g]}>
              <option value={`g:${g}`}>{t.groepAlles(l.spierGroep[g])}</option>
              {spierenInGroep(g).map((sp) => <option key={sp} value={`s:${sp}`}>{l.spier[sp]} ({l.spierOok[sp]})</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="club-veld">
        <span>{t.materiaal}</span>
        <select className="club-invoer" value={filter.materiaal ?? ''} onChange={(e) => zet({ materiaal: isMateriaal(e.target.value) ? e.target.value : null })}>
          <option value="">{t.alles}</option>
          {MATERIALEN.map((m) => <option key={m} value={m}>{l.materiaal[m]}</option>)}
        </select>
      </label>
      <label className="club-veld">
        <span>{t.niveau}</span>
        <select
          className="club-invoer"
          value={filter.niveau ?? ''}
          onChange={(e) => {
            const n = Number(e.target.value)
            zet({ niveau: isNiveau(n) ? n : null })
          }}
        >
          <option value="">{t.alle}</option>
          {NIVEAUS.map((n) => <option key={n} value={n}>{l.niveau[n]}</option>)}
        </select>
      </label>
      <div className="club-training-vinken">
        <label className="club-training-vink">
          <input type="checkbox" checked={filter.ookMeewerkend} onChange={(e) => zet({ ookMeewerkend: e.target.checked })} />
          <span>{t.ookMeewerkend}</span>
        </label>
        {metInactiefKeuze && (
          <>
            <label className="club-training-vink">
              <input type="checkbox" checked={filter.metInactief} onChange={(e) => zet({ metInactief: e.target.checked })} />
              <span>{t.ookInactief}</span>
            </label>
            <label className="club-training-vink">
              <input type="checkbox" checked={filter.zonderBeeld} onChange={(e) => zet({ zonderBeeld: e.target.checked })} />
              <span>{t.zonderBeeld}</span>
            </label>
          </>
        )}
      </div>
    </div>
  )
})
