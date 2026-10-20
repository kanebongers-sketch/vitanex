'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import { SOORT_LABEL } from '@/lib/club/rooster/typen'
import { WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import { VOORBEELD_LESSEN, VOORBEELD_LESTYPEN, lesVoorstellen, zelfdeNaam, type BestaandLestype, type BestaandeLes, type VoorbeeldLes, type VoorbeeldLestype, type LesVoorstel } from '@/lib/club/start/voorbeelden'
import { stuur } from '@/components/club/leden/stuur'

// Stap 5: lestypen en een paar vaste lessen, met voorbeelden (passend bij de
// soort sportschool) die je met een klik overneemt. Gaat via dezelfde API als Instellingen, dus alles is daarna
// gewoon aan te passen.

const INTENSITEIT = ['', 'Rustig', 'Gemiddeld', 'Zwaar']

interface StapLessenProps {
  vestiging: string
  vestigingNaam: string
  lestypen: BestaandLestype[]
  lessen: BestaandeLes[]
  /** Vandaag als jjjj-mm-dd: vaste lessen lopen vanaf vandaag. */
  vandaag: string
  /** De voorbeeldlestypen voor deze soort sportschool (standaard de gangbare). */
  voorbeelden?: readonly VoorbeeldLestype[]
  /** De voorbeeldweek voor deze soort sportschool. */
  voorbeeldLessen?: readonly VoorbeeldLes[]
}

function lestypeBody(v: VoorbeeldLestype, vestiging: string) {
  return { vestiging, naam: v.naam, omschrijving: v.omschrijving, soort: v.soort, duurMin: v.duurMin, intensiteit: v.intensiteit }
}

function lesBody(l: LesVoorstel, vestiging: string, vandaag: string) {
  return { vestiging, lestypeId: l.lestypeId, weekdag: l.weekdag, starttijd: l.starttijd, duurMin: l.duurMin, capaciteit: l.capaciteit, vanaf: vandaag }
}

export function StapLessen({ vestiging, vestigingNaam, lestypen, lessen, vandaag, voorbeelden = VOORBEELD_LESTYPEN, voorbeeldLessen = VOORBEELD_LESSEN }: StapLessenProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [gemaakt, setGemaakt] = useState<string | null>(null)
  const nieuw = voorbeelden.filter((v) => !lestypen.some((t) => zelfdeNaam(t.naam, v.naam)))
  const voorstellen = lesVoorstellen(lestypen, lessen, voorbeeldLessen)
  const openLessen = voorstellen.filter((l) => !l.bestaat)

  /** Een of meer items aanmaken, een voor een; stopt bij de eerste fout. */
  async function maak(sleutel: string, url: string, bodies: Record<string, unknown>[]) {
    setBezig(sleutel)
    setFout(null)
    for (const body of bodies) {
      const uit = await stuur(url, 'POST', body)
      if (!uit.ok) {
        setFout(uit.fout)
        break
      }
    }
    setBezig(null)
    router.refresh()
  }

  async function zetInRooster() {
    setBezig('rooster')
    setFout(null)
    setGemaakt(null)
    const uit = await stuur('/api/club/rooster/genereren', 'POST', { vestiging, weken: 6 })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    const n = typeof uit.data === 'object' && uit.data !== null && 'aangemaakt' in uit.data && typeof uit.data.aangemaakt === 'number' ? uit.data.aangemaakt : 0
    setGemaakt(n === 0 ? 'Alles stond er al.' : `${n} lessen staan nu in het rooster voor de komende 6 weken.`)
  }

  const neemType = (v: VoorbeeldLestype) => maak(`type-${v.naam}`, '/api/club/instellingen/lestypen', [lestypeBody(v, vestiging)])
  const neemLes = (l: LesVoorstel) => maak(`les-${l.lestype}-${l.weekdag}-${l.starttijd}`, '/api/club/instellingen/weekrooster', [lesBody(l, vestiging, vandaag)])

  return (
    <div className="club-start-lessen">
      <section className="club-start-blok" aria-labelledby="start-lestypen-kop">
        <div className="club-start-blokkop">
          <h2 id="start-lestypen-kop">Lestypen</h2>
          {nieuw.length > 1 && (
            <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void maak('alle', '/api/club/instellingen/lestypen', nieuw.map((v) => lestypeBody(v, vestiging)))}>
              <Plus aria-hidden size={14} /> {bezig === 'alle' ? 'Bezig...' : `Alle ${nieuw.length} overnemen`}
            </button>
          )}
        </div>
        <p className="club-hint">Kies de lessen die je geeft. Naam, duur en uitleg pas je later aan in Instellingen.</p>
        <ul className="club-start-voorbeelden" role="list">
          {voorbeelden.map((v) => {
            const staat = lestypen.some((t) => zelfdeNaam(t.naam, v.naam))
            return (
              <li key={v.naam} className="club-start-voorbeeld club-rooster-soortstreep" data-af={staat || undefined} data-soort={v.soort}>
                <div className="club-start-voorbeeld-tekst">
                  <strong>{v.naam}</strong>
                  <span className="club-zacht">{SOORT_LABEL[v.soort]} · {v.duurMin} min · {INTENSITEIT[v.intensiteit]}</span>
                  <span className="club-start-voorbeeld-uitleg">{v.omschrijving}</span>
                </div>
                {staat ? (
                  <span className="club-chip club-chip--ok">
                    <Check aria-hidden size={13} /> Staat erin
                  </span>
                ) : (
                  <button type="button" className="club-knop club-knop--klein" aria-label={`${v.naam} overnemen`} disabled={bezig !== null} onClick={() => void neemType(v)}>
                    {bezig === `type-${v.naam}` ? 'Bezig...' : 'Overnemen'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="club-start-blok" aria-labelledby="start-lessen-kop">
        <div className="club-start-blokkop">
          <h2 id="start-lessen-kop">Vaste lessen in {vestigingNaam}</h2>
          {openLessen.length > 1 && (
            <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void maak('week', '/api/club/instellingen/weekrooster', openLessen.map((l) => lesBody(l, vestiging, vandaag)))}>
              <Plus aria-hidden size={14} /> {bezig === 'week' ? 'Bezig...' : `Hele week toevoegen (${openLessen.length})`}
            </button>
          )}
        </div>
        <p className="club-hint">Een vaste les komt elke week terug. Zet ze daarna in het rooster, dan kunnen leden reserveren. Een zaal en instructeur kies je later.</p>
        {voorstellen.length === 0 ? (
          <p className="club-leeg">Neem eerst een paar lestypen over; dan zie je hier een voorstel voor je week.</p>
        ) : (
          <ul className="club-start-weekvoorstel" role="list">
            {voorstellen.map((l) => {
              const sleutel = `les-${l.lestype}-${l.weekdag}-${l.starttijd}`
              return (
                <li key={sleutel} className="club-start-les" data-af={l.bestaat || undefined}>
                  <span className="club-start-les-dag">{WEEKDAG_LABEL[l.weekdag - 1]}</span>
                  <span className="club-start-les-tijd club-getal">{l.starttijd}</span>
                  <span className="club-start-les-naam">{l.lestype}</span>
                  <span className="club-zacht club-start-les-plek">{l.capaciteit} plekken</span>
                  {l.bestaat ? (
                    <span className="club-chip club-chip--ok">In het rooster</span>
                  ) : (
                    <button type="button" className="club-knop club-knop--klein" aria-label={`${l.lestype} op ${WEEKDAG_LABEL[l.weekdag - 1]} om ${l.starttijd} toevoegen`} disabled={bezig !== null} onClick={() => void neemLes(l)}>
                      {bezig === sleutel ? 'Bezig...' : 'Toevoegen'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {lessen.length > 0 && (
          <div className="club-start-rooster">
            <p>
              <strong>{lessen.length} vaste {lessen.length === 1 ? 'les' : 'lessen'}</strong> in {vestigingNaam}. Zet ze in het rooster voor de komende 6 weken; wat er al staat blijft staan.
            </p>
            <button type="button" className="club-knop club-knop--primair" disabled={bezig !== null} onClick={() => void zetInRooster()}>
              {bezig === 'rooster' ? 'Bezig...' : 'In het rooster zetten'}
            </button>
          </div>
        )}
      </section>
      <div aria-live="polite">
        {gemaakt && <p className="club-melding club-melding--ok" role="status">{gemaakt}</p>}
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      </div>
    </div>
  )
}
