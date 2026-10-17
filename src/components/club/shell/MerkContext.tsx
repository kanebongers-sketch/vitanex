'use client'

import { createContext, useContext, type ReactNode } from 'react'

// Het merk van de sportschool die open staat (naam en logo), voor
// client-componenten zoals het geprinte schema. De layout vult hem.

export interface ClubMerk {
  naam: string
  /** URL van het geuploade logo, of null. */
  logoUrl: string | null
  /** Het ingebouwde Fit Factory-logo. */
  fitFactory: boolean
}

const MerkContext = createContext<ClubMerk>({ naam: 'Club', logoUrl: null, fitFactory: false })

export function MerkProvider({ merk, children }: { merk: ClubMerk; children: ReactNode }) {
  return <MerkContext.Provider value={merk}>{children}</MerkContext.Provider>
}

export function useMerk(): ClubMerk {
  return useContext(MerkContext)
}
