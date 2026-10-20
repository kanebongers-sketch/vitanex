'use client'

import { useRef, useState } from 'react'
import { Building2, Check, Dumbbell, Flame, Flower2, Gem, Swords, UserRound, type LucideIcon } from 'lucide-react'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { stuur } from '@/components/club/leden/stuur'
import { SOORT_INFO, SPORTSCHOOL_SOORTEN, klaargezet, pakketVoor, toepasPlan, type BestaandeVestiging, type SportschoolSoort } from '@/lib/club/start/soorten'
import { taken, voerUit } from './pas-soort-toe'
import { StartVoet, useStartGang, type StartVoetProps } from './StartVoet'

// Stap 1: wat voor sportschool is het? Een keuze zet alvast onderdelen,
// lestypen, openingstijden, regels voor reserveren en rechten per rol klaar.
// Eerst zie je precies wat er klaar komt te staan; pas bij Klopt gebeurt het.
// Dezelfde soort nog een keer kiezen verandert niets meer (eigen werk blijft).

const ICOON: Record<SportschoolSoort, LucideIcon> = {
  gym: Dumbbell,
  boutique: Gem,
  pt: UserRound,
  keten: Building2,
  yoga: Flower2,
  vechtsport: Swords,
  bootcamp: Flame,
}

interface StapSoortProps {
  /** De eerder gekozen soort, of null. */
  gekozen: SportschoolSoort | null
  organisatie: HuisstijlWaarden
  vestigingen: BestaandeVestiging[]
  /** Namen van lestypen die er al zijn. */
  lestypen: string[]
  /** De vestiging waar nieuwe lestypen onder worden aangemaakt (de API wil er een). */
  lesVestiging: string | null
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapSoort({ gekozen, organisatie, vestigingen, lestypen, lesVestiging, voet }: StapSoortProps) {
  const gang = useStartGang(voet)
  const [soort, setSoort] = useState<SportschoolSoort | null>(gekozen)
  const voorstel = useRef<HTMLElement>(null)
  const [bezig, setBezig] = useState<{ klaar: number; totaal: number } | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const pakket = soort ? pakketVoor(soort) : null

  /** Kiezen; op een smal scherm staat het voorstel onder de kaarten, dus daar scrollen we heen. */
  function kies(s: SportschoolSoort) {
    setSoort(s)
    setFout(null)
    if (window.matchMedia('(max-width: 999px)').matches) {
      const zacht = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => voorstel.current?.scrollIntoView({ behavior: zacht ? 'smooth' : 'auto', block: 'start' }))
    }
  }

  /** Het pakket neerzetten (alleen als de soort nieuw is) en de soort onthouden; false = blijven staan. */
  async function zetKlaar(): Promise<boolean> {
    if (!soort || !pakket || soort === gekozen) return true
    setFout(null)
    const lijst = taken(pakket, toepasPlan(pakket, vestigingen, lestypen), organisatie, lesVestiging)
    const totaal = lijst.length + 1
    setBezig({ klaar: 0, totaal })
    const melding = await voerUit(lijst, (klaar) => setBezig({ klaar, totaal }))
    const uit = melding ? null : await stuur('/api/club/start', 'PATCH', { soort })
    setBezig(null)
    if (melding || !uit?.ok) {
      setFout(`${melding ?? (uit && !uit.ok ? uit.fout : '')} Wat al gelukt is blijft staan; probeer het nog een keer.`)
      return false
    }
    return true
  }

  return (
    <>
      <div className="club-start-soort">
        <fieldset className="club-start-soorten">
          <legend className="club-start-sectiekop">Wat voor sportschool heb je?</legend>
          {SPORTSCHOOL_SOORTEN.map((s) => {
            const Icoon = ICOON[s]
            return (
              <label key={s} className="club-start-soortkaart" data-gekozen={soort === s || undefined}>
                <input type="radio" name="soort" value={s} checked={soort === s} onChange={() => kies(s)} disabled={bezig !== null} />
                <span className="club-start-soortkaart-icoon" aria-hidden>
                  <Icoon size={22} strokeWidth={1.75} />
                </span>
                <span className="club-start-soortkaart-tekst">
                  <strong>{SOORT_INFO[s].titel}</strong>
                  <span>{SOORT_INFO[s].kort}</span>
                </span>
                <span className="club-start-soortkaart-vink" aria-hidden>
                  <Check size={14} strokeWidth={3} />
                </span>
              </label>
            )
          })}
        </fieldset>

        <section ref={voorstel} className="club-start-klaargezet club-start-voorstel" aria-live="polite" aria-labelledby="soort-voorstel-kop" data-leeg={!pakket || undefined}>
          {pakket && soort ? (
            <>
              <p className="club-boventitel">Voor een {SOORT_INFO[soort].titel.toLowerCase()}</p>
              <h2 id="soort-voorstel-kop">Dit zetten we alvast voor je klaar</h2>
              <dl className="club-start-klaargezet-lijst">
                {klaargezet(pakket).map((r) => (
                  <div key={r.sleutel}>
                    <dt>{r.titel}</dt>
                    <dd>{r.tekst}</dd>
                  </div>
                ))}
              </dl>
              <p className="club-hint">
                {soort === gekozen ? 'Dit staat er al. Kies een andere soort om het opnieuw klaar te zetten.' : 'Wat je zelf al hebt ingesteld blijft staan. Alles is daarna nog aan te passen.'}
              </p>
              <div className="club-start-klaargezet-knoppen">
                <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={bezig !== null || gang.bezig} onClick={() => void gang.verder(zetKlaar)}>
                  <Check aria-hidden size={18} />
                  {bezig ? `Klaarzetten ${bezig.klaar} van ${bezig.totaal}...` : soort === gekozen ? 'Klopt, verder' : 'Klopt, zet klaar'}
                </button>
              </div>
              {bezig && (
                <div className="club-start-laadbalk" role="progressbar" aria-label="Klaarzetten" aria-valuemin={0} aria-valuemax={bezig.totaal} aria-valuenow={bezig.klaar}>
                  <span style={{ transform: `scaleX(${bezig.totaal ? bezig.klaar / bezig.totaal : 0})` }} />
                </div>
              )}
              {(fout ?? gang.fout) && <p className="club-melding club-melding--fout" role="alert">{fout ?? gang.fout}</p>}
            </>
          ) : (
            <>
              <h2 id="soort-voorstel-kop">Kies je soort sportschool</h2>
              <p className="club-zacht">Dan zie je hier wat we alvast klaarzetten: onderdelen, lestypen, openingstijden, regels voor reserveren en wat je team ziet.</p>
            </>
          )}
        </section>
      </div>
      <StartVoet {...voet} voorVerder={zetKlaar} primair={!soort ? 'Zonder soort verder' : soort === gekozen ? undefined : 'Klopt, zet klaar'} />
    </>
  )
}
