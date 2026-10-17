'use client'

import { useEffect, useState } from 'react'
import type { Coaching } from '@/lib/club/training/coaching/typen'

// Haalt de coaching van een oefening op zodra die open gaat. Eenmaal opgehaald
// blijft het in het geheugen, zodat heen en weer klikken direct is. De staat is
// afgeleid van de naam: een andere oefening toont meteen "laden" of het
// onthouden antwoord, zonder extra render.

export type CoachingStaat = { status: 'laden' } | { status: 'klaar'; coaching: Coaching | null } | { status: 'fout' }

const GEHEUGEN = new Map<string, Coaching | null>()

function leesAntwoord(data: unknown): Coaching | null | undefined {
  if (typeof data !== 'object' || data === null || !('coaching' in data)) return undefined
  const c = (data as { coaching: unknown }).coaching
  if (c === null) return null
  return typeof c === 'object' && Array.isArray((c as Coaching).kernpunten) ? (c as Coaching) : undefined
}

export function useCoaching(naam: string): CoachingStaat {
  const [fout, setFout] = useState<string | null>(null)
  const [, setGeladen] = useState(0)

  useEffect(() => {
    if (GEHEUGEN.has(naam)) return
    const stop = new AbortController()
    fetch(`/api/club/training/coaching?naam=${encodeURIComponent(naam)}`, { signal: stop.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const coaching = leesAntwoord(data)
        if (coaching === undefined) return setFout(naam)
        GEHEUGEN.set(naam, coaching)
        setGeladen((n) => n + 1)
      })
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setFout(naam)
      })
    return () => stop.abort()
  }, [naam])

  if (GEHEUGEN.has(naam)) return { status: 'klaar', coaching: GEHEUGEN.get(naam) ?? null }
  return fout === naam ? { status: 'fout' } : { status: 'laden' }
}
