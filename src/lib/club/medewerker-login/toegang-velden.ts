// ─── Club: de toegang van een ingelogde medewerker (PUUR) ───────────────────
// Tenant-scheiding voor medewerkers: precies een sportschool (die van de
// medewerker), alleen zijn eigen vestigingen en alleen de onderdelen van zijn
// rollen. Null als iets niet klopt: dan liever een 404 dan te veel tonen.

import type { Organisatie } from '@/lib/club/kern/organisatie'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import { magMedewerkerBinnen, type MedewerkerMetOrg, type MedewerkerToegang } from './medewerker-login'
import { medewerkerOnderdelen, medewerkerVestigingen } from './rechten'

export interface MedewerkerToegangVelden {
  userId: string
  organisatie: Organisatie
  organisaties: Organisatie[]
  beheerderId: string
  naam: string
  rol: 'medewerker'
  isPlatformEigenaar: false
  /** Het id in club_medewerkers. */
  persoonId: string
  rollen: MedewerkerRol[]
  onderdelen: string[]
  vestigingen: VestigingInfo[]
}

interface Bron {
  toegang: MedewerkerToegang
  medewerker: MedewerkerMetOrg
  organisatie: Organisatie | null
  /** beheerder_id van het organisatierecord. */
  eigenaarId: string | null
  /** Alle vestigingen van de sportschool. */
  vestigingen: readonly VestigingInfo[]
}

export function medewerkerToegangVelden({ toegang, medewerker, organisatie, eigenaarId, vestigingen }: Bron): MedewerkerToegangVelden | null {
  if (!organisatie || !eigenaarId || organisatie.id !== toegang.userId) return null
  if (!magMedewerkerBinnen(toegang, medewerker)) return null
  const eigen = medewerkerVestigingen(vestigingen, medewerker.vestigingen)
  // Zonder eigen vestiging is er niets dat deze medewerker mag zien.
  if (eigen.length === 0) return null
  return {
    userId: organisatie.id,
    organisatie,
    organisaties: [organisatie],
    beheerderId: eigenaarId,
    naam: medewerker.naam.slice(0, 80),
    rol: 'medewerker',
    isPlatformEigenaar: false,
    persoonId: medewerker.id,
    rollen: medewerker.rollen,
    onderdelen: medewerkerOnderdelen(medewerker.rollen, organisatie.instellingen.rechten),
    vestigingen: eigen,
  }
}
