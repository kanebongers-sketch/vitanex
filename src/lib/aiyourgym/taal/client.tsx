'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { STANDAARD_TAAL, TAAL_COOKIE, TAAL_COOKIE_MAX_AGE, type Taal } from './taal'
import { tekst, type Woordenboek } from './woordenboek'

// ─── AI Your Gym: de taal in clientcomponenten ──────────────────────────────
// De root layouts van (aiyourgym) zetten <AygTaal taal={...}> om de pagina; de
// taal komt op de server uit getSiteTaal() (website) of getTaal() (Club en
// ledenapp). Clientcomponenten lezen hem met useTaal() of useTekst(BOEK).
// Eigen context, los van de MentaForce-i18n.

const TaalContext = createContext<Taal>(STANDAARD_TAAL)

interface AygTaalProps {
  taal: Taal
  children: ReactNode
}

export function AygTaal({ taal, children }: AygTaalProps) {
  return <TaalContext.Provider value={taal}>{children}</TaalContext.Provider>
}

/** De taal van deze pagina. */
export function useTaal(): Taal {
  return useContext(TaalContext)
}

/** De teksten van een woordenboek in de taal van deze pagina. */
export function useTekst<T>(boek: Woordenboek<T>): T {
  return tekst(boek, useContext(TaalContext))
}

/** Bewaar de gekozen taal als voorkeur (cookie ayg-taal, een jaar). */
export function bewaarTaalVoorkeur(taal: Taal): void {
  const veilig = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${TAAL_COOKIE}=${taal}; Path=/; Max-Age=${TAAL_COOKIE_MAX_AGE}; SameSite=Lax${veilig}`
}
