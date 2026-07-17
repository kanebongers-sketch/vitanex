'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import type { Groep, Persoon, PersoonWijziging } from '@/lib/lifeos/crm/crm'
import { leesPersonenAntwoord, leesPersoonAntwoord } from './lees'

// Alle bediening van één groep-bord op één plek: laden, verplaatsen (status +
// volgorde), wijzigen, contact leggen, verwijderen, toevoegen. `GroepBord`
// blijft compositie; hier zit het gedrag. Zelfde vorm als `useTaken`.
//
// Alles is optimistisch: de UI springt meteen om, want wachten op de server
// voelt als een defect. Mislukt het, dan draaien we terug ÉN zeggen we het —
// stil terugdraaien is erger dan geen optimistische update.

export type MensenStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; personen: Persoon[] }

/** Wat het toevoeg-formulier meestuurt. `groep` hangt de hook er zelf aan. */
export interface NieuwePersoonInvoer {
  naam: string
  status?: string
  followUpDatum?: string | null
  telefoon?: string | null
  email?: string | null
  bijzonderheden?: string | null
}

export interface MensenBediening {
  staat: MensenStaat
  /** Fout van een actie (verplaatsen, wijzigen). Los van de laadfout. */
  actieFout: string | null
  bezig: boolean
  opnieuw: () => void
  wijzig: (persoon: Persoon, wijziging: PersoonWijziging) => Promise<boolean>
  verplaats: (persoon: Persoon, status: string, sortering?: number) => Promise<boolean>
  contactGelegd: (persoon: Persoon) => Promise<boolean>
  verwijder: (persoon: Persoon) => Promise<void>
  voegToe: (invoer: NieuwePersoonInvoer) => Promise<boolean>
}

export function useMensen(groep: Groep): MensenBediening {
  const [staat, setStaat] = useState<MensenStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // Generatieteller: een oudere vlucht die toevallig als laatste terugkomt, mag
  // een verse stand niet overschrijven. De cleanup hoogt 'm op.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    const pad = `/api/lifeos/crm/personen?groep=${encodeURIComponent(groep)}`
    return haalJson(pad, leesPersonenAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', personen: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [groep])

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
   * Eén weg naar de server voor élke wijziging. `groep` gaat altijd mee, zodat de
   * server een nieuwe status tegen de JUISTE groep valideert (contract-eis).
   * Optimistisch heen, en bij een fout terug naar exact de stand van vóór de klik.
   */
  const wijzig = useCallback(
    async (persoon: Persoon, wijziging: PersoonWijziging): Promise<boolean> => {
      if (staat.fase !== 'ok') return false

      const terug = staat.personen // snapshot voor de rollback
      const vooruit: Persoon = { ...persoon, ...wijziging }
      setActieFout(null)
      setStaat({ fase: 'ok', personen: terug.map((p) => (p.id === persoon.id ? vooruit : p)) })

      const uitkomst = await haalJson(`/api/lifeos/crm/personen/${persoon.id}`, leesPersoonAntwoord, {
        method: 'PATCH',
        body: JSON.stringify({ ...wijziging, groep: persoon.groep }),
      })

      if (!uitkomst.ok) {
        setStaat({ fase: 'ok', personen: terug })
        setActieFout(`${uitkomst.fout} De wijziging is teruggedraaid.`)
        return false
      }

      // De server is de waarheid (o.a. laatsteContactOp komt daarvandaan).
      const bevestigd = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', personen: huidig.personen.map((p) => (p.id === bevestigd.id ? bevestigd : p)) }
          : huidig,
      )
      return true
    },
    [staat],
  )

  const verplaats = useCallback(
    (persoon: Persoon, status: string, sortering?: number): Promise<boolean> =>
      wijzig(persoon, sortering === undefined ? { status } : { status, sortering }),
    [wijzig],
  )

  const contactGelegd = useCallback(
    (persoon: Persoon): Promise<boolean> => wijzig(persoon, { laatsteContactOp: new Date().toISOString() }),
    [wijzig],
  )

  const verwijder = useCallback(
    async (persoon: Persoon) => {
      if (staat.fase !== 'ok') return

      const terug = staat.personen // snapshot voor de rollback
      setActieFout(null)
      setStaat({ fase: 'ok', personen: terug.filter((p) => p.id !== persoon.id) })

      const uitkomst = await haalJson(`/api/lifeos/crm/personen/${persoon.id}`, leesNiets, {
        method: 'DELETE',
      })

      if (!uitkomst.ok) {
        setStaat({ fase: 'ok', personen: terug })
        setActieFout(`${uitkomst.fout} ${persoon.naam} staat er nog.`)
      }
    },
    [staat],
  )

  const voegToe = useCallback(
    async (invoer: NieuwePersoonInvoer): Promise<boolean> => {
      if (staat.fase !== 'ok') return false

      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/crm/personen', leesPersoonAntwoord, {
        method: 'POST',
        body: JSON.stringify({ ...invoer, groep }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return false
      }

      const nieuw = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok' ? { fase: 'ok', personen: [...huidig.personen, nieuw] } : huidig,
      )
      return true
    },
    [staat, groep],
  )

  return { staat, actieFout, bezig, opnieuw, wijzig, verplaats, contactGelegd, verwijder, voegToe }
}
