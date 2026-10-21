// 3D-oefening: Squat in de smith machine. Naam exact zoals in de oefenbibliotheek.
// De stang ligt hoog op de bovenrug en loopt in de geleiders van de machine
// strak verticaal: hij gaat alleen omhoog en omlaag, nooit naar voren of
// achteren. De voeten staan op schouderbreedte een klein stukje voor de stang,
// tenen licht naar buiten. Daardoor zakt het figuur recht, blijft de romp
// rechter dan bij een vrije squat en blijven de hielen aan de grond. Zakken tot
// de dij ongeveer horizontaal is (de veiligheidsstops staan net daaronder),
// knieen in de lijn van de tenen, rug neutraal en blik vooruit. Tempo volgens
// de coaching: 3 tellen omlaag, kort stil, 1 tel omhoog.

import { bereikbaar, HEUP_STAAND, houding, lus } from '../bouw/basis'
import { figuurIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Waar de stang loopt (m): een klein stukje achter de enkels, de voeten staan ervoor. */
const STANG_Z = -0.08
/** Hoogte van het heupgewricht onderin: dij ongeveer horizontaal. */
const DIEPTE = 0.48
/** Bekken onderin voorover (graden): rechter dan een vrije back squat. */
const KANTEL = 30
/** Stang hoog op de bovenrug (in het frame van de borst) en de greep net buiten de schouders. */
const STANG = { lastY: 0.25, lastZ: -0.125, greep: 0.48 } as const

const BASIS: Oefening3d = {
  naam: 'Squat in de smith machine',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.16, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 16 },
  knieRichting: { x: 0.4, y: 0, z: 1 },
  elleboogRichting: { x: 0.6, y: -1, z: -0.8 },
  materiaal: [
    { soort: 'smith', plek: { x: 0, y: 0, z: STANG_Z } },
    { soort: 'stang', schijven: 1 },
  ],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'onderrug'],
  // Schuin van voren: geleiders naast het figuur, voetstand voor de stang, romphoek en diepte leesbaar.
  camera: { hoek: 52, hoogte: 14, afstand: 4.6, doel: { x: 0, y: 0.9, z: -0.05 } },
}

/** Schuif het bekken tot de stang precies in de geleiders (op STANG_Z) ligt. */
function inGeleider(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 4; i++) {
    const fout = figuurIn(BASIS, uit).last.pos.z - STANG_Z
    uit = bereikbaar(BASIS, { ...uit, bekkenZ: uit.bekkenZ - fout })
  }
  return uit
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const kantel = 3 + (KANTEL - 3) * d
  const romp = houding({
    bekkenY: HEUP_STAAND - 0.004 + (DIEPTE - HEUP_STAAND) * d,
    bekkenZ: -0.1 * d,
    kantel,
    lende: 0,
    borst: -2 * d,
    // Blik vooruit: de nek vangt het grootste deel van de rompkanteling op.
    nek: -0.8 * (kantel - 2 * d),
    schouders: 0.01,
    ...STANG,
  })
  return inGeleider(romp)
}

export const SQUAT_SMITH: Oefening3d = {
  ...BASIS,
  kniePad: true,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 3.0, eind: 0.4, terug: 1.1 }, 2),
}
