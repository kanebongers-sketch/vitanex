'use client'

// ─── LifeOS — CRM: bord-weergave-state (client) ─────────────────────────────
// De keuze-state (zoeken, "alleen opvolgen", sortering) voor de gereedschapsbalk
// van één bord. De filter/sorteer-fúncties leven puur in `weergave.ts`; deze hook
// levert enkel de keuze + de setters. `GroepBord` past ze zelf toe.
//
// Bewust LOKALE state (geen URL-state): de bord-kop is één kaart tussen vele op
// /home. URL-params zouden botsen met de andere kaarten en de deel-URL vertroebelen;
// per bord een eigen zoek/sortering in de URL is hier meer last dan nut. Zie
// architecture.md — URL-state alleen waar deelbaar/zinvol.

import { useCallback, useState } from 'react'
import { LEGE_WEERGAVE, type Sortering, type WeergaveKeuze } from '@/components/lifeos/crm/weergave'

export interface BordWeergave {
  keuze: WeergaveKeuze
  setZoek: (zoek: string) => void
  setAlleenOpvolgen: (aan: boolean) => void
  setSortering: (s: Sortering) => void
}

export function useBordWeergave(): BordWeergave {
  const [keuze, setKeuze] = useState<WeergaveKeuze>(LEGE_WEERGAVE)

  // Immutable updates: elke setter maakt een nieuw object; de vorige keuze
  // (incl. het bevroren LEGE_WEERGAVE) wordt nooit gemuteerd.
  const setZoek = useCallback((zoek: string) => {
    setKeuze((vorige) => ({ ...vorige, zoek }))
  }, [])

  const setAlleenOpvolgen = useCallback((aan: boolean) => {
    setKeuze((vorige) => ({ ...vorige, alleenOpvolgen: aan }))
  }, [])

  const setSortering = useCallback((s: Sortering) => {
    setKeuze((vorige) => ({ ...vorige, sortering: s }))
  }, [])

  return { keuze, setZoek, setAlleenOpvolgen, setSortering }
}
