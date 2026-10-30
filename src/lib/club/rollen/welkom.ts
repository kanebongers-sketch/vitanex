// ─── Club: de eerste-keer-uitleg per rol (PUUR) ─────────────────────────────
// Opdracht Kane (30-10-2026): een nieuwe medewerker krijgt bij de eerste keer
// inloggen een korte, wegklikbare uitleg van hoogstens drie kaarten, per rol.
// Hier staat welke rol de uitleg bepaalt en onder welke sleutel het wegklikken
// in de browser bewaard wordt. De teksten staan in woorden/club/welkom.ts.

import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import { START_VOLGORDE } from './standaard'
import type { Rol } from './typen'
import { isEigenaar, isLeiding, type Wie } from './wie'

/** Verhoog dit als de kaarten echt anders worden; dan ziet iedereen ze nog een keer. */
export const WELKOM_VERSIE = 1

export interface WelkomBron extends Wie {
  /** De rollen van een ingelogde medewerker (oud model); leeg voor beheerders. */
  medewerkerRollen?: readonly MedewerkerRol[]
}

/**
 * De rol waarvoor de uitleg geldt. Bij meerdere rollen de eerste in de vaste
 * volgorde van de startpagina's, zodat uitleg en startpagina bij elkaar passen.
 * De platform-eigenaar (Kane) ziet de uitleg van de clubmanager, zodat hij hem kan beoordelen.
 */
export function welkomRol(t: WelkomBron): Rol | null {
  if (t.isPlatformEigenaar) return 'manager'
  // De oude medewerkerrollen (trainer, instructeur, manager, administratie) bestaan ook in v2.
  const rollen: readonly Rol[] = t.profiel ? t.profiel.rollen : (t.medewerkerRollen ?? [])
  const eerste = START_VOLGORDE.find((r) => rollen.includes(r))
  if (eerste) return eerste
  // Zonder profiel en zonder medewerkerrollen: een beheerderslogin van het oude model.
  if (isEigenaar(t)) return 'eigenaar'
  if (isLeiding(t)) return 'manager'
  return null
}

/** De sleutel in de browser: per sportschool, per persoon, per rol en per versie. */
export function welkomSleutel(organisatieId: string, persoonId: string | null, rol: Rol): string {
  return `ayg-welkom:${organisatieId}:${persoonId ?? 'beheer'}:${rol}:v${WELKOM_VERSIE}`
}

/** De sleutel voor de uitleg in de ledenapp, per lid. */
export function ledenWelkomSleutel(lidId: string): string {
  return `ayg-welkom-lid:${lidId}:v${WELKOM_VERSIE}`
}

/** De code van een weggeklikte uitleg, zoals hij per account in de database staat (migratie 476). */
export function uitlegCode(soort: Rol | 'leden'): string {
  return `${soort}:v${WELKOM_VERSIE}`
}

const UITLEG_CODE = /^(eigenaar|manager|trainer|instructeur|roosteraar|administratie|leden):v\d{1,3}$/

/** Is dit een geldige code (invoer van de API)? */
export function isUitlegCode(v: unknown): v is string {
  return typeof v === 'string' && UITLEG_CODE.test(v)
}

/** De lijst met een code erbij: geen dubbele, hoogstens 20 (de nieuwste blijven). */
export function metGezien(lijst: readonly string[], code: string): string[] {
  const zonder = lijst.filter((c) => c !== code)
  return [...zonder, code].slice(-20)
}
