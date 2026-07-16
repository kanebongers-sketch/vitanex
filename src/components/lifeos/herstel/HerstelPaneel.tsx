'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { authFetch } from '@/lib/auth/auth-fetch'
import { HerstelKaart, type HerstelToestand } from './HerstelKaart'
import { laatsteGemeten, type HerstelDag } from '@/lib/lifeos/herstel/week'

// Container: haalt op en beslist wélke staat het is. `HerstelKaart` blijft puur
// (props in → UI uit) en is daardoor testbaar zonder netwerk.
//
// Waarom een client-eiland en geen Server Component: `getAuthenticatedUser`
// leest een Bearer-header, er is geen cookie-sessie. Een Server Component kent
// de gebruiker dus niet. Wil je dit server-side, dan is daar eerst een
// server-auth-helper voor nodig — dat is een aparte beslissing.

interface WeekAntwoord {
  vandaag: string
  dagen: HerstelDag[]
  gekoppeld: string[]
}

/**
 * Narrowing op de systeemgrens: de API is een externe bron, dus valideren
 * i.p.v. casten. Bij een vorm die we niet herkennen → null → foutstaat. Nooit
 * stilzwijgend "geen data": dat is precies het onderscheid dat deze kaart maakt.
 */
function leesWeek(json: unknown): WeekAntwoord | null {
  if (typeof json !== 'object' || json === null) return null
  const o = json as Record<string, unknown>
  if (typeof o.vandaag !== 'string') return null
  if (!Array.isArray(o.dagen)) return null

  // `gekoppeld` ontbreekt op een oudere server-versie. Dan liever de foutstaat
  // dan gokken dat er niets gekoppeld is — dat zou iemand met een wearable
  // vertellen dat hij er geen heeft.
  if (!Array.isArray(o.gekoppeld)) return null

  return {
    vandaag: o.vandaag,
    dagen: o.dagen as HerstelDag[],
    gekoppeld: (o.gekoppeld as unknown[]).filter((d): d is string => typeof d === 'string'),
  }
}

/** Wanneer werd er voor het laatst iets gemeten, in mensentaal. */
function wanneerTekst(datum: string, vandaag: string): string {
  if (datum === vandaag) return 'vannacht'
  const dag = new Date(`${datum}T12:00:00`)
  const nu = new Date(`${vandaag}T12:00:00`)
  const dagenGeleden = Math.round((nu.getTime() - dag.getTime()) / 86_400_000)
  if (dagenGeleden === 1) return 'gisteren'
  return `${dagenGeleden} dagen geleden`
}

export function HerstelPaneel() {
  const [toestand, setToestand] = useState<HerstelToestand>({ staat: 'niets-gemeten' })

  // Generatieteller: `laad` loopt vanaf mount en vanaf een retry. Zonder deze
  // teller kan een oudere vlucht die later terugkomt een verser antwoord
  // overschrijven. De cleanup hoogt 'm op, zodat een vlucht die bij unmount nog
  // loopt niets meer zet.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    // setState in de .then-callback, niet in de effect-body — geen cascaderende
    // render.
    return authFetch('/api/lifeos/herstel/week')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`week ophalen mislukt (${res.status})`)
        }
        return leesWeek(await res.json())
      })
      .then((data) => {
        if (mijn !== generatie.current) return
        if (data === null) {
          setToestand({ staat: 'fout', melding: 'We kregen een antwoord dat we niet begrepen.' })
          return
        }

        // De volgorde is de hele beslissing. Eerst: heb je überhaupt iets
        // gekoppeld? Anders zou een lege week als "niets gemeten" lezen en
        // stuur je iemand op zoek naar een probleem dat niet bestaat.
        if (data.gekoppeld.length === 0) {
          setToestand({ staat: 'niets-gekoppeld' })
          return
        }

        const laatste = laatsteGemeten(data.dagen)
        if (laatste === null) {
          setToestand({ staat: 'niets-gemeten' })
          return
        }

        setToestand({
          staat: 'gemeten',
          dag: laatste,
          wanneer: wanneerTekst(laatste.datum, data.vandaag),
        })
      })
      .catch((fout: unknown) => {
        if (mijn !== generatie.current) return
        // Een storing is géén lege staat. Dit onderscheid is de reden dat
        // HerstelToestand een union is en geen bundel booleans.
        console.error('[herstel] paneel laden mislukt', fout)
        setToestand({
          staat: 'fout',
          melding: 'We konden je herstel niet ophalen. Je gegevens zijn niet kwijt.',
        })
      })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie AgendaKaart. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  return <HerstelKaart toestand={toestand} />
}
