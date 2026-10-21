// 3D-oefening: Push-up met voeten verhoogd. Naam exact zoals in de oefenbibliotheek.
// Tenen op een vlakke bank, handen iets breder dan de schouders op de mat en net
// voor de schouderlijn. Lichaam een rechte lijn van hielen tot hoofd, heupen
// zakken niet door. Zakken als een geheel tot de borst vlak boven de mat,
// ellebogen ongeveer 45 graden naar achteren, nek in lijn met de rug.

import { pushUp } from '../bouw/push-up'
import type { Oefening3d } from '../typen'

/** Neus van de schoen op het kussen van de bank (bovenkant 0,43 m), 10 cm van de rand. */
const TEEN = { x: 0.1, y: 0.425, z: -1.05 }

export const PUSH_UP_VOETEN_VERHOOGD: Oefening3d = pushUp({
  naam: 'Push-up met voeten verhoogd',
  steun: { soort: 'tenen', teen: TEEN },
  hand: { vlak: 0.012, x: 0.22 },
  // Handen onder de schouders op de lijn van de borst, zodat je recht naar je borst zakt.
  handVoor: -0.09,
  borstVrij: 0.07,
  bekkenZak: 0.01,
  elleboogRichting: { x: 0.6, y: 0.6, z: -1.4 },
  materiaal: [
    { soort: 'bankKaal', draai: 90, plek: { x: 0, y: 0, z: TEEN.z - 0.05 } },
    { soort: 'mat', plek: { x: 0, y: 0, z: 0.12 } },
  ],
  spieren: ['borst', 'schouder', 'bovenarm'],
  spierenSecundair: ['romp'],
  camera: { hoek: 64, hoogte: 12, afstand: 4.0, doel: { x: 0, y: 0.36, z: -0.32 } },
})
