// ─── Club: wie is er binnen (PUUR) ──────────────────────────────────────────
// De enige plek die naar t.rol kijkt (bewaker: rol-bewaker.test.ts). Met het
// rollenmodel v2 (t.profiel) tellen de rollen van het profiel; zonder v2 de
// soort sessie zoals voor 29-10-2026 (beheerder eigenaar of clubmanager, medewerker).

import { minstens, type Niveau, type Rol } from './typen'

/** Het profiel van wie er binnen is (alleen met de schakelaar CLUB_ROLLEN_V2 aan). */
export interface ProfielToegang {
  /** Het id in club_medewerkers; null als een beheerder (nog) geen profiel heeft. */
  id: string | null
  rollen: Rol[]
  /** Per sleutel (RECHT_SLEUTELS) het niveau: afgenomen EN aan EN een recht via een rol. */
  niveaus: Readonly<Record<string, Niveau>>
  /** De startpagina (pad binnen /club, met eventueel ?tab=). */
  start: string
  /** Werkt op alle vestigingen, ook nieuwe. */
  alleVestigingen: boolean
}

export interface Wie {
  isPlatformEigenaar: boolean
  rol: 'beheerder' | 'eigenaar' | 'clubmanager' | 'medewerker'
  profiel?: ProfielToegang | null
}

/** Een ingelogde medewerker (sessie via club_medewerker_toegang). */
export function isMedewerkerSessie(t: Pick<Wie, 'rol'>): boolean {
  return t.rol === 'medewerker'
}

/** Kane of een eigenaar van de sportschool. */
export function isEigenaar(t: Wie): boolean {
  if (t.isPlatformEigenaar) return true
  if (t.profiel) return t.profiel.rollen.includes('eigenaar')
  return t.rol === 'eigenaar'
}

/** Kane, een eigenaar of een clubmanager. */
export function isLeiding(t: Wie): boolean {
  if (isEigenaar(t)) return true
  if (t.profiel) return t.profiel.rollen.includes('manager')
  return t.rol === 'clubmanager'
}

/** Een beheerder (eigenaar of clubmanager met een eigen beheerderslogin), los van de rollen. */
export function isClubmanagerSessie(t: Pick<Wie, 'rol'>): boolean {
  return t.rol === 'clubmanager'
}

/** Het niveau voor een sleutel met v2; null zonder v2 (dan geldt het oude model). */
export function v2Niveau(t: Pick<Wie, 'isPlatformEigenaar' | 'profiel'>, sleutel: string): Niveau | null {
  if (t.isPlatformEigenaar) return 'beheren'
  return t.profiel ? (t.profiel.niveaus[sleutel] ?? 'geen') : null
}

/** Met v2: heeft deze persoon minstens dit niveau? Zonder v2 null. */
export function v2Minstens(t: Pick<Wie, 'isPlatformEigenaar' | 'profiel'>, sleutel: string, drempel: Niveau): boolean | null {
  const n = v2Niveau(t, sleutel)
  return n === null ? null : minstens(n, drempel)
}

/**
 * Mag deze persoon op deze pagina iets wijzigen (sleutel uit RECHT_SLEUTELS)?
 * Met v2 vanaf het niveau bewerken: wie alleen zien heeft, krijgt de pagina
 * zonder bewerkknoppen, in plaats van een fout bij opslaan (de API weigert
 * hetzelfde, api.ts). Zonder v2 geldt het oude model: wie de pagina mag
 * openen, mag er ook in werken.
 */
export function kanBewerken(t: Pick<Wie, 'isPlatformEigenaar' | 'profiel'>, sleutel: string): boolean {
  return v2Minstens(t, sleutel, 'bewerken') ?? true
}
