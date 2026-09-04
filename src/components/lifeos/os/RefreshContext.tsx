'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

// ─── Auto-refresh voor de cockpit ───────────────────────────────────────────
// De kaarten in de cockpit zijn losse client-eilanden die zichzelf ophalen. Ze
// deden dat één keer bij mount en daarna nooit meer: liet je het dashboard open
// staan, dan verouderde je agenda, inbox en taken zonder dat je het zag.
//
// Deze provider geeft één gedeeld `signaal` (een teller) dat elke `INTERVAL_MS`
// omhoogtikt. Een kaart neemt `useRefreshSignaal()` op in de deps van haar
// laad-effect; als het signaal verandert, haalt ze opnieuw op. Meer niet — geen
// nieuwe fetch-laag, geen refactor van elke kaart.
//
// BEWUST GEEN REMOUNT. We tikken alleen een getal op; de kaart herhaalt haar
// eigen `laad()`. Zou de provider de kaarten opnieuw monteren (via `key`), dan
// verloor je bij elke tik wat je aan het typen bent in Vang op of het Vita-
// gesprek. Nu blijft alle invoer staan: alleen de gelezen data ververst. De
// kaarten vangen races al af met hun generatieteller, dus een tik die een
// nog-lopende fetch inhaalt kan geen verouderde data laten winnen.
//
// PAUZEERT OP DE ACHTERGROND. Een verborgen tabblad hoeft Gmail en Google Agenda
// niet elke 5 minuten te bevragen. We slaan tikken over terwijl de tab verborgen
// is, en verversen meteen zodra je terugkomt en er minstens één interval voorbij
// is — anders staat er verouderde data te wachten tot de volgende tik.

/** Vijf minuten. Kort genoeg om vers te blijven, ruim genoeg om niet te bevragen om het bevragen. */
const INTERVAL_MS = 5 * 60 * 1000

// Default 0: een kaart die buiten de provider gerenderd wordt, tikt simpelweg
// nooit — ze werkt gewoon zonder auto-refresh, geen fout.
const RefreshContext = createContext<number>(0)

/** Het gedeelde refresh-signaal. Zet 'm in de deps van je laad-effect om mee te verversen. */
export function useRefreshSignaal(): number {
  return useContext(RefreshContext)
}

interface RefreshProviderProps {
  children: ReactNode
  /** Overschrijfbaar voor tests; standaard 5 minuten. */
  intervalMs?: number
}

export function RefreshProvider({ children, intervalMs = INTERVAL_MS }: RefreshProviderProps) {
  const [signaal, setSignaal] = useState(0)
  // Wanneer we voor het laatst tikten. In een ref: het stuurt geen render, het
  // beslist alleen of terugkeer naar de tab een verse tik verdient.
  const laatsteTik = useRef(Date.now())

  useEffect(() => {
    if (typeof document === 'undefined') return

    function tik() {
      laatsteTik.current = Date.now()
      setSignaal((n) => n + 1)
    }

    // Het interval loopt altijd, maar tikt alleen als de tab zichtbaar is: een
    // achtergrondtab ververst niet.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') tik()
    }, intervalMs)

    // Terug op de tab en het is minstens een interval geleden? Meteen verversen
    // i.p.v. wachten op de volgende tik.
    function opZichtbaar() {
      if (document.visibilityState === 'visible' && Date.now() - laatsteTik.current >= intervalMs) {
        tik()
      }
    }
    document.addEventListener('visibilitychange', opZichtbaar)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', opZichtbaar)
    }
  }, [intervalMs])

  return <RefreshContext.Provider value={signaal}>{children}</RefreshContext.Provider>
}
