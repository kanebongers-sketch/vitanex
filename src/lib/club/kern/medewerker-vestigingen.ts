// ─── Club: medewerkers en de vestigingen van wie er kijkt (PUUR) ────────────
// Een medewerker-record heeft geen kolom `vestiging` maar een lijst
// `vestigingen` (iemand kan op meer plekken werken). Kane, de eigenaar en de
// clubmanager zien de hele sportschool. Een ingelogde medewerker ziet alleen
// collega's met wie hij minstens een vestiging deelt, en raakt bij een
// wijziging nooit de vestigingen aan die niet van hem zijn.

import { hoortBij, type VestigingInfo } from './vestigingen'

export interface Kijker {
  /** De rol uit ClubToegang; alleen 'medewerker' ziet een deel van de sportschool. */
  rol?: string
  /** De vestigingen die deze persoon ziet (voor een medewerker alleen de eigen). */
  vestigingen: readonly VestigingInfo[]
}

/** Ziet deze persoon de hele sportschool? Iedereen behalve een ingelogde medewerker. */
export function zietHeleSportschool(k: Pick<Kijker, 'rol'>): boolean {
  return k.rol !== 'medewerker'
}

/** Deelt deze collega minstens een vestiging met wie er kijkt? */
export function deeltVestiging(k: Kijker, vestigingenVanCollega: readonly string[]): boolean {
  if (zietHeleSportschool(k)) return true
  return vestigingenVanCollega.some((v) => hoortBij(k.vestigingen, v))
}

/** Alleen de collega's die deze persoon mag zien. */
export function zichtbareMedewerkers<M extends { vestigingen: readonly string[] }>(k: Kijker, lijst: readonly M[]): M[] {
  return zietHeleSportschool(k) ? [...lijst] : lijst.filter((m) => deeltVestiging(k, m.vestigingen))
}

/**
 * De nieuwe vestigingen van een collega na een wijziging door iemand die maar
 * een deel van de sportschool ziet: de vestigingen buiten zijn eigen blijven
 * zoals ze waren (hij kan daar niets toevoegen of weghalen).
 */
export function behoudVreemdeVestigingen(k: Kijker, nieuw: readonly string[], oud: readonly string[]): string[] {
  if (zietHeleSportschool(k)) return [...new Set(nieuw)]
  const eigenNieuw = nieuw.filter((v) => hoortBij(k.vestigingen, v))
  const vreemdOud = oud.filter((v) => !hoortBij(k.vestigingen, v))
  return [...new Set([...eigenNieuw, ...vreemdOud])]
}

/**
 * Welke medewerkers in een koppellijst (bv. van een afspraaktype) veranderen?
 * Toegevoegd en weggehaald samen; ongewijzigde ids tellen niet.
 */
export function gewijzigdeIds(nieuw: readonly string[], oud: readonly string[]): string[] {
  const n = new Set(nieuw)
  const o = new Set(oud)
  return [...new Set([...nieuw.filter((id) => !o.has(id)), ...oud.filter((id) => !n.has(id))])]
}
