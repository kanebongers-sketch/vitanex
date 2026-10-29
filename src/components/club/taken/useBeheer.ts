'use client'

// Een beheeractie: verzoek naar de API, daarna router.refresh() zodat de
// servercomponenten de nieuwe stand tonen. Fouten als nette zin.

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { vraag, type Antwoord } from './vraag'

export function useBeheer() {
  const router = useRouter()
  const taal = useTaal()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const stuur = useCallback(
    async (url: string, method: 'POST' | 'PATCH', body: unknown): Promise<Antwoord> => {
      setBezig(true)
      setFout(null)
      const uit = await vraag(url, method, body, taal)
      setBezig(false)
      if (uit.ok) startTransition(() => router.refresh())
      else setFout(uit.fout)
      return uit
    },
    [router, taal],
  )

  return { bezig, fout, setFout, stuur }
}
