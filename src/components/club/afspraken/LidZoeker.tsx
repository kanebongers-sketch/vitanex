'use client'

import { useEffect, useId, useState } from 'react'
import { Search, X } from 'lucide-react'
import { haal } from './haal'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

// Een lid zoeken op naam, lidnummer, e-mail of telefoon (vanaf 2 tekens).

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

function treffersUit(data: Record<string, unknown>): Treffer[] {
  const lijst = Array.isArray(data.leden) ? data.leden : []
  return lijst.flatMap((l: unknown) => {
    if (typeof l !== 'object' || l === null) return []
    const r = l as Record<string, unknown>
    return typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam, lidnummer: typeof r.lidnummer === 'string' ? r.lidnummer : null }] : []
  })
}

export function LidZoeker({ vestiging, gekozen, onKies }: Props) {
  const id = useId()
  const [term, setTerm] = useState('')
  const [treffers, setTreffers] = useState<Treffer[]>([])
  const [fout, setFout] = useState<string | null>(null)
  const zoekt = term.trim().length >= 2
  const t = useTekst(AFSPRAKEN).lidZoeker

  useEffect(() => {
    if (!zoekt) return
    const afbreken = new AbortController()
    const wacht = setTimeout(() => {
      void haal(`/api/club/afspraken/leden?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(term.trim())}`, afbreken.signal).then((uit) => {
        if (afbreken.signal.aborted) return
        setTreffers(uit.ok ? treffersUit(uit.data) : [])
        setFout(uit.ok ? null : uit.fout || null)
      })
    }, 220)
    return () => {
      clearTimeout(wacht)
      afbreken.abort()
    }
  }, [term, zoekt, vestiging])

  if (gekozen) {
    return (
      <div className="club-veld">
        <span>{t.lid}</span>
        <div className="club-afspraken-lid-gekozen">
          <strong>{gekozen.naam}</strong>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => onKies(null)} aria-label={t.weghalen(gekozen.naam)}>
            <X size={15} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="club-veld club-afspraken-zoeker">
      <label htmlFor={id}>{t.lid}</label>
      <div className="club-afspraken-zoekveld">
        <Search size={15} aria-hidden />
        <input
          id={id}
          className="club-invoer"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.plaats}
          autoComplete="off"
          aria-describedby={`${id}-uitleg`}
        />
      </div>
      <p id={`${id}-uitleg`} className="club-sr" aria-live="polite">
        {zoekt ? t.gevonden(treffers.length) : t.minTekens}
      </p>
      {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
      {zoekt && treffers.length > 0 ? (
        <ul className="club-afspraken-treffers">
          {treffers.map((lid) => (
            <li key={lid.id}>
              <button type="button" onClick={() => onKies({ id: lid.id, naam: lid.naam })}>
                <strong>{lid.naam}</strong>
                {lid.lidnummer ? <span>{lid.lidnummer}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {zoekt && treffers.length === 0 && !fout ? <p className="club-afspraken-tijden-stand">{t.geenLeden}</p> : null}
    </div>
  )
}
