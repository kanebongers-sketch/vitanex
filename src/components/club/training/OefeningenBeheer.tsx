'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { filterNaarParams, filterOefeningen, type OefeningFilter } from '@/lib/club/training/filter'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL, NIVEAU_LABEL, PATROON_LABEL, SPIERGROEP_LABEL, ZONE_LABEL } from '@/lib/club/training/typen'
import { OefeningFilters } from './OefeningFilters'
import { OefeningFormulier } from './OefeningFormulier'
import { Zijpaneel } from './Zijpaneel'

interface OefeningenBeheerProps {
  oefeningen: Oefening[]
  beginFilter: OefeningFilter
}

/** De bibliotheek: zoeken (toets /), filteren, toevoegen en bewerken in een zijpaneel. */
export function OefeningenBeheer({ oefeningen, beginFilter }: OefeningenBeheerProps) {
  const [filter, setFilter] = useState(beginFilter)
  const [bewerk, setBewerk] = useState<Oefening | 'nieuw' | null>(null)
  const zoek = useRef<HTMLInputElement>(null)
  const zichtbaar = useMemo(() => filterOefeningen(oefeningen, filter), [oefeningen, filter])
  const sluit = useCallback(() => setBewerk(null), [])

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      const doel = e.target instanceof HTMLElement ? e.target : null
      if (e.key !== '/' || doel?.closest('input, textarea, select, [contenteditable]')) return
      e.preventDefault()
      zoek.current?.focus()
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [])

  function zetFilter(f: OefeningFilter) {
    setFilter(f)
    // Filters in de URL, zonder de pagina opnieuw te laden: deelbaar en terug werkt.
    const params = new URLSearchParams(window.location.search)
    for (const k of ['zoek', 'spier', 'mat', 'niveau', 'inactief']) params.delete(k)
    for (const [k, v] of Object.entries(filterNaarParams(f))) params.set(k, v)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }

  return (
    <section className="club-training-bieb" aria-label="Oefeningen">
      <div className="club-training-balk">
        <OefeningFilters ref={zoek} filter={filter} onFilter={zetFilter} metInactiefKeuze zoekLabel="Zoeken (toets /)" />
        <button type="button" className="club-knop club-knop--primair" onClick={() => setBewerk('nieuw')}>
          <Plus aria-hidden size={16} /> Nieuwe oefening
        </button>
      </div>
      <p className="club-hint" aria-live="polite">{zichtbaar.length} van {oefeningen.length} oefeningen</p>
      {zichtbaar.length === 0 ? (
        <p className="club-leeg">{oefeningen.length === 0 ? 'De bibliotheek is nog leeg. Voeg een oefening toe.' : 'Geen oefeningen met deze filters.'}</p>
      ) : (
        <ul className="club-training-oefraster">
          {zichtbaar.map((o) => (
            <li key={o.id}>
              <button type="button" className={`club-training-oefkaart ${o.actief ? '' : 'is-inactief'}`} onClick={() => setBewerk(o)}>
                <span className="club-training-oefkaart-kop">
                  <span className="club-training-oefnaam">{o.naam}</span>
                  <span className={`club-training-niveau club-training-niveau--${o.niveau}`} title={NIVEAU_LABEL[o.niveau]} aria-label={NIVEAU_LABEL[o.niveau]}>
                    {[1, 2, 3].map((n) => <i key={n} data-aan={n <= o.niveau} />)}
                  </span>
                </span>
                <span className="club-rij-sub">
                  {SPIERGROEP_LABEL[o.spiergroep]} · {MATERIAAL_LABEL[o.materiaal]}
                  {o.patroon ? ` · ${PATROON_LABEL[o.patroon]}` : ''}
                </span>
                {o.uitleg && <span className="club-training-oefuitleg">{o.uitleg}</span>}
                {o.belast.length > 0 && <span className="club-training-belast">Let op: {o.belast.map((z) => ZONE_LABEL[z].toLowerCase()).join(', ')}</span>}
                {!o.actief && <span className="club-chip club-chip--uit">Inactief</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {bewerk && (
        <Zijpaneel titel={bewerk === 'nieuw' ? 'Nieuwe oefening' : bewerk.naam} boventitel="Oefening" onSluit={sluit}>
          <OefeningFormulier key={bewerk === 'nieuw' ? 'nieuw' : bewerk.id} oefening={bewerk === 'nieuw' ? null : bewerk} onKlaar={sluit} />
        </Zijpaneel>
      )}
    </section>
  )
}
