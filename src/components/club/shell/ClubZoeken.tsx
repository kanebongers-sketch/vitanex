'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ToetsEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { filterZoek, ledenItems, ledenUitAntwoord, normaliseerZoek, zoekHref, zoektLeden, type LidTreffer, type ZoekItem } from './zoeken'
import { zoekIcoon } from './iconen'
import { TellerBadge } from './TellerBadge'
import { onderdeelTeller, type Tellers } from '@/lib/club/menu/tellers'

// Zoeken in de balk: een knop (en Ctrl K of /) opent een venster dat alles
// vindt waar je heen mag: leden (wie Leden mag), de onderdelen en de
// instel-pagina's die niet in het menu staan. Pijltjes kiezen, Enter opent,
// Escape sluit. Op de telefoon is het vergrootglas altijd bovenin te zien.

interface ClubZoekenProps {
  items: readonly ZoekItem[]
  vestiging: string | null
  /** Mag deze persoon leden zien (recht Leden, onderdeel aan)? Dan zoekt het venster ook leden. */
  ledenZoeken: boolean
  /** De tellers van het menu, naast het onderdeel in de resultaten. */
  tellers?: Tellers
}

/** Het event waarmee een ander onderdeel het zoekvenster opent (openClubZoeken). */
export const OPEN_ZOEKEN = 'club:zoeken'

/** Open het zoekvenster van de balk (zelfde als Ctrl K). */
export function openClubZoeken(): void {
  window.dispatchEvent(new Event(OPEN_ZOEKEN))
}

/** Alleen / zonder Ctrl, Alt of Cmd opent het zoeken (Ctrl / en dergelijke blijven van de browser). */
function isSlashSneltoets(e: KeyboardEvent): boolean {
  return e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey && !inInvoer(e.target)
}

/**
 * Maak alles buiten het venster onbereikbaar (inert): langs de hele keten van
 * ouders naar body krijgen de broers en zussen inert. Geeft een functie die
 * het weer opheft (alleen wat wij zelf inert maakten).
 */
function maakRestInert(venster: HTMLElement): () => void {
  const gezet: Element[] = []
  for (let el: HTMLElement | null = venster; el && el !== document.body; el = el.parentElement) {
    for (const broer of Array.from(el.parentElement?.children ?? [])) {
      if (broer !== el && !broer.hasAttribute('inert')) {
        broer.setAttribute('inert', '')
        gezet.push(broer)
      }
    }
  }
  return () => gezet.forEach((e) => e.removeAttribute('inert'))
}

/** Typt de gebruiker in een veld? Dan is / gewoon een teken. */
export function inInvoer(doel: EventTarget | null): boolean {
  const el = doel as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function ClubZoeken({ items, vestiging, ledenZoeken, tellers = {} }: ClubZoekenProps) {
  const [open, setOpen] = useState(false)
  const knop = useRef<HTMLButtonElement>(null)
  // Bij sluiten gaat de focus terug naar de knop (na het opheffen van inert).
  const sluit = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => knop.current?.focus())
  }, [])
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      const sneltoets = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)
      if (sneltoets || isSlashSneltoets(e)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    // Een zoekveld elders op de pagina (zoals in het instellingencentrum) opent hetzelfde venster.
    const opVraag = () => setOpen(true)
    window.addEventListener('keydown', opToets)
    window.addEventListener(OPEN_ZOEKEN, opVraag)
    return () => {
      window.removeEventListener('keydown', opToets)
      window.removeEventListener(OPEN_ZOEKEN, opVraag)
    }
  }, [])
  const t = useTekst(MENU).zoeken
  const tekst = ledenZoeken ? t.knopLeden : t.knop
  return (
    <>
      <button ref={knop} type="button" className="club-zoekknop" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-keyshortcuts="Control+K /" title={`${tekst} (${t.sneltoets})`}>
        <Search aria-hidden size={18} />
        <span className="club-zoekknop-tekst">{tekst}</span>
        <kbd className="club-zoekknop-toets" aria-hidden>{t.sneltoets}</kbd>
      </button>
      {open && <ZoekVenster items={items} vestiging={vestiging} ledenZoeken={ledenZoeken} tellers={tellers} onSluit={sluit} />}
    </>
  )
}

interface ZoekVensterProps extends ClubZoekenProps {
  onSluit: () => void
}

interface LedenAntwoord {
  vraag: string
  leden: LidTreffer[]
  fout: boolean
}

/** Zoekt leden (met een korte pauze na het typen) zodra de vraag lang genoeg is. */
function useLedenZoeken(vraag: string, vestiging: string | null, aan: boolean): { antwoord: LedenAntwoord | null; laden: boolean; actief: boolean } {
  const [antwoord, setAntwoord] = useState<LedenAntwoord | null>(null)
  const sleutel = normaliseerZoek(vraag)
  const actief = aan && !!vestiging && zoektLeden(vraag)
  useEffect(() => {
    if (!actief || !vestiging) return
    const stop = new AbortController()
    const wacht = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/club/leden/zoek?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(sleutel)}`, { signal: stop.signal })
        const data: unknown = await res.json().catch(() => null)
        setAntwoord({ vraag: sleutel, leden: res.ok ? ledenUitAntwoord(data) : [], fout: !res.ok })
      } catch (fout) {
        if (!stop.signal.aborted) setAntwoord({ vraag: sleutel, leden: [], fout: fout instanceof Error })
      }
    }, 180)
    return () => {
      stop.abort()
      window.clearTimeout(wacht)
    }
  }, [actief, sleutel, vestiging])
  const huidig = actief && antwoord?.vraag === sleutel ? antwoord : null
  return { antwoord: huidig, laden: actief && !huidig, actief }
}

function ZoekVenster({ items, vestiging, ledenZoeken, tellers = {}, onSluit }: ZoekVensterProps) {
  const router = useRouter()
  const scherm = useRef<HTMLDivElement>(null)
  const veld = useRef<HTMLInputElement>(null)
  const lijstId = useId()
  const [vraag, setVraag] = useState('')
  const [gekozen, setGekozen] = useState(0)
  const leden = useLedenZoeken(vraag, vestiging, ledenZoeken)
  const taal = useTaal()
  const t = useTekst(MENU).zoeken
  const treffers = useMemo(() => {
    const menu = filterZoek(items, vraag)
    if (!leden.actief) return menu
    const lid = ledenItems(leden.antwoord?.leden ?? [], vraag, taal)
    // Typ je de naam van een onderdeel ("check"), dan staat dat bovenaan; anders eerst de leden.
    const menuEerst = !!menu[0] && normaliseerZoek(menu[0].label).startsWith(normaliseerZoek(vraag))
    return menuEerst ? [...menu, ...lid] : [...lid, ...menu]
  }, [items, vraag, leden.actief, leden.antwoord, taal])
  const actief = Math.min(gekozen, Math.max(treffers.length - 1, 0))

  // Zolang het venster open is, is de pagina eronder niet tabbaar.
  useEffect(() => (scherm.current ? maakRestInert(scherm.current) : undefined), [])

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

  const plaatshouder = ledenZoeken ? t.plaatsLeden : t.plaats
  return (
    <div ref={scherm} className="club-zoek-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <div className="club-zoek" role="dialog" aria-modal="true" aria-label={t.venster}>
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
            placeholder={plaatshouder}
            aria-label={plaatshouder}
            role="combobox"
            aria-expanded="true"
            aria-controls={lijstId}
            aria-activedescendant={treffers[actief] ? `${lijstId}-${treffers[actief].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <button type="button" className="club-knop club-knop--stil club-zoek-sluit" aria-label={t.sluiten} onClick={onSluit}>
            <X aria-hidden size={20} />
          </button>
        </div>
        <p className="club-zoek-status" role="status">
          {leden.laden ? t.ledenLaden : leden.antwoord?.fout ? t.ledenFout : leden.actief && leden.antwoord?.leden.length === 0 ? t.geenLid : ''}
        </p>
        {treffers.length === 0 ? (
          <p className="club-zoek-leeg">{t.nietsGevonden(vraag)}</p>
        ) : (
          <ul id={lijstId} className="club-zoek-lijst" role="listbox" aria-label={t.resultaten}>
            {treffers.map((item, n) => {
              const Icoon = zoekIcoon(item.icoon)
              const teller = onderdeelTeller(item.teller, tellers)
              return (
              <li
                key={item.id}
                id={`${lijstId}-${item.id}`}
                role="option"
                aria-selected={n === actief}
                className="club-zoek-item"
                onMouseEnter={() => setGekozen(n)}
                onClick={() => ga(item)}
              >
                <span className="club-zoek-icoon" aria-hidden>
                  <Icoon size={17} strokeWidth={1.75} />
                </span>
                <span className="club-zoek-tekst">
                  <strong>
                    {item.label}
                    {teller && <TellerBadge tellers={[teller]} klein />}
                  </strong>
                  {item.uitleg ? <small>{item.uitleg}</small> : null}
                </span>
                <span className="club-zoek-plek">
                  {item.plek}
                  {item.toets ? <kbd className="club-zoek-toets">{item.toets}</kbd> : null}
                </span>
                {n === actief && <CornerDownLeft aria-hidden size={15} className="club-zoek-enter" />}
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
