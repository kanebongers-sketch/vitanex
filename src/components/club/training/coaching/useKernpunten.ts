'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLedenappApi } from '@/components/club/app/LedenappApi'

// De kernpunten van alle oefeningen in een schema, voor op papier.
// Een verzoek voor het hele schema; mislukt het, dan print het schema gewoon zonder.

export type KernpuntenPerNaam = Readonly<Record<string, readonly string[]>>

function leesAntwoord(data: unknown): KernpuntenPerNaam {
  if (typeof data !== 'object' || data === null || !('kernpunten' in data)) return {}
  const ruw = (data as { kernpunten: unknown }).kernpunten
  if (typeof ruw !== 'object' || ruw === null) return {}
  return Object.fromEntries(
    Object.entries(ruw).filter((e): e is [string, string[]] => Array.isArray(e[1]) && e[1].every((p) => typeof p === 'string')),
  )
}

export function useKernpunten(namen: readonly string[]): KernpuntenPerNaam {
  const sleutel = useMemo(() => [...new Set(namen.map((n) => n.trim()).filter((n) => n.length > 0 && n.length <= 80))].sort().join('\n'), [namen])
  const [kernpunten, setKernpunten] = useState<KernpuntenPerNaam>({})
  const api = useLedenappApi()

  useEffect(() => {
    if (!sleutel) return
    const zoek = new URLSearchParams(sleutel.split('\n').slice(0, 60).map((n) => ['kern', n]))
    const stop = new AbortController()
    fetch(api.coaching(zoek), { signal: stop.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => setKernpunten(leesAntwoord(data)))
      .catch(() => undefined)
    return () => stop.abort()
  }, [sleutel, api])

  return kernpunten
}
