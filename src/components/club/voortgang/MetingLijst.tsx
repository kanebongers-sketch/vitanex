'use client'

import { useState } from 'react'
import { MEETWAARDEN, type Meting } from '@/lib/club/voortgang/meting'
import { sorteerPunten, type MeetPunt } from '@/lib/club/voortgang/tijdlijn'
import type { MedewerkerKeuze } from './MetingFormulier'
import { datumLang, getal } from './weergave'

interface MetingLijstProps {
  punten: readonly MeetPunt[]
  metingen: readonly Meting[]
  medewerkers: readonly MedewerkerKeuze[]
  bezig: boolean
  onWijzig: (id: string) => void
  onVerwijder: (id: string) => Promise<boolean>
}

function samenvatting(p: MeetPunt): string {
  const delen = MEETWAARDEN.flatMap((w) => {
    const n = p.waarden[w.sleutel]
    return n === undefined ? [] : [`${w.kort.toLowerCase()} ${getal(n)} ${w.eenheid}`]
  })
  if (p.waarden.bloeddruk) delen.push(`bloeddruk ${p.waarden.bloeddruk}`)
  return delen.join(' · ')
}

/** Alle meetmomenten, nieuwste eerst. Intakes alleen lezen; losse metingen wijzigen of verwijderen. */
export function MetingLijst({ punten, metingen, medewerkers, bezig, onWijzig, onVerwijder }: MetingLijstProps) {
  const [bevestig, setBevestig] = useState<string | null>(null)
  const lijst = sorteerPunten(punten).reverse()
  if (lijst.length === 0) return null

  return (
    <details className="club-voortgang-historie">
      <summary>Alle metingen ({lijst.length})</summary>
      <ul className="club-voortgang-momenten">
        {lijst.map((p) => {
          const meting = p.bron === 'meting' ? metingen.find((m) => m.id === p.id) : undefined
          const door = meting?.medewerkerId ? medewerkers.find((m) => m.id === meting.medewerkerId)?.naam : undefined
          return (
            <li key={`${p.bron}-${p.id}`} className="club-voortgang-moment">
              <div className="club-voortgang-moment-tekst">
                <span className="club-voortgang-moment-kop">
                  {datumLang(p.datum)}
                  <span className={`club-chip ${p.bron === 'intake' ? 'club-chip--info' : 'club-chip--geen'}`}>{p.bron === 'intake' ? 'Intake' : 'Meting'}</span>
                </span>
                <span className="club-voortgang-moment-waarden">{samenvatting(p) || 'Geen meetwaarden'}</span>
                {(door || meting?.notitie) && <span className="club-voortgang-moment-sub">{[door && `Door ${door}`, meting?.notitie].filter(Boolean).join('. ')}</span>}
              </div>
              {meting && (
                <div className="club-voortgang-moment-acties">
                  {bevestig === meting.id ? (
                    <>
                      <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => onVerwijder(meting.id).then(() => setBevestig(null))}>
                        Ja, verwijderen
                      </button>
                      <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                        Nee
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => onWijzig(meting.id)} aria-label={`Meting van ${datumLang(p.datum)} wijzigen`}>
                        Wijzigen
                      </button>
                      <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => setBevestig(meting.id)} aria-label={`Meting van ${datumLang(p.datum)} verwijderen`}>
                        Verwijderen
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="club-hint">Metingen uit een intake horen bij die intake (Training, Intakes) en staan hier alleen ter vergelijking.</p>
    </details>
  )
}
