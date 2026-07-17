'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import type { HistorieItem } from '@/lib/lifeos/crm/crm'
import { leesHistorieAntwoord, leesHistorieItemAntwoord } from './lees'

// De status-geschiedenis van één persoon, geladen zodra de popup opent. Laden,
// een losse notitie toevoegen, en stil herladen ná een statuswissel (die de
// server als historie-item wegschrijft — anders zou de tijdlijn de wissel die je
// net deed niet tonen).

export type HistorieStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; items: HistorieItem[] }

export interface HistorieBediening {
  staat: HistorieStaat
  actieFout: string | null
  bezig: boolean
  opnieuw: () => void
  /** Stil verversen (behoudt de huidige lijst tot de nieuwe binnen is). */
  herlaad: () => void
  voegNotitieToe: (notitie: string) => Promise<boolean>
}

export function useHistorie(persoonId: string): HistorieBediening {
  const [staat, setStaat] = useState<HistorieStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`/api/lifeos/crm/personen/${persoonId}/historie`, leesHistorieAntwoord).then(
      (uitkomst) => {
        if (mijn !== generatie.current) return
        setStaat(
          uitkomst.ok
            ? { fase: 'ok', items: uitkomst.waarde }
            : { fase: 'fout', bericht: uitkomst.fout },
        )
      },
    )
  }, [persoonId])

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

  const herlaad = useCallback(() => {
    void laad()
  }, [laad])

  const voegNotitieToe = useCallback(
    async (notitie: string): Promise<boolean> => {
      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson(`/api/lifeos/crm/personen/${persoonId}/historie`, leesHistorieItemAntwoord, {
        method: 'POST',
        body: JSON.stringify({ soort: 'notitie', notitie }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return false
      }

      const item = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok' ? { fase: 'ok', items: [item, ...huidig.items] } : huidig,
      )
      return true
    },
    [persoonId],
  )

  return { staat, actieFout, bezig, opnieuw, herlaad, voegNotitieToe }
}
