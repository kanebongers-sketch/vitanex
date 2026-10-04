'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { authFetch } from '@/lib/auth/auth-fetch'
import { leesOverzicht, type OverzichtJson } from '@/lib/lifeos/beleggen/lees'

export type BeleggenStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: OverzichtJson }

/** Ophalen + de schrijfacties van de beleggingskaart. Na elke actie: opnieuw ophalen. */
export function useBeleggen() {
  const [staat, setStaat] = useState<BeleggenStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)

  // Generatieteller (zoals useTaken): een oudere vlucht die later terugkomt wint niet.
  const generatie = useRef(0)
  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/beleggen', leesOverzicht).then((uit) => {
      if (mijn !== generatie.current) return
      setStaat(uit.ok ? { fase: 'ok', data: uit.waarde } : { fase: 'fout', bericht: uit.fout })
    })
  }, [])
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  /** Eén schrijfactie; fout → melding, gelukt → verversen. */
  const doe = useCallback(
    async (pad: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<{ ok: boolean; data: unknown }> => {
      setActieFout(null)
      try {
        const antwoord = await authFetch(pad, { method, body: body === undefined ? undefined : JSON.stringify(body) })
        if (!antwoord.ok) {
          const ruw: unknown = await antwoord.json().catch(() => null)
          const fout = typeof ruw === 'object' && ruw !== null && 'fout' in ruw && typeof ruw.fout === 'string' ? ruw.fout : 'Er ging iets mis.'
          setActieFout(fout)
          return { ok: false, data: null }
        }
        const data: unknown = antwoord.status === 204 ? null : await antwoord.json().catch(() => null)
        await laad()
        return { ok: true, data }
      } catch {
        setActieFout('Geen verbinding.')
        return { ok: false, data: null }
      }
    },
    [laad],
  )

  return { staat, actieFout, opnieuw: laad, doe }
}
