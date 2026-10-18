'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'

// Een actie naar de API met een nette melding en daarna een verse pagina.
// Een sleutel per knop, zodat alleen die knop "bezig" toont.

export interface Melding {
  soort: 'ok' | 'fout'
  tekst: string
}

export function useActie() {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<Melding | null>(null)

  const doe = useCallback(
    async (sleutel: string, url: string, method: 'POST' | 'PATCH' | 'DELETE', body: unknown, gelukt?: string | ((data: unknown) => string | null)): Promise<boolean> => {
      setBezig(sleutel)
      setMelding(null)
      const uit = await stuur(url, method, body)
      setBezig(null)
      if (!uit.ok) {
        setMelding({ soort: 'fout', tekst: uit.fout })
        return false
      }
      const tekst = typeof gelukt === 'function' ? gelukt(uit.data) : gelukt
      if (tekst) setMelding({ soort: 'ok', tekst })
      router.refresh()
      return true
    },
    [router],
  )

  return { bezig, melding, setMelding, doe }
}
