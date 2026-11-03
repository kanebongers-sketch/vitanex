'use client'

import { useEffect, useId, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Optioneel een lid kiezen bij het uitvoeren van een werkwijze (nieuw lid,
// klacht, ongeval). Zoekt via /api/club/leden/zoek: alleen leden van de eigen
// sportschool in de gekozen vestiging. Wie Leden niet mag, krijgt een korte
// uitleg en laat het veld leeg; de uitvoering zelf blijft gewoon werken.

export interface GekozenLid {
  id: string
  naam: string
}

interface Props {
  vestiging: string
  gekozen: GekozenLid | null
  onKies: (lid: GekozenLid | null) => void
}

interface Treffer extends GekozenLid {
  lidnummer: string | null
}

type Uitkomst = { ok: true; leden: Treffer[] } | { ok: false; geenToegang: boolean }

function treffersUit(data: unknown): Treffer[] {
  const lijst = typeof data === 'object' && data !== null && Array.isArray((data as { leden?: unknown }).leden) ? (data as { leden: unknown[] }).leden : []
  return lijst.flatMap((l) => {
    if (typeof l !== 'object' || l === null) return []
    const r = l as Record<string, unknown>
    return typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam, lidnummer: typeof r.lidnummer === 'string' ? r.lidnummer : null }] : []
  })
}

async function zoek(vestiging: string, term: string, signaal: AbortSignal): Promise<Uitkomst | null> {
  try {
    const res = await fetch(`/api/club/leden/zoek?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(term)}`, { signal: signaal, cache: 'no-store' })
    if (res.status === 403 || res.status === 404) return { ok: false, geenToegang: true }
    if (!res.ok) return { ok: false, geenToegang: false }
    return { ok: true, leden: treffersUit(await res.json().catch(() => null)) }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    return { ok: false, geenToegang: false }
  }
}

export function LidKiezer({ vestiging, gekozen, onKies }: Props) {
  const id = useId()
  const t = useTekst(PRIKBORD).uitvoeren.lid
  const [term, setTerm] = useState('')
  const [treffers, setTreffers] = useState<Treffer[]>([])
  const [fout, setFout] = useState<'geenToegang' | 'zoekFout' | null>(null)
  const [geladen, setGeladen] = useState(false)
  const zoekt = term.trim().length >= 2

  useEffect(() => {
    if (!zoekt || !vestiging) return
    const afbreken = new AbortController()
    const wacht = setTimeout(() => {
      void zoek(vestiging, term.trim(), afbreken.signal).then((uit) => {
        if (!uit || afbreken.signal.aborted) return
        setTreffers(uit.ok ? uit.leden : [])
        setFout(uit.ok ? null : uit.geenToegang ? 'geenToegang' : 'zoekFout')
        setGeladen(true)
      })
    }, 220)
    return () => {
      clearTimeout(wacht)
      afbreken.abort()
    }
  }, [term, zoekt, vestiging])

  function kies(lid: Treffer) {
    onKies({ id: lid.id, naam: lid.naam })
    setTerm('')
    setTreffers([])
    setGeladen(false)
  }

  if (gekozen) {
    return (
      <div className="club-veld pb-smal">
        <span id={`${id}-label`}>{t.label}</span>
        <div className="pb-lid-gekozen" role="group" aria-labelledby={`${id}-label`}>
          <strong>{gekozen.naam}</strong>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => onKies(null)} aria-label={t.weghalen(gekozen.naam)}>
            <X size={15} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  const status = !zoekt ? t.minTekens : geladen && !fout ? t.gevonden(treffers.length) : ''

  return (
    <div className="club-veld pb-lid-kiezer">
      <label htmlFor={id}>{t.label}</label>
      <div className="pb-lid-zoekveld">
        <Search size={15} aria-hidden />
        <input
          id={id}
          type="search"
          className="club-invoer"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setGeladen(false)
          }}
          placeholder={t.plaats}
          autoComplete="off"
          maxLength={60}
          aria-describedby={`${id}-uitleg ${id}-stand`}
        />
      </div>
      <span id={`${id}-uitleg`} className="club-hint">
        {t.uitleg}
      </span>
      <p id={`${id}-stand`} className="club-sr" aria-live="polite">
        {status}
      </p>
      {zoekt && fout ? (
        <p className="club-hint" role="status">
          {t[fout]}
        </p>
      ) : null}
      {zoekt && treffers.length > 0 ? (
        <ul className="pb-lid-treffers" aria-label={t.gevonden(treffers.length)}>
          {treffers.map((lid) => (
            <li key={lid.id}>
              <button type="button" onClick={() => kies(lid)} aria-label={t.kies(lid.naam)}>
                <strong>{lid.naam}</strong>
                {lid.lidnummer ? <span>{lid.lidnummer}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {zoekt && geladen && !fout && treffers.length === 0 ? <p className="club-hint">{t.geenLeden}</p> : null}
    </div>
  )
}
