// 3D-oefening: Dumbbell shoulder press. Naam exact zoals in de oefenbibliotheek.
// Zittend op een rechte bank, rug tegen het kussen, voeten plat op heupbreedte.
// Onderin halters net boven schouderhoogte, ellebogen een hand voor het lichaam en de onderarmen
// rechtop onder de halter. De hele baan blijft de onderarm verticaal (pols boven
// elleboog), zodat de halters horizontaal blijven. Bovenin net niet gestrekt en
// net niet tegen elkaar.

import { BLIK, houding, metMoment, TEMPO } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

const GRAAD = Math.PI / 180

/** Romp: rug tegen het kussen, buik vast (geen holle rug). */
const ROMP = { bekkenY: 0.535, bekkenZ: -0.042, kantel: -4, lende: 0, borst: 0, nek: 2 }

/**
 * Een stand van de press uit de bovenarm: `hoogte` is de elleboog ten opzichte
 * van horizontaal (graden), `voor` hoever de elleboog voor het lichaam staat
 * (graden, 0 = recht opzij). De onderarm staat rechtop onder de halter; `binnen`
 * (meter) laat de hand in het bovenste stuk al wat naar binnen lopen, zodat de
 * baan een vloeiend driehoekje wordt.
 */
function stand(hoogte: number, voor: number, schouders: number, binnen = 0): Houding {
  const romp = houding({ ...ROMP, schouders })
  const s = schouderIn(romp)
  const a = hoogte * GRAAD
  const f = voor * GRAAD
  const plat = MATEN.bovenarm * Math.cos(a)
  return houding({
    ...ROMP,
    schouders,
    greep: s.x + plat * Math.cos(f) - binnen,
    lastY: s.y + MATEN.bovenarm * Math.sin(a) + ARM_GREEP,
    lastZ: s.z + plat * Math.sin(f),
  })
}

/** Halve afstand tussen de greepmiddens bovenin: een handbreedte tussen de koppen. */
const GREEP_BOVEN = 0.235
/** Schouder tot greep bovenin: armen hoog, ellebogen net niet op slot. */
const REIK_BOVEN = 0.62

/**
 * Bovenin lopen de halters naar binnen tot ze bijna boven het hoofd samenkomen
 * (licht driehoekje), net voor het hoofd en zonder de ellebogen op slot.
 */
function boven(schouders: number): Houding {
  const s = schouderIn(houding({ ...ROMP, schouders }))
  const dx = GREEP_BOVEN - s.x
  const dz = 0.07
  return houding({
    ...ROMP,
    schouders,
    greep: GREEP_BOVEN,
    lastY: s.y + Math.sqrt(REIK_BOVEN * REIK_BOVEN - dx * dx - dz * dz),
    lastZ: s.z + dz,
  })
}

const ONDER = stand(-30, 30, 0)
const BOVEN = boven(0.02)

const LAAG = stand(-6, 28, 0.004)
const HALF = stand(24, 25, 0.01, 0.015)
const HOOG = stand(53, 23, 0.016, 0.05)

/**
 * Volgens de coaching: 2 tellen gecontroleerd omlaag, kort stil onderin, 1 tel
 * omhoog (vaste tempo-opbouw `TEMPO.zakken`). De lus begint bovenin, zodat de
 * zware startpositie onderin (onderarmen rechtop) op het midden valt.
 */
const T = TEMPO.zakken
const OMLAAG = [HOOG, HALF, LAAG]
const OMHOOG = [LAAG, HALF, HOOG]
const SLEUTELS: Sleutel[] = [
  { houding: BOVEN, vast: T.begin, naarVolgende: T.heen / 4 },
  ...OMLAAG.map((h) => ({ houding: h, vast: 0, naarVolgende: T.heen / 4 })),
  { houding: ONDER, vast: T.eind, naarVolgende: T.terug / 4 },
  ...OMHOOG.map((h) => ({ houding: h, vast: 0, naarVolgende: T.terug / 4 })),
]

export const SCHOUDERDRUKKEN_3D: Oefening3d = metMoment({
  naam: 'Dumbbell shoulder press',
  sleutels: SLEUTELS,
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.14, y: 0.08, z: 0.38 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 0.3, z: 1 },
  elleboogRichting: { x: 1, y: -0.5, z: 0.6 },
  materiaal: [{ soort: 'bankRug', plek: { x: 0, y: 0, z: -0.02 } }, { soort: 'halters' }],
  spieren: ['schouder'],
  spierenSecundair: ['bovenarm', 'romp'],
  blik: BLIK.vooruit,
  camera: { hoek: -50, hoogte: 12, afstand: 4.2, doel: { x: 0, y: 0.9, z: 0.06 } },
})
