'use client'

// Wie er op dit apparaat afvinkt, onthouden in localStorage (per vestiging).
// Een tablet aan de balie gaat van hand tot hand, dus de keuze blijft altijd
// zichtbaar en is met een tik te wisselen. localStorage kan ontbreken of
// geblokkeerd zijn (privevenster): dan werkt alles, alleen zonder onthouden.

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import type { Persoon } from '@/lib/club/taken/invoer'

const GEBEURTENIS = 'club-taken-persoon'

function sleutel(vestiging: string): string {
  return `club-taken-persoon:${vestiging}`
}

function lees(vestiging: string): string | null {
  try {
    return window.localStorage.getItem(sleutel(vestiging))
  } catch {
    return null
  }
}

function schrijf(vestiging: string, persoon: Persoon | null): void {
  try {
    if (persoon) window.localStorage.setItem(sleutel(vestiging), JSON.stringify(persoon))
    else window.localStorage.removeItem(sleutel(vestiging))
  } catch {
    // Opslaan kan niet (privevenster of vol): de keuze geldt dan alleen nu.
  }
}

function abonneer(melding: () => void): () => void {
  window.addEventListener('storage', melding)
  window.addEventListener(GEBEURTENIS, melding)
  return () => {
    window.removeEventListener('storage', melding)
    window.removeEventListener(GEBEURTENIS, melding)
  }
}

function ontleed(ruw: string | null): Persoon | null {
  if (!ruw) return null
  try {
    const v: unknown = JSON.parse(ruw)
    if (typeof v !== 'object' || v === null) return null
    const wie = 'wie' in v && typeof v.wie === 'string' && v.wie.trim() ? v.wie.trim().slice(0, 80) : null
    const id = 'medewerkerId' in v && typeof v.medewerkerId === 'string' ? v.medewerkerId : null
    return wie ? { wie, medewerkerId: id } : null
  } catch {
    return null
  }
}

/** De gekozen persoon op dit apparaat en een functie om te wisselen. Zonder opslag geldt de keuze alleen in deze sessie. */
export function usePersoon(vestiging: string): [Persoon | null, (p: Persoon | null) => void] {
  const ruw = useSyncExternalStore(
    abonneer,
    () => lees(vestiging),
    () => null,
  )
  const [sessie, setSessie] = useState<Persoon | null>(null)
  const opgeslagen = useMemo(() => ontleed(ruw), [ruw])
  const zet = useCallback(
    (p: Persoon | null) => {
      setSessie(p)
      schrijf(vestiging, p)
      window.dispatchEvent(new Event(GEBEURTENIS))
    },
    [vestiging],
  )
  return [sessie ?? opgeslagen, zet]
}
