// ─── Club: de toegang van een eigenaar of clubmanager (PUUR) ────────────────
// De kern van de tenant-scheiding: een beheerder van een sportschool krijgt
// precies een organisatie, de zijne. userId (waarop alle club_*-tabellen
// filteren) is het id van die organisatie; de cookie waarmee Kane van
// sportschool wisselt, telt hier niet.

import type { Organisatie } from '@/lib/club/kern/organisatie'
import type { Beheerder, BeheerderRol } from './beheerder'

export interface ExterneToegangVelden {
  userId: string
  organisatie: Organisatie
  organisaties: Organisatie[]
  beheerderId: string
  naam: string
  rol: BeheerderRol
  isPlatformEigenaar: false
  persoonId: string
}

/**
 * Null als de organisatie niet bij deze beheerder hoort (dan liever een 404
 * dan per ongeluk een andere sportschool). `eigenaarId` is de beheerder_id van
 * het organisatierecord, zodat opslaan van huisstijl en logo werkt zoals bij Kane.
 */
export function externeToegangVelden(b: Beheerder, organisatie: Organisatie | null, eigenaarId: string | null): ExterneToegangVelden | null {
  if (!organisatie || !eigenaarId || organisatie.id !== b.organisatieId) return null
  return {
    userId: organisatie.id,
    organisatie,
    organisaties: [organisatie],
    beheerderId: eigenaarId,
    naam: b.naam.split(' ')[0].slice(0, 40),
    rol: b.rol,
    isPlatformEigenaar: false,
    persoonId: b.id,
  }
}
