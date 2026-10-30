// ─── Club, personeel: wie mag welke uren doen (PUUR) ────────────────────────
// Uren goedkeuren, verwerken en exporteren voor de salarisadministratie doen
// de eigenaar, de clubmanager en de administratie; nooit een trainer of
// instructeur voor zichzelf of een collega. Een medewerker zonder die rol
// bevestigt alleen de uren van zijn eigen dienst, zolang die nog niet is
// goedgekeurd (zie de stappen in DienstUren).

import type { ClubRol } from '@/lib/club/toegang'
import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { UurStatus } from './typen'
import type { UrenActie } from './invoer'
import { isMedewerkerSessie, v2Minstens, type ProfielToegang } from '@/lib/club/rollen/wie'

export interface UrenKijker {
  rol: ClubRol
  persoonId: string | null
  medewerkerRollen?: readonly MedewerkerRol[]
  isPlatformEigenaar?: boolean
  /** Rollenmodel v2: dan telt het niveau van de sleutel uren (beheren). */
  profiel?: ProfielToegang | null
}

const UREN_ROLLEN: readonly MedewerkerRol[] = ['manager', 'administratie']

/** Goedkeuren, verwerken, het tabblad Uren en de export: alles behalve een medewerker zonder rol Clubmanager of Administratie. */
export function magUrenBeheren(t: UrenKijker): boolean {
  const v2 = v2Minstens({ isPlatformEigenaar: t.isPlatformEigenaar === true, profiel: t.profiel }, 'uren', 'beheren')
  if (v2 !== null) return v2
  if (!isMedewerkerSessie(t)) return true
  return (t.medewerkerRollen ?? []).some((r) => UREN_ROLLEN.includes(r))
}

/** Mag deze persoon deze stap zetten op de uren van deze dienst? */
export function magUrenActie(t: UrenKijker, dienst: { medewerkerId: string | null; uurStatus: UurStatus }, actie: UrenActie): boolean {
  if (magUrenBeheren(t)) return true
  if (actie === 'goedkeuren') return false
  const eigen = dienst.medewerkerId !== null && dienst.medewerkerId === t.persoonId
  return eigen && (dienst.uurStatus === 'gepland' || dienst.uurStatus === 'gewerkt')
}

export const UREN_NIET_TOEGESTAAN = 'Goedkeuren doet de clubmanager of de administratie. Je eigen uren bevestig je zolang ze nog niet zijn goedgekeurd.'

/**
 * Opent Personeel zonder gekozen tabblad bij Mijn diensten? Ja voor een
 * medewerker op de vloer (besluit Kane 20-10-2026: de trainer eerst zijn eigen
 * diensten). Nee voor wie het rooster plant (met v2: personeel minstens
 * bewerken, zoals de roosteraar); die begint op het weekrooster.
 */
export function opentBijEigenDiensten(t: UrenKijker): boolean {
  if (!isMedewerkerSessie(t)) return false
  const plant = v2Minstens({ isPlatformEigenaar: t.isPlatformEigenaar === true, profiel: t.profiel }, 'personeel', 'bewerken')
  return plant !== true
}
