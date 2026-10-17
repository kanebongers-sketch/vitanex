'use client'

import { Plus, X } from 'lucide-react'
import { MAX_MAALTIJD_NAAM, MAX_MAALTIJDEN, MAX_VOORBEELDEN, type Maaltijd } from '@/lib/club/voeding/model'

// Een eenvoudige dagindeling: naam, tijd en voorbeeldproducten als vrije tekst.

const STANDAARD_DAG: readonly Maaltijd[] = [
  { naam: 'Ontbijt', tijd: '07:30', voorbeelden: '' },
  { naam: 'Lunch', tijd: '12:30', voorbeelden: '' },
  { naam: 'Tussendoor', tijd: '15:30', voorbeelden: '' },
  { naam: 'Avondeten', tijd: '18:30', voorbeelden: '' },
]

interface MaaltijdenVeldProps {
  maaltijden: Maaltijd[]
  onWijzig: (maaltijden: Maaltijd[]) => void
}

export function MaaltijdenVeld({ maaltijden, onWijzig }: MaaltijdenVeldProps) {
  const zet = (i: number, deel: Partial<Maaltijd>) => onWijzig(maaltijden.map((m, j) => (j === i ? { ...m, ...deel } : m)))
  const weg = (i: number) => onWijzig(maaltijden.filter((_, j) => j !== i))
  const vol = maaltijden.length >= MAX_MAALTIJDEN

  return (
    <div className="club-voeding-blok">
      {maaltijden.map((m, i) => (
        <div key={i} className="club-voeding-maaltijd">
          <input className="club-invoer club-voeding-tijd" type="time" value={m.tijd ?? ''} aria-label={`Tijd van maaltijd ${i + 1}`} onChange={(e) => zet(i, { tijd: e.target.value || null })} />
          <input className="club-invoer" value={m.naam} maxLength={MAX_MAALTIJD_NAAM} placeholder="Bijvoorbeeld Ontbijt" aria-label={`Naam van maaltijd ${i + 1}`} onChange={(e) => zet(i, { naam: e.target.value })} />
          <button type="button" className="club-voeding-weg" onClick={() => weg(i)} aria-label={`Maaltijd ${m.naam || i + 1} weghalen`}>
            <X size={16} aria-hidden />
          </button>
          <textarea
            className="club-invoer"
            rows={2}
            value={m.voorbeelden}
            maxLength={MAX_VOORBEELDEN}
            placeholder="Voorbeeldproducten, bijvoorbeeld kwark met havermout en fruit"
            aria-label={`Voorbeelden bij ${m.naam || `maaltijd ${i + 1}`}`}
            onChange={(e) => zet(i, { voorbeelden: e.target.value })}
          />
        </div>
      ))}
      <div className="club-voeding-acties">
        <button type="button" className="club-knop club-knop--klein" disabled={vol} onClick={() => onWijzig([...maaltijden, { naam: '', tijd: null, voorbeelden: '' }])}>
          <Plus size={14} aria-hidden /> Maaltijd
        </button>
        {maaltijden.length === 0 && (
          <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => onWijzig(STANDAARD_DAG.map((m) => ({ ...m })))}>
            Begin met vier vaste momenten
          </button>
        )}
      </div>
    </div>
  )
}
