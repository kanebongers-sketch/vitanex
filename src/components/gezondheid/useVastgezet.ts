'use client'

// Vastgezette metrieken per apparaat (localStorage), via useSyncExternalStore
// zodat er geen setState-in-effect nodig is en alle componenten synchroon lopen.

import { useCallback, useSyncExternalStore } from 'react'
import {
  leesVastgezet, wisselVastgezet, STANDAARD_VASTGEZET,
} from '@/lib/gezondheid/vastgezet'
import type { MetriekSleutel } from '@/lib/gezondheid/types'

const OPSLAG_SLEUTEL = 'mf-gezondheid-vastgezet'
const luisteraars = new Set<() => void>()
let cache: { ruw: string | null; lijst: readonly MetriekSleutel[] } = { ruw: null, lijst: STANDAARD_VASTGEZET }

function leesRuw(): string | null {
  try {
    return window.localStorage.getItem(OPSLAG_SLEUTEL)
  } catch {
    return null // privé-venster of geblokkeerde opslag: val terug op de standaard
  }
}

function momentopname(): readonly MetriekSleutel[] {
  const ruw = leesRuw()
  if (ruw !== cache.ruw) cache = { ruw, lijst: leesVastgezet(ruw) ?? STANDAARD_VASTGEZET }
  return cache.lijst
}

function serverMomentopname(): readonly MetriekSleutel[] {
  return STANDAARD_VASTGEZET
}

function abonneer(melding: () => void): () => void {
  luisteraars.add(melding)
  window.addEventListener('storage', melding)
  return () => {
    luisteraars.delete(melding)
    window.removeEventListener('storage', melding)
  }
}

export function useVastgezet(): {
  vastgezet: readonly MetriekSleutel[]
  wissel: (sleutel: MetriekSleutel) => boolean
} {
  const vastgezet = useSyncExternalStore(abonneer, momentopname, serverMomentopname)

  /** Geeft false als opslaan niet lukte, zodat de UI dat eerlijk kan melden. */
  const wissel = useCallback((sleutel: MetriekSleutel): boolean => {
    const nieuw = wisselVastgezet(momentopname(), sleutel)
    try {
      window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(nieuw))
    } catch {
      return false
    }
    luisteraars.forEach((l) => l())
    return true
  }, [])

  return { vastgezet, wissel }
}
