'use client'

import { useEffect, useState } from 'react'
import type { Coaching } from '@/lib/club/training/coaching/typen'

// Haalt de coaching van een oefening op zodra die open gaat. Eenmaal opgehaald
// blijft het in het geheugen, zodat heen en weer klikken direct is. De staat is
// afgeleid van de naam: een andere oefening toont meteen "laden" of het
// onthouden antwoord, zonder extra render. Na opslaan: vergeetCoaching(naam).

export interface GeladenCoaching {
  coaching: Coaching | null
  /** Eigen coaching van de sportschool (in plaats van de standaard). */
  eigen: boolean
}

export type CoachingStaat = { status: 'laden' } | ({ status: 'klaar' } & GeladenCoaching) | { status: 'fout' }

const GEHEUGEN = new Map<string, GeladenCoaching>()

function leesAntwoord(data: unknown): GeladenCoaching | undefined {
  if (typeof data !== 'object' || data === null || !('coaching' in data)) return undefined
  const { coaching: c, eigen } = data as { coaching: unknown; eigen?: unknown }
  if (c === null) return { coaching: null, eigen: false }
  if (typeof c !== 'object' || !Array.isArray((c as Coaching).kernpunten)) return undefined
  return { coaching: c as Coaching, eigen: eigen === true }
}

/** Na het opslaan of terugzetten: de volgende keer opnieuw ophalen. */
export function vergeetCoaching(naam: string): void {
  GEHEUGEN.delete(naam)
}

export function useCoaching(naam: string, versie = 0): CoachingStaat {
  const [fout, setFout] = useState<string | null>(null)
  const [, setGeladen] = useState(0)

  useEffect(() => {
    if (GEHEUGEN.has(naam)) return
    const stop = new AbortController()
    fetch(`/api/club/training/coaching?naam=${encodeURIComponent(naam)}`, { signal: stop.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const geladen = leesAntwoord(data)
        if (geladen === undefined) return setFout(naam)
        GEHEUGEN.set(naam, geladen)
        setGeladen((n) => n + 1)
      })
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setFout(naam)
      })
    return () => stop.abort()
  }, [naam, versie])

  const geladen = GEHEUGEN.get(naam)
  if (geladen) return { status: 'klaar', ...geladen }
  return fout === naam ? { status: 'fout' } : { status: 'laden' }
}
