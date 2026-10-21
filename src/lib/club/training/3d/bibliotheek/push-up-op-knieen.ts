// 3D-oefening: Push-up op knieën. Naam exact zoals in de oefenbibliotheek.
// Knieen op de mat, schenen schuin omhoog en voeten los van de grond. Handen
// iets breder dan de schouders, lichaam een rechte lijn van knieen tot hoofd
// (heupen niet omhoog). Het hele lichaam draait om de knieen: zakken tot de
// borst vlak boven de mat, ellebogen ongeveer 45 graden naar achteren, dan in
// een stuk terug omhoog.

import { pushUp } from '../bouw/push-up'
import type { Oefening3d } from '../typen'

export const PUSH_UP_KNIEEN: Oefening3d = pushUp({
  naam: 'Push-up op knieën',
  // Kniegewricht een knieschijf boven de mat; schenen 55 graden omhoog.
  steun: { soort: 'knieen', knie: { x: 0.1, y: 0.062, z: -0.52 }, scheenHoek: 55 },
  hand: { vlak: 0.012, x: 0.22 },
  handVoor: 0.03,
  bekkenZak: 0.012,
  elleboogRichting: { x: 0.6, y: 0.6, z: -1.4 },
  materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.25 } }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  spierenSecundair: ['romp'],
  camera: { hoek: 60, hoogte: 12, afstand: 3.5, doel: { x: 0, y: 0.3, z: -0.1 } },
})
