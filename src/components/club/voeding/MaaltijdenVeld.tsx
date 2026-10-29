'use client'

import { Plus, X } from 'lucide-react'
import { MAX_MAALTIJD_NAAM, MAX_MAALTIJDEN, MAX_VOORBEELDEN, type Maaltijd } from '@/lib/club/voeding/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

// Een eenvoudige dagindeling: naam, tijd en voorbeeldproducten als vrije tekst.

/** De tijden van de vier vaste momenten; de namen komen uit het woordenboek. */
const STANDAARD_TIJDEN = ['07:30', '12:30', '15:30', '18:30'] as const

interface MaaltijdenVeldProps {
  maaltijden: Maaltijd[]
  onWijzig: (maaltijden: Maaltijd[]) => void
}

export function MaaltijdenVeld({ maaltijden, onWijzig }: MaaltijdenVeldProps) {
  const zet = (i: number, deel: Partial<Maaltijd>) => onWijzig(maaltijden.map((m, j) => (j === i ? { ...m, ...deel } : m)))
  const weg = (i: number) => onWijzig(maaltijden.filter((_, j) => j !== i))
  const vol = maaltijden.length >= MAX_MAALTIJDEN
  const t = useTekst(VOEDING).maaltijdenVeld

  return (
    <div className="club-voeding-blok">
      {maaltijden.map((m, i) => (
        <div key={i} className="club-voeding-maaltijd">
          <input className="club-invoer club-voeding-tijd" type="time" value={m.tijd ?? ''} aria-label={t.tijd(i + 1)} onChange={(e) => zet(i, { tijd: e.target.value || null })} />
          <input className="club-invoer" value={m.naam} maxLength={MAX_MAALTIJD_NAAM} placeholder={t.naamVoorbeeld} aria-label={t.naam(i + 1)} onChange={(e) => zet(i, { naam: e.target.value })} />
          <button type="button" className="club-voeding-weg" onClick={() => weg(i)} aria-label={t.weghalen(m.naam || String(i + 1))}>
            <X size={16} aria-hidden />
          </button>
          <textarea
            className="club-invoer"
            rows={2}
            value={m.voorbeelden}
            maxLength={MAX_VOORBEELDEN}
            placeholder={t.voorbeeldenPlaats}
            aria-label={t.voorbeelden(m.naam || t.maaltijdNr(i + 1))}
            onChange={(e) => zet(i, { voorbeelden: e.target.value })}
          />
        </div>
      ))}
      <div className="club-voeding-acties">
        <button type="button" className="club-knop club-knop--klein" disabled={vol} onClick={() => onWijzig([...maaltijden, { naam: '', tijd: null, voorbeelden: '' }])}>
          <Plus size={14} aria-hidden /> {t.nieuw}
        </button>
        {maaltijden.length === 0 && (
          <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => onWijzig(STANDAARD_TIJDEN.map((tijd, i) => ({ naam: t.standaard[i] ?? '', tijd, voorbeelden: '' })))}>
            {t.vierMomenten}
          </button>
        )}
      </div>
    </div>
  )
}
