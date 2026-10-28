'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { bronnenVan, telBeelden } from '@/lib/club/training/beeld'
import { filterNaarParams, filterOefeningen, type OefeningFilter } from '@/lib/club/training/filter'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL, NIVEAU_LABEL, PATROON_LABEL, ZONE_LABEL } from '@/lib/club/training/typen'
import { BeeldBron, OefeningBeeld, RepdbVermelding } from './OefeningBeeld'
import { OefeningDetail } from './OefeningDetail'
import { OefeningFilters } from './OefeningFilters'
import { OefeningFormulier } from './OefeningFormulier'
import { SpierChips } from './SpierChips'
import { Spierkaart } from './Spierkaart'
import { Zijpaneel } from './Zijpaneel'

interface OefeningenBeheerProps {
  oefeningen: Oefening[]
  beginFilter: OefeningFilter
}

type Open = { soort: 'nieuw' } | { soort: 'detail' | 'bewerk'; oefening: Oefening } | null

const FILTER_SLEUTELS = ['zoek', 'spier', 'groep', 'mee', 'mat', 'niveau', 'inactief', 'beeld']

/** De bibliotheek: zoeken (toets /), filteren, bekijken met tekening, toevoegen en bewerken in een zijpaneel. */
export function OefeningenBeheer({ oefeningen, beginFilter }: OefeningenBeheerProps) {
  const [filter, setFilter] = useState(beginFilter)
  const [open, setOpen] = useState<Open>(null)
  const zoek = useRef<HTMLInputElement>(null)
  // Gearchiveerde oefeningen (migratie 465) horen niet meer bij de bibliotheek: alleen nog leesbaar in bestaande schema's.
  const bibliotheek = useMemo(() => oefeningen.filter((o) => !o.gearchiveerd), [oefeningen])
  const zichtbaar = useMemo(() => filterOefeningen(bibliotheek, filter), [bibliotheek, filter])
  const telling = useMemo(() => telBeelden(bibliotheek.filter((o) => o.actief)), [bibliotheek])
  const bronnen = useMemo(() => bronnenVan(bibliotheek.map((o) => o.beeld)), [bibliotheek])
  const sluit = useCallback(() => setOpen(null), [])

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
    for (const k of FILTER_SLEUTELS) params.delete(k)
    for (const [k, v] of Object.entries(filterNaarParams(f))) params.set(k, v)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }

  return (
    <section className="club-training-bieb" aria-label="Oefeningen">
      <div className="club-training-balk">
        <OefeningFilters ref={zoek} filter={filter} onFilter={zetFilter} metInactiefKeuze zoekLabel="Zoeken (toets /)" />
        <button type="button" className="club-knop club-knop--primair" onClick={() => setOpen({ soort: 'nieuw' })}>
          <Plus aria-hidden size={16} /> Nieuwe oefening
        </button>
      </div>
      <div className="club-training-biebinfo">
        <p className="club-hint" aria-live="polite">{zichtbaar.length} van {bibliotheek.length} oefeningen</p>
        <p className="club-training-beeldteller">
          <strong>{telling.met}</strong> van {telling.totaal} actieve oefeningen hebben een beeld
        </p>
        <BeeldBron bronnen={bronnen} />
      </div>
      {zichtbaar.length === 0 ? (
        <p className="club-leeg">{bibliotheek.length === 0 ? 'De bibliotheek is nog leeg. Voeg een oefening toe.' : 'Geen oefeningen met deze filters.'}</p>
      ) : (
        <ul className="club-training-oefraster">
          {zichtbaar.map((o) => (
            <li key={o.id}>
              <OefeningKaart oefening={o} onOpen={() => setOpen({ soort: 'detail', oefening: o })} />
            </li>
          ))}
        </ul>
      )}
      {bronnen.includes('repdb') && <RepdbVermelding />}
      {open && <OefeningPaneel open={open} onBewerk={(o) => setOpen({ soort: 'bewerk', oefening: o })} onSluit={sluit} />}
    </section>
  )
}

function OefeningKaart({ oefening: o, onOpen }: { oefening: Oefening; onOpen: () => void }) {
  return (
    <button type="button" className={`club-training-oefkaart ${o.actief ? '' : 'is-inactief'}`} onClick={onOpen}>
      <span className="club-training-oefkaart-beelden">
        <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="middel" decoratief />
        <Spierkaart naam={o.naam} primair={o.spierenPrimair} secundair={o.spierenSecundair} formaat="klein" decoratief />
      </span>
      <span className="club-training-oefkaart-tekst">
        <span className="club-training-oefkaart-kop">
          <span className="club-training-oefnaam">{o.naam}</span>
          <span className={`club-training-niveau club-training-niveau--${o.niveau}`} title={NIVEAU_LABEL[o.niveau]} aria-label={NIVEAU_LABEL[o.niveau]}>
            {[1, 2, 3].map((n) => <i key={n} data-aan={n <= o.niveau} />)}
          </span>
        </span>
        <SpierChips primair={o.spierenPrimair} spiergroep={o.spiergroep} />
        <span className="club-rij-sub">
          {MATERIAAL_LABEL[o.materiaal]}
          {o.patroon ? ` · ${PATROON_LABEL[o.patroon]}` : ''}
        </span>
        {o.uitleg && <span className="club-training-oefuitleg">{o.uitleg}</span>}
        {o.belast.length > 0 && <span className="club-training-belast">Let op: {o.belast.map((z) => ZONE_LABEL[z].toLowerCase()).join(', ')}</span>}
        {!o.actief && <span className="club-chip club-chip--uit">Inactief</span>}
      </span>
    </button>
  )
}

interface OefeningPaneelProps {
  open: NonNullable<Open>
  onBewerk: (o: Oefening) => void
  onSluit: () => void
}

function OefeningPaneel({ open, onBewerk, onSluit }: OefeningPaneelProps) {
  if (open.soort === 'nieuw') {
    return (
      <Zijpaneel titel="Nieuwe oefening" boventitel="Oefening" onSluit={onSluit}>
        <OefeningFormulier key="nieuw" oefening={null} onKlaar={onSluit} />
      </Zijpaneel>
    )
  }
  const o = open.oefening
  return (
    <Zijpaneel titel={o.naam} boventitel={open.soort === 'bewerk' ? 'Oefening bewerken' : 'Oefening'} onSluit={onSluit}>
      {open.soort === 'detail' ? (
        <OefeningDetail oefening={o} onBewerk={() => onBewerk(o)} />
      ) : (
        <OefeningFormulier key={o.id} oefening={o} onKlaar={onSluit} />
      )}
    </Zijpaneel>
  )
}
