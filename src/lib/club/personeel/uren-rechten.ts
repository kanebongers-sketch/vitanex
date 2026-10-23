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

export interface UrenKijker {
  rol: ClubRol
  persoonId: string | null
  medewerkerRollen?: readonly MedewerkerRol[]
}

const UREN_ROLLEN: readonly MedewerkerRol[] = ['manager', 'administratie']

/** Goedkeuren, verwerken, het tabblad Uren en de export: alles behalve een medewerker zonder rol Clubmanager of Administratie. */
export function magUrenBeheren(t: UrenKijker): boolean {
  if (t.rol !== 'medewerker') return true
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
