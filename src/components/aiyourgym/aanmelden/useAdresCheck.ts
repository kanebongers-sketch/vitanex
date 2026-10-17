'use client'

import { useEffect, useState } from 'react'
import { leesSlug } from '@/lib/club/kern/subdomein'

// Is naam.aiyourgym.com nog vrij? Eerst de vorm in de browser (geen verzoek
// voor een ongeldig adres), daarna na een korte pauze in het typen de server.

export type AdresStatus = 'leeg' | 'ongeldig' | 'controleren' | 'vrij' | 'bezet' | 'onbekend'

export interface AdresCheck {
  status: AdresStatus
  melding: string | null
}

const PAUZE_MS = 450

export function useAdresCheck(slug: string): AdresCheck {
  const [uitslag, setUitslag] = useState<{ slug: string; check: AdresCheck } | null>(null)
  const vorm = slug ? leesSlug(slug) : null
  const geldig = vorm?.ok ? vorm.slug : null

  useEffect(() => {
    if (!geldig) return
    const gewenst = geldig
    const stop = new AbortController()
    const wacht = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/aiyourgym/beschikbaar?slug=${encodeURIComponent(gewenst)}`, { signal: stop.signal, cache: 'no-store' })
        const json = (await res.json().catch(() => null)) as { vrij?: unknown; fout?: unknown } | null
        const check: AdresCheck = !res.ok
          ? { status: 'onbekend', melding: 'Kon niet controleren. We kijken het bij het versturen opnieuw na.' }
          : json?.vrij === true
            ? { status: 'vrij', melding: 'Dit adres is vrij.' }
            : { status: 'bezet', melding: typeof json?.fout === 'string' ? json.fout : 'Dit adres is al bezet.' }
        setUitslag({ slug: gewenst, check })
      } catch {
        if (!stop.signal.aborted) setUitslag({ slug: gewenst, check: { status: 'onbekend', melding: 'Kon niet controleren. We kijken het bij het versturen opnieuw na.' } })
      }
    }, PAUZE_MS)
    return () => {
      stop.abort()
      window.clearTimeout(wacht)
    }
  }, [geldig])

  if (!slug) return { status: 'leeg', melding: null }
  if (!vorm?.ok) return { status: 'ongeldig', melding: vorm && !vorm.ok ? vorm.fout : null }
  if (uitslag?.slug === vorm.slug) return uitslag.check
  return { status: 'controleren', melding: 'Even kijken of dit adres vrij is.' }
}
