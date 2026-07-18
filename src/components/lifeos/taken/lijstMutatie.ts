// ─── LifeOS — kleine, pure operaties op de takenlijst ───────────────────────
// Geïsoleerd uit `useTaken` zodat de optimistische updates en de rollback
// testbaar zijn zónder React of database. De kern: elke operatie raakt PRECIES
// één taak en laat elke andere taak ongemoeid — daar hangt de correctheid van
// gelijktijdige mutaties aan.
//
// Waarom dit ertoe doet: `useTaken` werkt optimistisch. Overlappen twee mutaties
// en faalt er één, dan mag de rollback alleen díe ene taak terugdraaien. Een
// rollback naar een hele-lijst-snapshot zou de andere, geslaagde wijziging
// meesleuren — die zag je dan spontaan terugspringen zonder reden. Door per taak
// te werken blijft een niet-gerelateerde gelijktijdige wijziging staan.

import type { Taak } from '@/lib/lifeos/taken/taken'

/**
 * Vervang de taak met dit id door `vervanger`; laat elke andere taak exact staan.
 * Gebruikt voor de optimistische update én voor de per-taak-rollback.
 */
export function vervangTaak(taken: readonly Taak[], id: string, vervanger: Taak): Taak[] {
  return taken.map((t) => (t.id === id ? vervanger : t))
}

/** Haal de taak met dit id uit de lijst; de rest blijft op volgorde staan. */
export function verwijderTaak(taken: readonly Taak[], id: string): Taak[] {
  return taken.filter((t) => t.id !== id)
}

/**
 * Zet een verwijderde taak terug op zijn oude plek (geklemd binnen de lijst) —
 * de rollback van een mislukte verwijdering. Staat de taak er al (bv. doordat een
 * gelijktijdige herlaad 'm alweer binnenhaalde), dan verandert er niets: nooit
 * een dubbele rij.
 */
export function herstelTaak(taken: readonly Taak[], taak: Taak, index: number): Taak[] {
  if (taken.some((t) => t.id === taak.id)) return taken.slice()
  const plek = Math.min(Math.max(index, 0), taken.length)
  const kopie = taken.slice()
  kopie.splice(plek, 0, taak)
  return kopie
}
