'use client'

import { useEffect, useId, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { stuur, useClubActie } from './vraag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

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

function leesWaarschuwing(data: unknown, standaard: string): string | null {
  if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'waarschuwing') return null
  return 'waarschuwing' in data && typeof data.waarschuwing === 'string' ? data.waarschuwing : standaard
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
  const t = useTekst(ROOSTER).toevoegen
  const zoekFoutTekst = t.zoekFout

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
        if (!ctrl.signal.aborted) setZoekFout(e instanceof Error && e.name !== 'AbortError' ? zoekFoutTekst : null)
      }
    }, 220)
    return () => {
      clearTimeout(wacht)
      ctrl.abort()
    }
  }, [term, vestiging, zoekFoutTekst])

  async function boek(lid: Treffer, toch = false) {
    setMelding(null)
    setWaarschuwing(null)
    const uit = await voerUit(() => stuur('/api/club/rooster/reserveringen', 'POST', { lesId, lidId: lid.id, bron: 'balie', toch }))
    if (!uit.ok) return
    const tekst = leesWaarschuwing(uit.data, t.pastNiet)
    if (tekst) {
      setWaarschuwing({ lid, tekst })
      return
    }
    const opWachtlijst = typeof uit.data === 'object' && uit.data !== null && 'status' in uit.data && uit.data.status === 'wachtlijst'
    setMelding(opWachtlijst ? t.opWachtlijst(lid.naam) : t.ingeschreven(lid.naam))
    setTerm('')
    setResultaat({ term: '', leden: [] })
  }

  const q = term.trim()
  const zichtbaar = q.length >= 2 && resultaat.term === q ? resultaat.leden : []
  return (
    <div className="club-rooster-toevoegen">
      <label className="club-veld" htmlFor={veldId}>
        <span>{t.label}{isVol ? t.vol : ''}</span>
      </label>
      <div className="club-rooster-zoekveld">
        <Search aria-hidden size={16} />
        <input
          id={veldId}
          className="club-invoer"
          type="search"
          autoComplete="off"
          placeholder={t.plaats}
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
              {t.toch}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => setWaarschuwing(null)}>
              {t.niet}
            </button>
          </div>
        </div>
      )}
      {zichtbaar.length > 0 && (
        <ul className="club-lijst club-rooster-treffers">
          {zichtbaar.map((lid) => (
            <li key={lid.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{lid.naam}</span>
                <span className="club-rij-sub">{[lid.lidnummer, lid.status].filter(Boolean).join(' · ')}</span>
              </span>
              <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => boek(lid)}>
                <UserPlus aria-hidden size={14} />
                {t.boek}
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.length >= 2 && resultaat.term === q && zichtbaar.length === 0 && !zoekFout && <p className="club-hint">{t.geenLeden}</p>}
    </div>
  )
}
