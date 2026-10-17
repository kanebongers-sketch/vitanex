'use client'

import { useEffect, useId, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { stuur, useClubActie } from './vraag'

// De balie boekt een lid in deze les: zoeken op naam, lidnummer, e-mail of
// telefoon, dan "Boek". Is de les vol, dan komt het lid op de wachtlijst.
// Past de les niet bij het lidmaatschap, dan eerst een waarschuwing met
// "Toch boeken" (de balie beslist; de API logt het).

interface Treffer {
  id: string
  naam: string
  lidnummer: string | null
  status: string
}

function leesWaarschuwing(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'waarschuwing') return null
  return 'waarschuwing' in data && typeof data.waarschuwing === 'string' ? data.waarschuwing : 'Deze les past niet bij het lidmaatschap.'
}

function leesTreffers(data: unknown): Treffer[] {
  if (typeof data !== 'object' || data === null || !('leden' in data) || !Array.isArray(data.leden)) return []
  return data.leden.flatMap((l: unknown) => {
    if (typeof l !== 'object' || l === null) return []
    const r = l as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.naam !== 'string') return []
    return [{ id: r.id, naam: r.naam, lidnummer: typeof r.lidnummer === 'string' ? r.lidnummer : null, status: typeof r.status === 'string' ? r.status : '' }]
  })
}

export function LidToevoegen({ lesId, vestiging, isVol }: { lesId: string; vestiging: string; isVol: boolean }) {
  const [term, setTerm] = useState('')
  const [resultaat, setResultaat] = useState<{ term: string; leden: Treffer[] }>({ term: '', leden: [] })
  const [zoekFout, setZoekFout] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [waarschuwing, setWaarschuwing] = useState<{ lid: Treffer; tekst: string } | null>(null)
  const { bezig, fout, voerUit } = useClubActie()
  const veldId = useId()

  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) return
    const ctrl = new AbortController()
    const wacht = setTimeout(async () => {
      try {
        const res = await fetch(`/api/club/rooster/leden?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error(String(res.status))
        setResultaat({ term: q, leden: leesTreffers(await res.json()) })
        setZoekFout(null)
      } catch (e: unknown) {
        if (!ctrl.signal.aborted) setZoekFout(e instanceof Error && e.name !== 'AbortError' ? 'Zoeken is niet gelukt.' : null)
      }
    }, 220)
    return () => {
      clearTimeout(wacht)
      ctrl.abort()
    }
  }, [term, vestiging])

  async function boek(t: Treffer, toch = false) {
    setMelding(null)
    setWaarschuwing(null)
    const uit = await voerUit(() => stuur('/api/club/rooster/reserveringen', 'POST', { lesId, lidId: t.id, bron: 'balie', toch }))
    if (!uit.ok) return
    const tekst = leesWaarschuwing(uit.data)
    if (tekst) {
      setWaarschuwing({ lid: t, tekst })
      return
    }
    const opWachtlijst = typeof uit.data === 'object' && uit.data !== null && 'status' in uit.data && uit.data.status === 'wachtlijst'
    setMelding(opWachtlijst ? `${t.naam} staat op de wachtlijst.` : `${t.naam} is ingeschreven.`)
    setTerm('')
    setResultaat({ term: '', leden: [] })
  }

  const q = term.trim()
  const zichtbaar = q.length >= 2 && resultaat.term === q ? resultaat.leden : []
  return (
    <div className="club-rooster-toevoegen">
      <label className="club-veld" htmlFor={veldId}>
        <span>Lid toevoegen{isVol ? ' (komt op de wachtlijst)' : ''}</span>
      </label>
      <div className="club-rooster-zoekveld">
        <Search aria-hidden size={16} />
        <input
          id={veldId}
          className="club-invoer"
          type="search"
          autoComplete="off"
          placeholder="Naam, lidnummer of telefoon"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      {zoekFout && <p className="club-fout" role="alert">{zoekFout}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {melding && <p className="club-melding club-melding--ok" role="status">{melding}</p>}
      {waarschuwing && (
        <div className="club-melding club-melding--fout club-rooster-vorm" role="alert">
          <p>
            <strong>{waarschuwing.lid.naam}:</strong> {waarschuwing.tekst}
          </p>
          <div className="club-rooster-vorm-knoppen">
            <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => boek(waarschuwing.lid, true)}>
              Toch boeken
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => setWaarschuwing(null)}>
              Niet boeken
            </button>
          </div>
        </div>
      )}
      {zichtbaar.length > 0 && (
        <ul className="club-lijst club-rooster-treffers">
          {zichtbaar.map((t) => (
            <li key={t.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{t.naam}</span>
                <span className="club-rij-sub">{[t.lidnummer, t.status].filter(Boolean).join(' · ')}</span>
              </span>
              <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => boek(t)}>
                <UserPlus aria-hidden size={14} />
                Boek
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.length >= 2 && resultaat.term === q && zichtbaar.length === 0 && !zoekFout && <p className="club-hint">Geen leden gevonden.</p>}
    </div>
  )
}
