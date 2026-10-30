// ─── Club, rollen v2: wie mag welke rol geven (PUUR) ────────────────────────
// Keuzes Kane (29-10-2026):
//   - De eigenaar (en Kane) geeft en neemt elke rol.
//   - Een clubmanager geeft en neemt alleen werkrollen (trainer, instructeur,
//     roosteraar, administratie), nooit eigenaar of clubmanager.
//   - Er is altijd minstens een eigenaar.
//   - Wie het team niet beheert, verandert niets.

import { WERKROLLEN, type Rol } from './typen'

export interface Gever {
  platform: boolean
  /** De rollen van wie de wijziging doet. */
  rollen: readonly Rol[]
  /** Beheert deze persoon het team (niveau van 'team' is beheren)? */
  teamBeheer: boolean
}

export function magRolWijzigen(g: Gever, rol: Rol): boolean {
  if (g.platform || g.rollen.includes('eigenaar')) return true
  if (!g.teamBeheer || !g.rollen.includes('manager')) return false
  return WERKROLLEN.includes(rol)
}

export type RollenOordeel = { ok: true } | { ok: false; reden: 'escalatie' | 'laatste_eigenaar' | 'leeg' }

/**
 * Mag deze wijziging van oud naar nieuw? Elke rol die erbij komt of weggaat
 * moet de gever mogen geven. `eigenarenNa` = het aantal profielen met de rol
 * eigenaar in de sportschool na deze wijziging.
 */
export function beoordeelRollen(g: Gever, oud: readonly Rol[], nieuw: readonly Rol[], eigenarenNa: number): RollenOordeel {
  const erbij = nieuw.filter((r) => !oud.includes(r))
  const eraf = oud.filter((r) => !nieuw.includes(r))
  if ([...erbij, ...eraf].some((r) => !magRolWijzigen(g, r))) return { ok: false, reden: 'escalatie' }
  if (eraf.includes('eigenaar') && eigenarenNa < 1) return { ok: false, reden: 'laatste_eigenaar' }
  return { ok: true }
}

/** Mag deze persoon Rechten per rol wijzigen? Alleen Kane en de eigenaar (rollen is vergrendeld). */
export function magRechtenWijzigen(g: Pick<Gever, 'platform' | 'rollen'>): boolean {
  return g.platform || g.rollen.includes('eigenaar')
}
