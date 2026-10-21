// 3D-oefening: Deadlift met kettlebell. Naam exact zoals in de oefenbibliotheek.
// Voeten iets breder dan heupbreedte, de kettlebell tussen de voeten op lijn
// met de enkels. Heupen naar achteren tot de handen met gestrekte armen het
// handvat pakken: schenen bijna verticaal, rug recht, borst open en schouders
// weg van de oren. Omhoog door de heupen naar voren te brengen, de armen zijn
// touwen; bovenin rechtop met billen aan en de bel hangend voor de dijen.
// Terug met dezelfde heupbeweging naar dezelfde plek. Zijaanzicht licht van
// voren: heupscharnier, rechte rug en de bel tussen de voeten.

import { vloertrek } from '../bouw/vloertrek'
import type { Oefening3d } from '../typen'

export const DEADLIFT_KETTLEBELL: Oefening3d = vloertrek({
  naam: 'Deadlift met kettlebell',
  materiaal: [{ soort: 'kettlebell' }],
  // Beide handen naast elkaar om het handvat.
  greep: 0.035,
  enkel: { x: 0.2, y: 0.08, z: 0 },
  uitdraai: 12,
  knieRichting: { x: 0.3, y: 0, z: 1 },
  elleboogRichting: { x: 0.15, y: 0, z: -1 },
  // Onderin staat de bel op de vloer tussen de enkels (handvat 26 cm hoog),
  // bovenin hangt hij voor de dijen.
  lastZ: 0.04,
  lastZBoven: 0.12,
  vloer: 0.262,
  gewicht: 0.2,
  romp: 62,
  schouderVoor: 0.06,
  opbouw: 'heup',
  spieren: ['bil', 'hamstring'],
  spierenSecundair: ['onderrug', 'dij'],
  camera: { hoek: 70, hoogte: 10, afstand: 4.3, doel: { x: 0, y: 0.7, z: 0 } },
})
