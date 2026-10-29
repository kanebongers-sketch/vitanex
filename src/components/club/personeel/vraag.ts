'use client'

// Mutaties van het personeelsrooster: fetch naar /api/club/personeel en daarna
// router.refresh(). Fouten komen als nette zin terug in de taal van de pagina.

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

export type Antwoord = { ok: true; data: unknown } | { ok: false; fout: string }

export const API = '/api/club/personeel'

/** De taal van de pagina in de browser (<html lang>, gezet uit de cookie ayg-taal); buiten de browser Nederlands. */
function paginaTaal(): Taal {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'nl'
}

export async function stuur(url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<Antwoord> {
  const t = PERSONEEL[paginaTaal()].algemeen
  try {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return { ok: false, fout: fout ?? t.fout }
  } catch {
    return { ok: false, fout: t.verbinding }
  }
}

/** Een getal uit een API-antwoord ({ toegevoegd: 12 }), of null. */
export function getalUit(data: unknown, sleutel: string): number | null {
  if (typeof data !== 'object' || data === null || !(sleutel in data)) return null
  const v: unknown = (data as Record<string, unknown>)[sleutel]
  return typeof v === 'number' ? v : null
}

/** Een actie met bezig-staat, foutmelding en verversen na succes. */
export function useActie() {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const voerUit = useCallback(
    async (actie: () => Promise<Antwoord>, naSucces?: (data: unknown) => void): Promise<Antwoord> => {
      setBezig(true)
      setFout(null)
      const uit = await actie()
      setBezig(false)
      if (uit.ok) {
        naSucces?.(uit.data)
        startTransition(() => router.refresh())
      } else setFout(uit.fout)
      return uit
    },
    [router],
  )

  return { bezig, fout, setFout, voerUit }
}
