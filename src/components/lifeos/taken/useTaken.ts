'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, haalJsonGedeeld, leesNiets } from '@/lib/lifeos/api/http'
import { meldWijziging } from '@/lib/lifeos/events'
import {
  leesTaakAntwoord,
  leesTakenAntwoord,
  type Taak,
  type TaakWijziging,
} from '@/lib/lifeos/taken/taken'
import { herstelTaak, vervangTaak, verwijderTaak } from './lijstMutatie'

// Alle bediening van de takenlijst op één plek: laden, afvinken, wijzigen,
// verwijderen, toevoegen. De container (`VangOp`) bezit deze hook en geeft 'm aan
// het presentational `TakenBody` door; hier zit het gedrag. Zelfde vorm als
// `useBrainDump`/`useSuggesties`.
//
// Alles is optimistisch: de UI springt meteen om, want wachten op de server
// voelt als een defect. Mislukt het, dan draaien we terug ÉN zeggen we het. Stil
// terugdraaien is erger dan geen optimistische update: dan zie je je taak
// spontaan terugspringen zonder reden.

export type TakenStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; taken: Taak[] }

export interface TakenBediening {
  staat: TakenStaat
  /** Fout van een actie (afvinken, wijzigen). Los van de laadfout. */
  actieFout: string | null
  bezig: boolean
  opnieuw: () => void
  vink: (taak: Taak) => void
  verwijder: (taak: Taak) => void
  wijzig: (taak: Taak, wijziging: TaakWijziging) => Promise<boolean>
  voegToe: (titel: string, datum: string | null) => Promise<boolean>
}

export function useTaken(): TakenBediening {
  const [staat, setStaat] = useState<TakenStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // Generatieteller: `laad` loopt vanaf mount en vanaf de retry-knop. Zonder
  // deze teller wint een oudere vlucht die toevallig als laatste terugkomt. De
  // cleanup hoogt 'm op, zodat een vlucht die bij unmount nog loopt niets zet.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    // Gedeeld: ProductiviteitDomein haalt dezelfde lijst ook op bij het openen van
    // de cockpit. In-flight coalescing, dus een latere refresh (na een schrijf)
    // krijgt gewoon verse data — er hangt niets in cache.
    return haalJsonGedeeld('/api/lifeos/taken?alle=1', leesTakenAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', taken: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /**
   * Verklaart alles wat nu in de lucht is ongeldig. Een losse callback en geen
   * inline cleanup: zo leest de effect-cleanup `generatie.current` niet pas bij
   * unmount uit een closure — de vorm die de rest van LifeOS ook gebruikt (zie
   * `useJournal`).
   */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  /**
   * Eén weg naar de server voor élke wijziging: afvinken, hernoemen, een feit
   * invullen, een top-3-plek claimen. Optimistisch heen, en bij een fout terug
   * naar exact de stand van vóór de klik — maar alléén voor déze taak.
   *
   * Per-taak, niet per-lijst: een hele-lijst-snapshot als rollback zou een
   * gelijktijdige, geslaagde wijziging op een ándere taak meesleuren. Twee snelle
   * kliks (taak A vinken, dan taak B) waarvan A faalt, mag B niet laten
   * terugspringen. Alle setStaat-calls zijn daarom functioneel: ze componeren met
   * wat er ondertussen gebeurde, i.p.v. een verouderde snapshot terug te zetten.
   */
  const stuurWijziging = useCallback(
    async (taak: Taak, wijziging: TaakWijziging, vooruit: Taak, staartTekst: string) => {
      if (staat.fase !== 'ok') return false

      const vorige = staat.taken.find((t) => t.id === taak.id)
      if (vorige === undefined) return false // ingehaald: de taak bestaat niet meer

      setActieFout(null)
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', taken: vervangTaak(huidig.taken, taak.id, vooruit) }
          : huidig,
      )

      const uitkomst = await haalJson(`/api/lifeos/taken/${taak.id}`, leesTaakAntwoord, {
        method: 'PATCH',
        body: JSON.stringify(wijziging),
      })

      if (!uitkomst.ok) {
        // Alleen déze taak terug; een gelijktijdige wijziging elders blijft staan.
        setStaat((huidig) =>
          huidig.fase === 'ok'
            ? { fase: 'ok', taken: vervangTaak(huidig.taken, taak.id, vorige) }
            : huidig,
        )
        setActieFout(`${uitkomst.fout} ${staartTekst}`)
        return false
      }

      // De server is de waarheid: klaar_op komt daarvandaan, niet van onze klok.
      const bevestigd = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', taken: vervangTaak(huidig.taken, bevestigd.id, bevestigd) }
          : huidig,
      )
      // Andere kaarten (het dagplan) rekenen met dezelfde taken en lopen anders
      // achter. Ná de geslaagde schrijf, nooit optimistisch.
      meldWijziging('taken')
      return true
    },
    [staat],
  )

  const vink = useCallback(
    (taak: Taak) => {
      const klaar = !taak.klaar
      void stuurWijziging(
        taak,
        { klaar },
        { ...taak, klaar, klaarOp: klaar ? new Date().toISOString() : null },
        'Je taak staat nog op de oude stand.',
      )
    },
    [stuurWijziging],
  )

  const wijzig = useCallback(
    (taak: Taak, wijziging: TaakWijziging): Promise<boolean> =>
      stuurWijziging(taak, wijziging, { ...taak, ...wijziging }, 'Je taak staat nog op de oude stand.'),
    [stuurWijziging],
  )

  const verwijder = useCallback(
    async (taak: Taak) => {
      if (staat.fase !== 'ok') return

      // De oude plek onthouden, zodat de rollback 'm terugzet zonder de rest van
      // de lijst (die intussen gewijzigd kan zijn) te overschrijven.
      const index = staat.taken.findIndex((t) => t.id === taak.id)
      if (index === -1) return
      const vorige = staat.taken[index]

      setActieFout(null)
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', taken: verwijderTaak(huidig.taken, taak.id) }
          : huidig,
      )

      const uitkomst = await haalJson(`/api/lifeos/taken/${taak.id}`, leesNiets, {
        method: 'DELETE',
      })

      if (!uitkomst.ok) {
        setStaat((huidig) =>
          huidig.fase === 'ok'
            ? { fase: 'ok', taken: herstelTaak(huidig.taken, vorige, index) }
            : huidig,
        )
        setActieFout(`${uitkomst.fout} De taak staat er nog.`)
        return
      }

      meldWijziging('taken')
    },
    [staat],
  )

  const voegToe = useCallback(
    async (titel: string, datum: string | null): Promise<boolean> => {
      if (staat.fase !== 'ok') return false

      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/taken', leesTaakAntwoord, {
        method: 'POST',
        body: JSON.stringify({ titel, datum }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return false
      }

      const nieuw = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok' ? { fase: 'ok', taken: [...huidig.taken, nieuw] } : huidig,
      )
      meldWijziging('taken')
      return true
    },
    [staat],
  )

  return { staat, actieFout, bezig, opnieuw, vink, verwijder, wijzig, voegToe }
}
