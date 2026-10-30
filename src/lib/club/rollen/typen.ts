// ─── Club, rollen v2: rollen, niveaus en sleutels (PUUR) ────────────────────
// Besluit Kane (29-10-2026): een profiel per persoon per sportschool, met een
// of meer rollen. Rechten hebben vier niveaus; bij meerdere rollen geldt per
// onderdeel het hoogste. Bouwplan: docs/club/ROLLEN-PLAN.md.

import { ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'

export const ROLLEN = ['eigenaar', 'manager', 'trainer', 'instructeur', 'roosteraar', 'administratie'] as const
export type Rol = (typeof ROLLEN)[number]

export function isRol(v: unknown): v is Rol {
  return typeof v === 'string' && (ROLLEN as readonly string[]).includes(v)
}

/** Werkrollen: die mag ook een clubmanager geven (keuze Kane 29-10-2026). */
export const WERKROLLEN: readonly Rol[] = ['trainer', 'instructeur', 'roosteraar', 'administratie']

/** De drie categorieen van rollen in Team en Rechten per rol. */
export const ROL_CATEGORIEEN = [
  { sleutel: 'leiding', rollen: ['eigenaar', 'manager'] },
  { sleutel: 'vloer', rollen: ['trainer', 'instructeur'] },
  { sleutel: 'planning', rollen: ['roosteraar', 'administratie'] },
] as const satisfies readonly { sleutel: string; rollen: readonly Rol[] }[]

export type RolCategorie = (typeof ROL_CATEGORIEEN)[number]['sleutel']

export const NIVEAUS = ['geen', 'zien', 'bewerken', 'beheren'] as const
export type Niveau = (typeof NIVEAUS)[number]

export function isNiveau(v: unknown): v is Niveau {
  return typeof v === 'string' && (NIVEAUS as readonly string[]).includes(v)
}

export function rang(n: Niveau): number {
  return NIVEAUS.indexOf(n)
}

export function hoogste(a: Niveau, b: Niveau): Niveau {
  return rang(a) >= rang(b) ? a : b
}

export function minstens(n: Niveau, drempel: Niveau): boolean {
  return rang(n) >= rang(drempel)
}

/**
 * Sleutels die er in v2 bij komen, naast de onderdelen van het menu
 * (ONDERDEEL_SLEUTELS): team, uren en de vergrendelde zaken van de eigenaar.
 */
export const EXTRA_SLEUTELS = ['team', 'uren', 'rollen', 'abonnement', 'financien', 'privacy', 'widget'] as const

export const RECHT_SLEUTELS: readonly string[] = [...ONDERDEEL_SLEUTELS, ...EXTRA_SLEUTELS]

export function isRechtSleutel(v: unknown): v is string {
  return typeof v === 'string' && RECHT_SLEUTELS.includes(v)
}

/**
 * Alleen voor de eigenaar (vergrendeld): abonnement en pakketten, rollen en
 * rechten per rol, naam en adres (huisstijl), bedrijf, lidmaatschappen,
 * sluiting, Stripe en financien, privacy en AVG-verwijderen, widget en de
 * startwizard. Geen andere rol krijgt ze, wat de opgeslagen rechten ook zeggen.
 */
export const ALLEEN_EIGENAAR: ReadonlySet<string> = new Set([
  'abonnement', 'rollen', 'huisstijl', 'bedrijf', 'lidmaatschappen', 'sluiting', 'financien', 'privacy', 'widget', 'start',
])

/** Per rol per sleutel een niveau; ontbreekt een sleutel, dan is het geen. */
export type NiveauKaart = Readonly<Record<string, Niveau>>

export interface Rolrechten {
  rollen: Readonly<Record<Rol, NiveauKaart>>
  /** De startpagina per rol (een sleutel uit START_OPTIES). */
  start: Readonly<Record<Rol, string>>
}
