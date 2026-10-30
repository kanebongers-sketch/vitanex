// ─── Club, rollen v2: het profiel van wie er binnen is (PUUR) ───────────────
// Uit de rollen van het profiel en de rechten van de sportschool: het niveau
// per sleutel, de lijst t.onderdelen en de startpagina.

import type { Organisatie } from '@/lib/club/kern/organisatie'
import { leesRolrechten, niveausVoor, onderdelenVoor, schoneRollen, startpagina } from './model'
import type { Rol, Rolrechten } from './typen'
import type { ProfielToegang } from './wie'

export interface ProfielBron {
  id: string | null
  rollen: unknown
  alleVestigingen: boolean
}

/** De rechten per rol van deze sportschool (v2, of v1 omgezet, of de standaard). */
export function rolrechtenVan(org: Pick<Organisatie, 'instellingen'>): Rolrechten {
  return leesRolrechten(org.instellingen.rollenBron ?? null)
}

export function bouwProfiel(bron: ProfielBron, org: Pick<Organisatie, 'instellingen' | 'uit'>): { profiel: ProfielToegang; onderdelen: string[] } {
  const rollen: Rol[] = schoneRollen(bron.rollen)
  const rechten = rolrechtenVan(org)
  const niveaus = niveausVoor({ rollen, rechten, uit: org.uit })
  return {
    profiel: { id: bron.id, rollen, niveaus, start: startpagina(rollen, rechten, niveaus), alleVestigingen: bron.alleVestigingen },
    onderdelen: onderdelenVoor(niveaus),
  }
}

/** De rol van een beheerderslogin als het profiel (nog) ontbreekt. */
export function rolVanBeheerder(rol: 'eigenaar' | 'clubmanager'): Rol {
  return rol === 'clubmanager' ? 'manager' : 'eigenaar'
}
