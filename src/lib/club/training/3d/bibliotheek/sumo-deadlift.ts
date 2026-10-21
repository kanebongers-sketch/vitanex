// 3D-oefening: Sumo deadlift. Naam exact zoals in de oefenbibliotheek.
// Brede stand met de tenen schuin naar buiten, knieen in de lijn van de tenen,
// stang boven het midden van de voet tegen de schenen. Handen op
// schouderbreedte tussen de knieen, armen recht naar beneden. Romp rechter dan
// bij een gewone deadlift, heupen dichter bij de stang. Omhoog eerst de vloer
// uit elkaar duwen tot de stang voorbij de knie is, dan heupen naar voren tot
// rechtop. Terug: heupen naar achteren, dan knieen buigen. Camera 3/4 van voren:
// brede voetstand, knieen naar buiten en de verticale baan van de stang.

import { vloertrek } from '../bouw/vloertrek'
import type { Oefening3d } from '../typen'

export const SUMO_DEADLIFT: Oefening3d = vloertrek({
  naam: 'Sumo deadlift',
  materiaal: [{ soort: 'stang', schijven: 2 }],
  greep: 0.18,
  enkel: { x: 0.34, y: 0.08, z: 0 },
  uitdraai: 40,
  // Knieen volgen de tenen (40 graden naar buiten).
  knieRichting: { x: 0.64, y: 0, z: 0.77 },
  elleboogRichting: { x: 0.1, y: 0, z: -1 },
  // Stang net voor de schenen en knieen, boven het midden van de voet.
  lastZ: 0.1,
  vloer: 0.225,
  gewicht: 0.5,
  romp: 46,
  schouderVoor: 0.02,
  opbouw: 'benen',
  spieren: ['bil', 'dij'],
  spierenSecundair: ['hamstring', 'onderrug'],
  camera: { hoek: 42, hoogte: 12, afstand: 4.5, doel: { x: 0, y: 0.72, z: 0 } },
})
