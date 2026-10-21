// 3D-oefening: Schouders ophalen met barbell. Naam exact zoals in de oefenbibliotheek.
// Rechtop met de stang op schouderbreedte aan gestrekte armen voor de
// bovenbenen, handpalmen naar het lichaam. De schouders gaan recht omhoog naar
// de oren (niet rollen), een tel vast, en rustig omlaag tot de armen weer
// helemaal hangen. De ellebogen buigen niet mee, het hoofd blijft in dezelfde
// stand. De stang schuift met de schouders langs de dijen mee.

import { schoudersOphalen } from '../bouw/schouders-ophalen'
import type { Oefening3d } from '../typen'

export const SCHOUDERS_OPHALEN_BARBELL: Oefening3d = schoudersOphalen({
  naam: 'Schouders ophalen met barbell',
  materiaal: [{ soort: 'stang', schijven: 2 }],
  // Handen op schouderbreedte, net buiten de dijen.
  greep: 0.235,
  // Midden van de stang net voor de beenlijn (dikte van de dij plus de stang).
  plek: { soort: 'voor', afstand: 0.085 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  gewicht: 0.35,
  spieren: ['rug'],
  spierenSecundair: ['schouder', 'onderarm'],
  // Schuin van voren op ooghoogte: schouders naar de oren, stang langs de dijen, gestrekte armen.
  camera: { hoek: 34, hoogte: 6, afstand: 4.4, doel: { x: 0, y: 1.08, z: 0.05 } },
})
