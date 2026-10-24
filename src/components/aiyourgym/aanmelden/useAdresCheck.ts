'use client'

import { useEffect, useState } from 'react'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { kiesMeldingen, meldingIn } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// Is dit adres (aiyourgym.com/naam, later naam.aiyourgym.com) nog vrij? Eerst de vorm in de browser (geen verzoek
// voor een ongeldig adres), daarna na een korte pauze in het typen de server.

export type AdresStatus = 'leeg' | 'ongeldig' | 'controleren' | 'vrij' | 'bezet' | 'onbekend'

export interface AdresCheck {
  status: AdresStatus
  melding: string | null
}

const PAUZE_MS = 450

export function useAdresCheck(slug: string): AdresCheck {
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]
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
        const json = (await res.json().catch(() => null)) as { vrij?: unknown } | null
        const fout = kiesMeldingen(json, taal).fout
        const check: AdresCheck = !res.ok
          ? { status: 'onbekend', melding: t.adresOnbekend }
          : json?.vrij === true
            ? { status: 'vrij', melding: t.adresVrij }
            : { status: 'bezet', melding: fout ?? t.adresBezet }
        setUitslag({ slug: gewenst, check })
      } catch {
        if (!stop.signal.aborted) setUitslag({ slug: gewenst, check: { status: 'onbekend', melding: t.adresOnbekend } })
      }
    }, PAUZE_MS)
    return () => {
      stop.abort()
      window.clearTimeout(wacht)
    }
  }, [geldig, taal, t])

  if (!slug) return { status: 'leeg', melding: null }
  if (!vorm?.ok) return { status: 'ongeldig', melding: vorm && !vorm.ok ? meldingIn(vorm.fout, taal) : null }
  if (uitslag?.slug === vorm.slug) return uitslag.check
  return { status: 'controleren', melding: t.adresControleren }
}
