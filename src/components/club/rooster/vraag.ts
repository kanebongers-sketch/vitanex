'use client'

// Mutaties van het rooster en de instellingen: fetch naar de eigen club-API,
// daarna router.refresh() zodat de servercomponenten de nieuwe stand tonen.
// Fouten komen als nette zin in de taal van de pagina terug (de API geeft { fout }).

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

/** De vaste foutzinnen in de taal van de pagina (<html lang>, gezet door de root layout). */
function verbindingTekst() {
  const taal = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'nl'
  return ROOSTER[taal].verbinding
}

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
    return { ok: false, fout: fout ?? verbindingTekst().mis }
  } catch {
    return { ok: false, fout: verbindingTekst().geen }
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
