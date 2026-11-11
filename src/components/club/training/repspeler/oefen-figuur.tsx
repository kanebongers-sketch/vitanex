'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { OefenFiguur } from '@/components/aiyourgym/inhoud/oefenrenders'
import { repRenderVoor, type RepRender } from './render-bron'

// Het figuur in de oefenbeelden voor dit deel van de app. De server zet het op
// basis van de sportschool (figuurVanSportschool, in de layout van Club en in de
// ledenapp). Zonder provider neutraal, zodat een vergeten plek nooit het figuur
// van Fit Factory bij een andere sportschool laat zien.
// Geen zware imports: dit bestand gaat mee naar de browser.

const FiguurContext = createContext<OefenFiguur>('neutraal')

export function OefenFiguurProvider({ figuur, children }: { figuur: OefenFiguur; children: ReactNode }) {
  return <FiguurContext.Provider value={figuur}>{children}</FiguurContext.Provider>
}

/**
 * Bewegende oefenbeelden (frames en lussen) staan tot de livegang niet in git en dus niet
 * op de server (besluit Kane 11-11-2026: de deploy op Render werd te traag). Alleen met
 * NEXT_PUBLIC_OEFENBEELDEN_BEWEGEND=1 speelt de rep-speler; anders toont hij het stilstaande
 * beginbeeld (de stilstaande beelden staan wel in git).
 */
export const BEWEGENDE_OEFENBEELDEN = process.env.NEXT_PUBLIC_OEFENBEELDEN_BEWEGEND === '1'

/** De render met losse frames bij een oefening, in het figuur van de sportschool, of null. */
export function useRepRender(naam: string): RepRender | null {
  return repRenderVoor(naam, useContext(FiguurContext))
}
