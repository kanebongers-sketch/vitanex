'use client'

import { useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { stuur } from './api'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

export interface GekozenLid {
  id: string
  naam: string
  lidnummer: string | null
}

interface LidKiezerProps {
  vestiging: string
  onKies: (lid: GekozenLid) => void
  label?: string
  autoFocus?: boolean
}

function leesLeden(data: Record<string, unknown>): GekozenLid[] {
  if (!Array.isArray(data.leden)) return []
  return data.leden.flatMap((l: unknown) => {
    if (typeof l !== 'object' || l === null) return []
    const r = l as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.naam !== 'string') return []
    return [{ id: r.id, naam: r.naam, lidnummer: typeof r.lidnummer === 'string' ? r.lidnummer : null }]
  })
}

/** Zoek een lid op naam, lidnummer, e-mail of telefoon. Pijltjes en Enter werken. */
export function LidKiezer({ vestiging, onKies, label, autoFocus }: LidKiezerProps) {
  const id = useId()
  const t = useTekst(CLUB_TRAINING).lidKiezer
  const [term, setTerm] = useState('')
  const [leden, setLeden] = useState<GekozenLid[]>([])
  const [actief, setActief] = useState(0)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const wacht = useRef<ReturnType<typeof setTimeout> | null>(null)

  function zoek(waarde: string) {
    setTerm(waarde)
    if (wacht.current) clearTimeout(wacht.current)
    if (waarde.trim().length < 2) {
      setLeden([])
      setBezig(false)
      return
    }
    setBezig(true)
    wacht.current = setTimeout(async () => {
      const u = await stuur(`/leden?v=${encodeURIComponent(vestiging)}&q=${encodeURIComponent(waarde)}`, 'GET')
      setBezig(false)
      if (!u.ok) return setFout(u.fout)
      setFout(null)
      setLeden(leesLeden(u.data))
      setActief(0)
    }, 200)
  }

  function kies(lid: GekozenLid) {
    onKies(lid)
    setTerm('')
    setLeden([])
  }

  function toets(e: React.KeyboardEvent<HTMLInputElement>) {
    if (leden.length === 0) return
    if (e.key === 'ArrowDown') setActief((a) => Math.min(a + 1, leden.length - 1))
    else if (e.key === 'ArrowUp') setActief((a) => Math.max(a - 1, 0))
    else if (e.key === 'Enter') kies(leden[actief])
    else return
    e.preventDefault()
  }

  return (
    <div className="club-training-lidkiezer">
      <label className="club-veld" htmlFor={id}>
        <span>{label ?? t.label}</span>
        <span className="club-training-zoekveld">
          <Search aria-hidden size={16} />
          <input
            id={id}
            className="club-invoer"
            value={term}
            onChange={(e) => zoek(e.target.value)}
            onKeyDown={toets}
            placeholder={t.plaats}
            autoComplete="off"
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={leden.length > 0}
            aria-controls={`${id}-lijst`}
            aria-activedescendant={leden.length > 0 ? `${id}-${actief}` : undefined}
          />
        </span>
      </label>
      {fout && <p className="club-fout">{fout}</p>}
      {leden.length > 0 && (
        <ul id={`${id}-lijst`} role="listbox" className="club-training-lidlijst">
          {leden.map((l, i) => (
            <li key={l.id} id={`${id}-${i}`} role="option" aria-selected={i === actief}>
              <button type="button" onClick={() => kies(l)} onMouseEnter={() => setActief(i)}>
                <span>{l.naam}</span>
                {l.lidnummer && <span className="club-zacht">{l.lidnummer}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {term.trim().length >= 2 && leden.length === 0 && !fout && !bezig && <p className="club-hint">{t.geen}</p>}
    </div>
  )
}
