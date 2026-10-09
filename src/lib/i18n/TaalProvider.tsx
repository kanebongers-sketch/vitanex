'use client'

// Geeft de gekozen taal en het woordenboek door aan alle client-componenten.
// De root-layout (server) bepaalt de taal en laadt alleen dat ene woordenboek.

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { TAAL_COOKIE, TAAL_COOKIE_MAX_AGE, type Richting, type Taal } from './talen'
import { vertaal, type Params, type Woordenboek } from './vertaal'

interface TaalContext {
  taal: Taal
  richting: Richting
  t: (sleutel: string, params?: Params) => string
}

const Context = createContext<TaalContext | null>(null)

interface TaalProviderProps {
  taal: Taal
  richting: Richting
  woordenboek: Woordenboek
  bron: Woordenboek
  children: ReactNode
}

export function TaalProvider({ taal, richting, woordenboek, bron, children }: TaalProviderProps) {
  const t = useCallback((sleutel: string, params?: Params) => vertaal(woordenboek, bron, sleutel, params), [woordenboek, bron])
  const waarde = useMemo(() => ({ taal, richting, t }), [taal, richting, t])
  return <Context.Provider value={waarde}>{children}</Context.Provider>
}

/** t('nav.home'). Buiten een provider (tests, losse previews) valt hij terug op de sleutel. */
export function useVertaling(): TaalContext {
  return useContext(Context) ?? { taal: 'nl', richting: 'ltr', t: (sleutel) => sleutel }
}

/** Zet de taalkeuze en laadt de pagina opnieuw, zodat ook server-teksten wisselen. */
export function kiesTaal(taal: Taal): void {
  document.cookie = `${TAAL_COOKIE}=${taal}; path=/; max-age=${TAAL_COOKIE_MAX_AGE}; samesite=lax`
  window.location.reload()
}
