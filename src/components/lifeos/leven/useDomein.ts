'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Laden van één domein ───────────────────────────────────────────────────
// Drie domeinen halen data op, en zonder dit staat het laad/fout/ok-dansje
// (inclusief de generatie-teller tegen verouderde antwoorden) drie keer
// overgeschreven. Precies de duplicatie die deze codebase al drie keer heeft
// opgelopen met `isObject`.
//
// Fout en leeg blijven strikt gescheiden: `fout` betekent dat wíj het niet
// konden ophalen. "Je hebt nog niets gelogd" is data, geen fout, en die komt
// gewoon als `ok` binnen met lege waarden erin.

export type DomeinStaat<T> =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: T }

export type DomeinUitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/**
 * @param haal Moet stabiel zijn (module-niveau of `useCallback`), anders laadt
 *             de hook bij elke render opnieuw.
 */
export function useDomein<T>(haal: () => Promise<DomeinUitkomst<T>>) {
  const [staat, setStaat] = useState<DomeinStaat<T>>({ fase: 'laden' })
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haal().then((uitkomst) => {
      // Een antwoord van een verlopen laadronde negeren: anders overschrijft een
      // trage eerste fetch de verse tweede.
      if (mijn !== generatie.current) return
      setStaat(uitkomst.ok ? { fase: 'ok', data: uitkomst.waarde } : { fase: 'fout', bericht: uitkomst.fout })
    })
  }, [haal])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return { staat, opnieuw }
}
