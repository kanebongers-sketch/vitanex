'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  DEBOUNCE_MS,
  leesJournalAntwoord,
  leesJournalDagAntwoord,
  moetOpslaan,
  RUSTIG,
  type OpslagStatus,
} from '@/lib/lifeos/journal/journal'

// Alle data-logica van de journal: laden, auto-save met debounce, en de
// opslagstaat. `JournalKaart` tekent alleen.
//
// De regels van deze hook (pure delen staan getest in `lib/lifeos/journal/journal.ts`):
//   1. Auto-save mag nooit stil mislukken. `mislukt` is een echte staat.
//   2. Wat de server heeft is de waarheid, niet wat het tekstveld denkt.
//   3. Weg uit het veld = nu opslaan, niet over 1,5 seconde.

export type JournalStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; gisterenGeschreven: boolean }

export interface Journal {
  staat: JournalStaat
  tekst: string
  opslag: OpslagStatus
  opWijziging: (waarde: string) => void
  opBlur: () => void
  slaOp: () => void
  opnieuwLaden: () => void
}

export function useJournal(): Journal {
  const [staat, setStaat] = useState<JournalStaat>({ fase: 'laden' })
  const [tekst, setTekst] = useState('')
  const [opslag, setOpslag] = useState<OpslagStatus>(RUSTIG)

  const dagRef = useRef<string | null>(null)
  // De laatste tekst, buiten React om: de debounce-timer moet bij het aflopen de
  // ACTUELE tekst lezen, niet de tekst van de render waarin hij gezet werd.
  const tekstRef = useRef('')
  // Wat de server heeft. De bron van "is er iets veranderd?" — nooit de UI-state,
  // want die loopt per definitie voor.
  const opgeslagenRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Twee generatietellers: één voor het laden, één voor het opslaan. Zonder de
  // tweede kan een trage PUT een snellere inhalen en zet de oudste alsnog
  // "Opgeslagen" neer terwijl je laatste zin nog niet weg is — een indicator die
  // liegt is erger dan geen indicator.
  const generatie = useRef(0)
  const opslagGeneratie = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(
      `/api/lifeos/journal?datum=${encodeURIComponent(voorDag)}`,
      leesJournalDagAntwoord,
    ).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld

      if (!uitkomst.ok) {
        // Fout ≠ leeg. Een netwerkstoring mag nooit als een leeg tekstveld
        // renderen: dan denk je dat je gisteravond niets schreef — en als je
        // dan gaat typen, overschrijf je wat er wél stond.
        setStaat({ fase: 'fout', bericht: uitkomst.fout })
        return
      }

      const bestaand = uitkomst.waarde.journal?.tekst ?? ''
      tekstRef.current = bestaand
      opgeslagenRef.current = bestaand
      setTekst(bestaand)
      setOpslag(RUSTIG)
      setStaat({ fase: 'ok', gisterenGeschreven: uitkomst.waarde.gisterenGeschreven })
    })
  }, [])

  const slaOp = useCallback((): void => {
    const dag = dagRef.current
    if (!dag) return

    const teSchrijven = tekstRef.current
    if (!moetOpslaan(teSchrijven, opgeslagenRef.current)) {
      setOpslag(RUSTIG)
      return
    }

    const mijn = ++opslagGeneratie.current
    setOpslag({ fase: 'bezig' })

    void haalJson('/api/lifeos/journal', leesJournalAntwoord, {
      method: 'PUT',
      body: JSON.stringify({ tekst: teSchrijven, datum: dag }),
    }).then((uitkomst) => {
      if (mijn !== opslagGeneratie.current) return // ingehaald of ontkoppeld

      if (!uitkomst.ok) {
        setOpslag({ fase: 'mislukt', bericht: uitkomst.fout })
        return
      }

      // De server is de waarheid: hij trimt, dus wat híj teruggeeft is wat er
      // staat. Typte je intussen door, dan is dit meteen weer "veranderd" en
      // plant de volgende toetsaanslag een nieuwe opslag.
      opgeslagenRef.current = uitkomst.waarde.journal?.tekst ?? ''
      setOpslag({ fase: 'opgeslagen', op: Date.now() })
    })
  }, [])

  /**
   * Verklaart alles wat nu in de lucht is ongeldig en zet de debounce stil —
   * zie Top3Kaart. Een losse callback en geen inline cleanup: zo leest de
   * exhaustive-deps-regel de refs niet als DOM-nodes die tussen render en
   * cleanup verschoven kunnen zijn (dat zijn het niet, het zijn tellers).
   */
  const verval = useCallback(() => {
    generatie.current++
    opslagGeneratie.current++
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    const dag = datumSleutel(new Date())
    dagRef.current = dag
    void laad(dag)
    return verval
  }, [laad, verval])

  const opnieuwLaden = useCallback(() => {
    const dag = dagRef.current
    if (!dag) return
    setStaat({ fase: 'laden' })
    void laad(dag)
  }, [laad])

  const opWijziging = useCallback(
    (waarde: string) => {
      setTekst(waarde)
      tekstRef.current = waarde

      if (timerRef.current !== null) clearTimeout(timerRef.current)

      // Terug naar wat er al stond (bv. een tik ongedaan gemaakt): niets te doen,
      // en dan hoort er ook geen "nog niet opgeslagen" te staan.
      if (!moetOpslaan(waarde, opgeslagenRef.current)) {
        setOpslag(RUSTIG)
        return
      }

      setOpslag({ fase: 'wacht' })
      timerRef.current = setTimeout(slaOp, DEBOUNCE_MS)
    },
    [slaOp],
  )

  /** Weg uit het veld = nu opslaan, niet over 1,5 seconde. */
  const opBlur = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (moetOpslaan(tekstRef.current, opgeslagenRef.current)) slaOp()
  }, [slaOp])

  return { staat, tekst, opslag, opWijziging, opBlur, slaOp, opnieuwLaden }
}
