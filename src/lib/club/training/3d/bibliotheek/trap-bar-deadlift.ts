// 3D-oefening: Trap bar deadlift. Naam exact zoals in de oefenbibliotheek.
// Voeten op heupbreedte midden in de zeskantige bar, handvatten naast het
// lichaam boven het midden van de voet (neutrale greep). Romp rechter dan bij
// een gewone deadlift, borst omhoog en rug lang, blik een paar meter voor je op
// de grond. Omhoog: duw de vloer weg, heupen en schouders komen samen omhoog,
// bovenin rechtop met billen aan. Terug: eerst de heupen naar achteren, dan de
// knieen. Zijaanzicht licht van voren: romphoek en de rechte baan van de
// handvatten; de schijven aan de kant van de camera worden doorzichtig als ze
// het lichaam afdekken.

import { vloertrek } from '../bouw/vloertrek'
import type { Oefening3d } from '../typen'

export const TRAP_BAR_DEADLIFT: Oefening3d = vloertrek({
  naam: 'Trap bar deadlift',
  materiaal: [{ soort: 'trapBar', schijven: 2 }],
  // Handvatten op 56 cm: de armen hangen recht langs de benen.
  greep: 0.28,
  greepRichting: { x: 0, y: 0, z: 1 },
  enkel: { x: 0.12, y: 0.08, z: 0 },
  uitdraai: 8,
  knieRichting: { x: 0.12, y: 0, z: 1 },
  elleboogRichting: { x: 0.25, y: 0, z: -1 },
  // Handvatten boven het midden van de voet, lage handvatten op ashoogte van de schijven.
  lastZ: 0.05,
  vloer: 0.225,
  gewicht: 0.5,
  romp: 50,
  schouderVoor: 0.01,
  opbouw: 'benen',
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'onderrug'],
  camera: { hoek: 78, hoogte: 12, afstand: 4.4, doel: { x: 0, y: 0.72, z: 0 } },
})
