'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { naamVan, type VestigingInfo, type VestigingSleutel } from '@/lib/club/kern/vestigingen'

// De vestigingen van de sportschool die open staat, voor client-componenten.
// De layout van /clubkane vult hem met ClubToegang.vestigingen.

const VestigingenContext = createContext<readonly VestigingInfo[]>([])

export function VestigingenProvider({ vestigingen, children }: { vestigingen: readonly VestigingInfo[]; children: ReactNode }) {
  return <VestigingenContext.Provider value={vestigingen}>{children}</VestigingenContext.Provider>
}

/** De vestigingen van de actieve sportschool, in vaste volgorde. */
export function useVestigingen(): readonly VestigingInfo[] {
  return useContext(VestigingenContext)
}

/** De naam van een vestiging van de actieve sportschool (onbekend = de sleutel). */
export function useVestigingNaam(sleutel: VestigingSleutel): string {
  return naamVan(useVestigingen(), sleutel)
}
