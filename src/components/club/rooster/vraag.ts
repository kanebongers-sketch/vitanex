'use client'

// Mutaties van het rooster en de instellingen: fetch naar de eigen club-API,
// daarna router.refresh() zodat de servercomponenten de nieuwe stand tonen.
// Fouten komen als nette Nederlandse zin terug (de API geeft { fout }).

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type Antwoord = { ok: true; data: unknown } | { ok: false; fout: string }

export async function stuur(url: string, method: 'POST' | 'PATCH' | 'PUT', body?: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return { ok: false, fout: fout ?? 'Er ging iets mis. Probeer het opnieuw.' }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

/** Een actie met bezig-staat, foutmelding en verversen na succes. */
export function useClubActie() {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const voerUit = useCallback(
    async (actie: () => Promise<Antwoord>): Promise<Antwoord> => {
      setBezig(true)
      setFout(null)
      const uit = await actie()
      setBezig(false)
      if (uit.ok) startTransition(() => router.refresh())
      else setFout(uit.fout)
      return uit
    },
    [router],
  )

  return { bezig, fout, setFout, voerUit }
}
