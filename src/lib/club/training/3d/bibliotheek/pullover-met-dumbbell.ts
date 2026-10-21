// 3D-oefening: Pullover met dumbbell. Naam exact zoals in de oefenbibliotheek.
// In de lengte op een vlakke bank, voeten plat op de grond, onderrug op de bank.
// Een dumbbell met beide handen aan de binnenkant van de bovenste schijf, recht
// boven de borst. De armen zijn een vaste boog met een kleine buiging in de
// ellebogen: alleen de schouders bewegen. In 3 tellen zakt de dumbbell in een
// boog achter het hoofd tot de bovenarmen ongeveer naast de oren zijn (rek in
// borst en flanken), kort stil, in 2 tellen langs dezelfde boog terug tot recht
// boven de borst.
// Camera bijna zuiver van opzij op borsthoogte: de boog van de armen achter het
// hoofd, de vaste buiging in de ellebogen en de vlakke onderrug.

import { boogOefening } from '../bouw/boog'
import { LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const PULLOVER_DUMBBELL: Oefening3d = boogOefening({
  naam: 'Pullover met dumbbell',
  lichaam: LICHAAM.bankLig,
  // Bovenin: armen licht naar de heupen gekanteld, dumbbell recht boven het borstbeen.
  van: { x: -0.2, y: 1, z: 0.66 },
  // Onderin: bovenarmen naast de oren, iets boven bankhoogte.
  naar: { x: -0.22, y: 0.25, z: -1 },
  elleboog: 35,
  buig: { x: -0.4, y: 0, z: -1 },
  enkel: { x: 0.29, y: 0.08, z: 0.8 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 0.5, y: 0.7, z: 0.7 },
  greepRichting: { x: 0.6, y: 0.25, z: 0.8 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: 0.07 } }, { soort: 'halterStaand' }],
  spieren: ['borst', 'rug'],
  spierenSecundair: ['bovenarm', 'romp'],
  // Hoofd plat op de bank, ogen naar het plafond: de nek blijft neutraal.
  blik: { hoek: -84 },
  camera: { hoek: 80, hoogte: 16, afstand: 4.25, doel: { x: 0, y: 0.45, z: 0 } },
  tempo: { begin: 0.4, heen: 3.0, eind: 0.5, terug: 2.0 },
  tussen: 4,
})
