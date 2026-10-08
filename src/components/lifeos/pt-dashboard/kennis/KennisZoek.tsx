'use client'

import Link from 'next/link'
import { useDeferredValue, useId, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { markeer, trefferHref, zoek, zoekTermen, type ZoekDocument } from '@/lib/lifeos/pt-dashboard/kennis'

// Zoeken in de hele kennisbank, direct in de browser: de server geeft de platte
// tekst mee (alleen na de pincode), zodat elke toetsaanslag meteen resultaat
// geeft, ook met een slechte verbinding in de club. Treffers linken naar de sectie.

const MAX = 20

function Snippet({ tekst, termen }: { tekst: string; termen: string[] }) {
  return (
    <span className="ffk-treffer-snippet">
      {markeer(tekst, termen).map((d, i) => (d.treffer ? <mark key={i}>{d.tekst}</mark> : <span key={i}>{d.tekst}</span>))}
    </span>
  )
}

export function KennisZoek({ code, docs }: { code: string; docs: ZoekDocument[] }) {
  const [query, setQuery] = useState('')
  const uitgesteld = useDeferredValue(query)
  const id = useId()
  const termen = useMemo(() => zoekTermen(uitgesteld), [uitgesteld])
  const treffers = useMemo(() => zoek(docs, uitgesteld, MAX), [docs, uitgesteld])
  const actief = termen.length > 0

  const status = !actief
    ? ''
    : treffers.length === 0
      ? `Niets gevonden voor "${uitgesteld.trim()}". Probeer een ander woord.`
      : `${treffers.length === MAX ? `De eerste ${MAX}` : treffers.length} ${treffers.length === 1 ? 'resultaat' : 'resultaten'}`

  return (
    <section className="ffk-zoek" aria-labelledby={`${id}-kop`}>
      <h2 id={`${id}-kop`} className="sr-only">
        Zoeken
      </h2>
      <form role="search" className="ptd-zoek" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={`${id}-veld`} className="sr-only">
          Zoek in de kennisbank
        </label>
        <Search className="ptd-zoek-icoon" size={18} aria-hidden />
        <input
          id={`${id}-veld`}
          type="search"
          className="ptd-invoer ptd-invoer--zoek ffk-zoekveld"
          placeholder="Zoek in protocollen, guide, handleiding…"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
          }}
          aria-describedby={`${id}-status`}
        />
        {query ? (
          <button type="button" className="ffk-wis" onClick={() => setQuery('')} aria-label="Zoekveld leegmaken">
            <X size={16} aria-hidden />
          </button>
        ) : null}
      </form>
      <p id={`${id}-status`} className="ptd-hint" role="status" aria-live="polite">
        {status}
      </p>
      {actief && treffers.length > 0 ? (
        <ul className="ptd-lijst ffk-treffers">
          {treffers.map((t) => (
            <li key={`${t.slug}#${t.sectieId ?? ''}`}>
              <Link href={trefferHref(code, t)} className="ffk-treffer">
                <span className="ffk-treffer-waar">
                  {t.titel}
                  {t.kop ? <span className="ffk-treffer-kop"> · {t.kop}</span> : null}
                </span>
                {t.snippet ? <Snippet tekst={t.snippet} termen={termen} /> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
