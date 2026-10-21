// ─── Fit Factory Club, 3D-oefenbeelden: alle oefeningen als data (PUUR) ──────
// Elke oefening staat in een eigen bestand in ./bibliotheek. Per oefening de
// sleutelhoudingen met tempo zoals een trainer het voordoet. Voeten staan vast
// op de vloer en de handen vast aan de last; armen en benen volgen met inverse
// kinematica.

import { BIBLIOTHEEK_3D, PROTOTYPE_3D } from './bibliotheek'
import type { Oefening3d } from './typen'

export { PROTOTYPE_3D }

/** Alle oefeningen in 3D: het prototype plus de bibliotheek via de bouwstenen. */
export const OEFENINGEN_3D: readonly Oefening3d[] = [...PROTOTYPE_3D, ...BIBLIOTHEEK_3D]

export function oefening3dOpNaam(naam: string): Oefening3d | undefined {
  return OEFENINGEN_3D.find((o) => o.naam === naam)
}
