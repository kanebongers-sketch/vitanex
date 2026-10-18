'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ToetsEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { filterZoek, zoekHref, type ZoekItem } from './zoeken'

// Zoeken in de balk: een knop (en Ctrl K of /) opent een venster dat alles
// vindt waar je heen mag, ook de instel-pagina's die niet in het menu staan.
// Pijltjes kiezen, Enter opent, Escape sluit.

interface ClubZoekenProps {
  items: readonly ZoekItem[]
  vestiging: string | null
}

/** Typt de gebruiker in een veld? Dan is / gewoon een teken. */
function inInvoer(doel: EventTarget | null): boolean {
  const el = doel as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function ClubZoeken({ items, vestiging }: ClubZoekenProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      const sneltoets = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)
      if (sneltoets || (e.key === '/' && !inInvoer(e.target))) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [])
  return (
    <>
      <button type="button" className="club-zoekknop" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-keyshortcuts="Control+K /">
        <Search aria-hidden size={16} />
        <span className="club-zoekknop-tekst">Zoeken</span>
        <kbd className="club-zoekknop-toets" aria-hidden>Ctrl K</kbd>
      </button>
      {open && <ZoekVenster items={items} vestiging={vestiging} onSluit={() => setOpen(false)} />}
    </>
  )
}

interface ZoekVensterProps extends ClubZoekenProps {
  onSluit: () => void
}

function ZoekVenster({ items, vestiging, onSluit }: ZoekVensterProps) {
  const router = useRouter()
  const veld = useRef<HTMLInputElement>(null)
  const lijstId = useId()
  const [vraag, setVraag] = useState('')
  const [gekozen, setGekozen] = useState(0)
  const treffers = useMemo(() => filterZoek(items, vraag), [items, vraag])
  const actief = Math.min(gekozen, Math.max(treffers.length - 1, 0))

  useEffect(() => {
    veld.current?.focus()
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])

  function ga(item: ZoekItem | undefined) {
    if (!item) return
    onSluit()
    router.push(zoekHref(item, vestiging))
  }

  function opToets(e: ToetsEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const stap = e.key === 'ArrowDown' ? 1 : -1
      setGekozen((actief + stap + treffers.length) % Math.max(treffers.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      ga(treffers[actief])
    }
  }

  return (
    <div className="club-zoek-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <div className="club-zoek" role="dialog" aria-modal="true" aria-label="Zoeken in Club">
        <div className="club-zoek-veld">
          <Search aria-hidden size={18} />
          <input
            ref={veld}
            type="search"
            value={vraag}
            onChange={(e) => {
              setVraag(e.target.value)
              setGekozen(0)
            }}
            onKeyDown={opToets}
            placeholder="Zoek een onderdeel of instelling"
            aria-label="Zoek een onderdeel of instelling"
            role="combobox"
            aria-expanded="true"
            aria-controls={lijstId}
            aria-activedescendant={treffers[actief] ? `${lijstId}-${treffers[actief].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="club-knop club-knop--stil" aria-label="Zoeken sluiten" onClick={onSluit}>
            <X aria-hidden size={18} />
          </button>
        </div>
        {treffers.length === 0 ? (
          <p className="club-zoek-leeg" role="status">Niets gevonden voor &ldquo;{vraag}&rdquo;. Probeer een ander woord, of kijk bij Hulp.</p>
        ) : (
          <ul id={lijstId} className="club-zoek-lijst" role="listbox" aria-label="Resultaten">
            {treffers.map((item, n) => (
              <li
                key={item.id}
                id={`${lijstId}-${item.id}`}
                role="option"
                aria-selected={n === actief}
                className="club-zoek-item"
                onMouseEnter={() => setGekozen(n)}
                onClick={() => ga(item)}
              >
                <span className="club-zoek-tekst">
                  <strong>{item.label}</strong>
                  <small>{item.uitleg}</small>
                </span>
                <span className="club-zoek-plek">{item.plek}</span>
                {n === actief && <CornerDownLeft aria-hidden size={15} className="club-zoek-enter" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
