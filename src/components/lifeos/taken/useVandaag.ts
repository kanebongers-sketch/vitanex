'use client'

import { useSyncExternalStore } from 'react'
import { datumSleutel } from '@/lib/lifeos/datum/datum'

// De dag van vandaag volgens de browser — of `null` zolang we op de server zijn.
//
// ─── WAAROM DIT GEEN useState + useEffect IS ────────────────────────────────
//
//   `datumSleutel(new Date())` tijdens de render geeft op de server de SERVERtijd
//   en in de browser de jouwe. Rond middernacht (of op een server in UTC) zijn
//   dat verschillende dagen, en dan hydrateert React een lijst voor gisteren.
//
//   De klassieke ontwijking is `useState(null)` + `useEffect(() => setVandaag(…))`,
//   maar dat is precies het patroon waar React (en de lint-regel
//   `react-hooks/set-state-in-effect`) tegen waarschuwt: een render, dan een
//   effect, dan nóg een render.
//
//   `useSyncExternalStore` is waar dit hoort: het KENT het verschil tussen server
//   en client. De server-snapshot is `null` (toon de skelet), de client-snapshot
//   is de echte dag. Eén render, geen mismatch, geen cascade.

/**
 * Geen abonnement: de dag verandert niet tijdens je sessie. Op moduleniveau
 * zodat React niet elke render opnieuw "abonneert".
 */
const geenAbonnement = () => () => {}

/** Op de server weten we de dag van de gebruiker niet. Dat is `null`, geen gok. */
const opDeServer = () => null

/**
 * De dagsleutel (YYYY-MM-DD) in de tijdzone van de browser, of `null` tijdens
 * server-rendering.
 *
 * `datumSleutel(new Date())` levert elke aanroep dezelfde string binnen dezelfde
 * dag; React vergelijkt snapshots met `Object.is` en strings zijn gelijk op
 * waarde, dus dit lust geen oneindige render-lus.
 */
export function useVandaag(): string | null {
  return useSyncExternalStore(geenAbonnement, () => datumSleutel(new Date()), opDeServer)
}
