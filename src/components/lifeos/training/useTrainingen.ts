'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { leesTrainingAntwoord, leesTrainingenAntwoord, type Rpe, type Training } from '@/lib/lifeos/training/training'
import type { LogInvoer } from './LogFormulier'

// De data-kant van de trainingkaart: ophalen, optimistisch schrijven,
// terugdraaien. Apart van `TrainingKaart.tsx`, zodat dat bestand alleen nog
// tekent — container/presentational, zoals architecture.md vraagt.
//
// ─── DRIE STATEN, NOOIT TWEE ────────────────────────────────────────────────
//   laden → een skelet
//   fout  → "we konden het niet ophalen" + een weg terug
//   ok    → wat er staat (en dat mag leeg zijn)
//
// Een netwerkfout mag NOOIT als "je trainde niet" renderen. Vandaar dat 'fout'
// een eigen fase is en geen lege lijst — die twee samenvoegen is precies de
// leugen die dit project uitroeit.

export type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; trainingen: Training[] }

type Verzoek = Promise<{ ok: true; waarde: Training } | { ok: false; fout: string }>

export interface TrainingenApi {
  staat: Staat
  /** Fout van een schrijfactie. Staat los van `staat`: het laden lukte wél. */
  actieFout: string | null
  bezig: boolean
  opnieuw: () => void
  log: (invoer: LogInvoer) => void
  afronden: (training: Training) => void
  zetRpe: (training: Training, rpe: Rpe | null) => void
  verwijder: (training: Training) => void
}

export function useTrainingen(): TrainingenApi {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // De dag in een ref, niet in state: hij stuurt geen render aan, hij bepaalt
  // alleen wát we ophalen. En hij wordt pas ná mount bepaald — `new Date()`
  // tijdens render geeft op de server de servertijd en in de browser de jouwe.
  const dagRef = useRef<string | null>(null)

  // Generatieteller: zonder deze kunnen twee vluchten elkaar inhalen en wint de
  // oudste die toevallig als laatste terugkomt. De cleanup hoogt 'm op, zodat
  // een vlucht die bij unmount nog loopt niets meer zet. Zie Top3Kaart.
  const generatie = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(
      `/api/lifeos/training?datum=${encodeURIComponent(voorDag)}`,
      leesTrainingenAntwoord,
    ).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', trainingen: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie Top3Kaart/AgendaKaart. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    const dag = datumSleutel(new Date())
    dagRef.current = dag
    void laad(dag)
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    const dag = dagRef.current
    if (!dag) return
    setStaat({ fase: 'laden' })
    void laad(dag)
  }, [laad])

  /**
   * Optimistisch schrijven met terugval.
   *
   * `vooruit` tekent de verwachte stand, het verzoek bevestigt 'm — of we
   * zetten de snapshot terug en zeggen het. Stil terugdraaien is erger dan geen
   * optimistische update: dan zie je je training spontaan verspringen zonder
   * reden.
   */
  const schrijf = useCallback(
    async (
      vooruit: (huidig: Training[]) => Training[],
      verzoek: () => Verzoek,
      naBevestiging: (huidig: Training[], bevestigd: Training) => Training[],
    ) => {
      if (staat.fase !== 'ok' || bezig) return

      const terug = staat.trainingen // snapshot voor de rollback
      setActieFout(null)
      setBezig(true)
      setStaat({ fase: 'ok', trainingen: vooruit(terug) })

      const uitkomst = await verzoek()
      setBezig(false)

      if (!uitkomst.ok) {
        setStaat({ fase: 'ok', trainingen: terug })
        setActieFout(`${uitkomst.fout} Er is niets gewijzigd.`)
        return
      }

      // De server is de waarheid: het id en de tijdstempels komen daarvandaan,
      // niet van onze klok.
      const bevestigd = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', trainingen: naBevestiging(huidig.trainingen, bevestigd) }
          : huidig,
      )
    },
    [staat, bezig],
  )

  const log = useCallback(
    (invoer: LogInvoer) => {
      const dag = dagRef.current
      if (!dag) return

      const tijdelijk = tijdelijkeTraining(dag, invoer)
      void schrijf(
        (huidig) => [...huidig, tijdelijk],
        () =>
          haalJson('/api/lifeos/training', leesTrainingAntwoord, {
            method: 'POST',
            body: JSON.stringify({ datum: dag, gepland: false, ...invoer }),
          }),
        (huidig, bevestigd) => huidig.map((t) => (t.id === tijdelijk.id ? bevestigd : t)),
      )
    },
    [schrijf],
  )

  const patch = useCallback(
    (training: Training, wijziging: Partial<Training>, body: Record<string, unknown>) => {
      void schrijf(
        (huidig) => huidig.map((t) => (t.id === training.id ? { ...t, ...wijziging } : t)),
        () =>
          haalJson(`/api/lifeos/training/${training.id}`, leesTrainingAntwoord, {
            method: 'PATCH',
            body: JSON.stringify(body),
          }),
        (huidig, bevestigd) => huidig.map((t) => (t.id === bevestigd.id ? bevestigd : t)),
      )
    },
    [schrijf],
  )

  const afronden = useCallback(
    // Alleen de vlag om: geen RPE erbij verzinnen. Die vul je hierna in — of
    // niet, en dan is dat het eerlijke antwoord.
    (training: Training) => patch(training, { gepland: false }, { gepland: false }),
    [patch],
  )

  const zetRpe = useCallback(
    (training: Training, rpe: Rpe | null) => patch(training, { rpe }, { rpe }),
    [patch],
  )

  const verwijder = useCallback(
    (training: Training) => {
      void schrijf(
        (huidig) => huidig.filter((t) => t.id !== training.id),
        // DELETE geeft 204 — niets om te lezen. We reiken de verwijderde rij
        // terug zodat `schrijf` één vorm houdt; er valt daarna niets te
        // bevestigen, de rij is al weg.
        async () => {
          const uitkomst = await haalJson(`/api/lifeos/training/${training.id}`, leesNiets, {
            method: 'DELETE',
          })
          return uitkomst.ok ? { ok: true, waarde: training } : { ok: false, fout: uitkomst.fout }
        },
        (huidig) => huidig,
      )
    },
    [schrijf],
  )

  return { staat, actieFout, bezig, opnieuw, log, afronden, zetRpe, verwijder }
}

/**
 * De rij die je meteen ziet, vóór de server antwoordt. Krijgt een eigen id
 * zodat de bevestiging 'm terug kan vinden — en zodat een mislukte POST precies
 * deze rij weghaalt en niets anders.
 */
function tijdelijkeTraining(dag: string, invoer: LogInvoer): Training {
  return {
    id: `tijdelijk-${crypto.randomUUID()}`,
    datum: dag,
    soort: invoer.soort,
    omschrijving: null,
    duurMinuten: invoer.duurMinuten,
    rpe: invoer.rpe,
    // Niet gemeten — en dat blijft zo tot een bron het wél meet. Geen 0.
    actieveMinuten: null,
    gepland: false,
    aangemaaktOp: new Date().toISOString(),
  }
}
