'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { BEHEER_ROUTES, ledenRoutes, type LedenappRoutes } from './api-routes'

// Welke API de ledenapp-componenten aanroepen. Zonder provider: de beheerder-
// routes van de voorvertoning in Club. In /mijn zet de layout de leden-API.

const Context = createContext<LedenappRoutes>(BEHEER_ROUTES)

interface Props {
  /** Alleen bij Kane in de voorvertoning van /mijn: het lid waarmee hij meekijkt. */
  voor: string | null
  children: ReactNode
}

export function LedenApiProvider({ voor, children }: Props) {
  const routes = useMemo(() => ledenRoutes(voor), [voor])
  return <Context.Provider value={routes}>{children}</Context.Provider>
}

export function useLedenappApi(): LedenappRoutes {
  return useContext(Context)
}
