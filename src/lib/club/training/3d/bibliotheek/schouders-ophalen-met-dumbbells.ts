// 3D-oefening: Schouders ophalen met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Rechtop, voeten op heupbreedte, een dumbbell naast elk been met de handpalmen
// naar het lichaam, armen gestrekt en buik licht aan. Alleen de schouders gaan
// recht omhoog naar de oren (niet rollen), een tel vast, en rustig weer
// helemaal omlaag. De armen zijn haken en buigen niet mee; kin licht in.

import { schoudersOphalen } from '../bouw/schouders-ophalen'
import { NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

export const SCHOUDERS_OPHALEN_DUMBBELLS: Oefening3d = schoudersOphalen({
  naam: 'Schouders ophalen met dumbbells',
  materiaal: [{ soort: 'halters' }],
  // Naast de dijen, net vrij van het been.
  greep: 0.235,
  plek: { soort: 'naast', terug: 0.005 },
  greepRichting: NEUTRAAL,
  elleboogRichting: { x: 0.3, y: 0, z: -1 },
  gewicht: 0.25,
  spieren: ['rug'],
  spierenSecundair: ['schouder', 'onderarm'],
  // Bijna recht van voren en op ooghoogte: de schouders die naar de oren gaan.
  camera: { hoek: 22, hoogte: 6, afstand: 4.0, doel: { x: 0, y: 1.12, z: 0.0 } },
})
