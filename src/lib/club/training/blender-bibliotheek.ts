// ─── Club, training: de bibliotheek met eigen Blender-renders (PUUR) ────────
// Besluit Kane (28-10-2026): in Club en de ledenapp staan voorlopig alleen de
// oefeningen met een eigen Blender-render. De bron van de waarheid is de
// renderlijst (oefenrenders.data.ts, geschreven door scripts/oefenbeelden-web.mjs):
// een oefening die daar met losse beelden bij komt, is meteen weer kiesbaar.
// Koppeling: de naam van de render is exact de naam in club_oefeningen
// (hoofdletters tellen niet), de slug is de map in public/oefenbeelden/.
//
// De andere oefeningen uit de standaardbibliotheek staan sinds migratie 465 op
// gearchiveerd (kolom club_oefeningen.gearchiveerd). Ze blijven leesbaar in
// bestaande schema's en set-logs, maar zijn nergens meer te kiezen. Eigen
// oefeningen van een sportschool vallen hier buiten.
// Geen zware imports: dit bestand gaat mee naar de browser.

import { OEFENRENDERS } from '@/components/aiyourgym/inhoud/oefenrenders'
import { isStandaardOefening } from './beelden-repdb'

export interface BlenderOefening {
  /** Exacte naam in de oefenbibliotheek (club_oefeningen.naam). */
  naam: string
  /** Map in public/oefenbeelden/. */
  slug: string
}

const sleutel = (naam: string): string => naam.trim().toLowerCase()

/** Alleen renders met losse beelden tellen: zonder frames geen rep-speler (zie render-bron.ts). */
export const BLENDER_OEFENINGEN: readonly BlenderOefening[] = OEFENRENDERS.filter((r) => r.frames !== null && r.frames.aantal >= 2).map((r) => ({
  naam: r.naam,
  slug: r.slug,
}))

const OP_NAAM: ReadonlyMap<string, BlenderOefening> = new Map(BLENDER_OEFENINGEN.map((o) => [sleutel(o.naam), o]))

/** Heeft deze oefening een eigen Blender-render met rep-speler? */
export function isBlenderOefening(naam: unknown): boolean {
  return typeof naam === 'string' && OP_NAAM.has(sleutel(naam))
}

/** De map van de render bij deze oefening, of null. */
export function blenderSlugVoor(naam: string): string | null {
  return OP_NAAM.get(sleutel(naam))?.slug ?? null
}

/**
 * Is deze oefening gearchiveerd? De kolom gearchiveerd uit de database, behalve
 * als er inmiddels een Blender-render is: dan komt hij vanzelf terug.
 */
export function isGearchiveerd(naam: string, kolom: unknown): boolean {
  return kolom === true && !isBlenderOefening(naam)
}

/**
 * Hoort deze oefening volgens de regel van 28-10-2026 in het archief? Een
 * standaardoefening zonder Blender-render. Dezelfde regel als migratie 465.
 */
export function hoortInArchief(naam: string): boolean {
  return isStandaardOefening(naam) && !isBlenderOefening(naam)
}
