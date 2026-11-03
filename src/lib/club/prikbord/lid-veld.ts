// ─── Club, Prikbord: lid koppelen aan een uitvoering (PUUR) ─────────────────
// Bij een werkwijze die over een lid gaat (nieuw lid ontvangen, klacht, ongeval
// en EHBO) mag je bij het uitvoeren optioneel een lid kiezen. Nooit verplicht:
// bij een ongeval raakt dat gezondheidsgegevens (ontwerp deel 5, AVG). De
// koppeling valt onder de AVG-regels van club_werkwijze_uitvoeringen.lid_id.

import type { WerkwijzeSoort } from './typen'

/** De soorten werkwijze waarbij een lid kiezen zin heeft. */
export const SOORTEN_MET_LID: readonly WerkwijzeSoort[] = ['nieuw_lid', 'klacht', 'veiligheid']

/** Toon het optionele lidveld bij het uitvoeren van deze soort werkwijze? */
export function heeftLidVeld(soort: WerkwijzeSoort): boolean {
  return SOORTEN_MET_LID.includes(soort)
}

/** Het lid dat meegaat naar de API: alleen bij een soort met lidveld, anders null. */
export function lidVoorUitvoering(soort: WerkwijzeSoort, lidId: string | null): string | null {
  return heeftLidVeld(soort) && lidId ? lidId : null
}
