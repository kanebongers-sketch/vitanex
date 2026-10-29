'use client'

import { useState } from 'react'
import { MEETWAARDEN, type Meting } from '@/lib/club/voortgang/meting'
import { sorteerPunten, type MeetPunt } from '@/lib/club/voortgang/tijdlijn'
import type { MedewerkerKeuze } from './MetingFormulier'
import { datumLang, getal } from './weergave'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { VoortgangTekst } from '@/lib/aiyourgym/taal/woorden/club/voortgang'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'

interface MetingLijstProps {
  punten: readonly MeetPunt[]
  metingen: readonly Meting[]
  medewerkers: readonly MedewerkerKeuze[]
  bezig: boolean
  onWijzig: (id: string) => void
  onVerwijder: (id: string) => Promise<boolean>
}

function samenvatting(p: MeetPunt, tv: VoortgangTekst, taal: Taal): string {
  const delen = MEETWAARDEN.flatMap((w) => {
    const n = p.waarden[w.sleutel]
    return n === undefined ? [] : [`${tv.meet[w.sleutel].kort.toLowerCase()} ${getal(n, taal)} ${w.eenheid === 'per min' ? tv.perMinuut : w.eenheid}`]
  })
  if (p.waarden.bloeddruk) delen.push(tv.lijst.bloeddruk(p.waarden.bloeddruk))
  return delen.join(' · ')
}

/** Alle meetmomenten, nieuwste eerst. Intakes alleen lezen; losse metingen wijzigen of verwijderen. */
export function MetingLijst({ punten, metingen, medewerkers, bezig, onWijzig, onVerwijder }: MetingLijstProps) {
  const [bevestig, setBevestig] = useState<string | null>(null)
  const taal = useTaal()
  const tv = useTekst(VOORTGANG)
  const t = tv.lijst
  const lijst = sorteerPunten(punten).reverse()
  if (lijst.length === 0) return null

  return (
    <details className="club-voortgang-historie">
      <summary>{t.alle(lijst.length)}</summary>
      <ul className="club-voortgang-momenten">
        {lijst.map((p) => {
          const meting = p.bron === 'meting' ? metingen.find((m) => m.id === p.id) : undefined
          const door = meting?.medewerkerId ? medewerkers.find((m) => m.id === meting.medewerkerId)?.naam : undefined
          return (
            <li key={`${p.bron}-${p.id}`} className="club-voortgang-moment">
              <div className="club-voortgang-moment-tekst">
                <span className="club-voortgang-moment-kop">
                  {datumLang(p.datum, taal)}
                  <span className={`club-chip ${p.bron === 'intake' ? 'club-chip--info' : 'club-chip--geen'}`}>{p.bron === 'intake' ? t.intake : t.meting}</span>
                </span>
                <span className="club-voortgang-moment-waarden">{samenvatting(p, tv, taal) || t.geenWaarden}</span>
                {(door || meting?.notitie) && <span className="club-voortgang-moment-sub">{[door && t.door(door), meting?.notitie].filter(Boolean).join('. ')}</span>}
              </div>
              {meting && (
                <div className="club-voortgang-moment-acties">
                  {bevestig === meting.id ? (
                    <>
                      <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => onVerwijder(meting.id).then(() => setBevestig(null))}>
                        {t.jaVerwijderen}
                      </button>
                      <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                        {t.nee}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => onWijzig(meting.id)} aria-label={t.wijzigLabel(datumLang(p.datum, taal))}>
                        {t.wijzigen}
                      </button>
                      <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => setBevestig(meting.id)} aria-label={t.verwijderLabel(datumLang(p.datum, taal))}>
                        {t.verwijderen}
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="club-hint">{t.hint}</p>
    </details>
  )
}
