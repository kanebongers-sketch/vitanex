// 3D-oefening: Eenarmige dumbbell row. Naam exact zoals in de oefenbibliotheek.
// Linkerknie en linkerhand op een vlakke bank, de rechtervoet ernaast op de
// grond. De steunhand staat onder de schouder, de rug ligt plat als een tafel en
// de nek in het verlengde, de blik schuin naar de grond voor je. De dumbbell
// hangt in de rechterhand onder de schouder met een gestrekte arm; onderin zakt
// de werkende schouder een paar graden (romp draait licht mee) zodat je de rek ziet,
// en gaat in een kleine boog naar het heupbot: de elleboog langs de zij omhoog,
// de schouders blijven evenwijdig aan de bank (romp draait niet open).
// Tempo: 1 tel omhoog, kort stil, 2 tellen omlaag.
// Camera bijna van opzij aan de werkende kant: rug, elleboog en heupbot groot in beeld.
// Bovenin staat de elleboog net boven de ruglijn, de bovenarm langs de romp.

import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'
import { handPlek, houding, lus, metMoment, rechtsNaar } from '../bouw/basis'
import { NEUTRAAL } from './gedeeld'

/** Bovenkant van het kussen van de vlakke bank. */
const BANK_Y = 0.43
/** De bank ligt in de lengte onder de linkerknie en de linkerhand. */
const BANK = { x: 0.14, y: 0, z: 0.15 } as const
/** Pols van een platte hand boven het vlak. */
const POLS_BOVEN_VLAK = 0.023

/** Romp vrijwel horizontaal, rug plat van heup tot nek. */
const ROMP = houding({ bekkenY: 0.906, bekkenZ: 0, kantel: 80, lende: 0, borst: 2, nek: 0, schouders: -0.005 })

/** Onderarm van de werkende arm hangt omlaag als de elleboog buigt. */
const OMLAAG = { x: 0, y: -1, z: 0 } as const

const BASIS: Oefening3d = {
  naam: 'Eenarmige dumbbell row',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  handenRechts: 'greep',
  // Linkerknie op de bank met het scheenbeen plat erop, de wreef over de rand.
  enkel: { x: 0.1, y: BANK_Y + 0.03, z: -0.36 },
  voet: { kanteling: 140, uitdraai: 0 },
  knieRichting: { x: 0, y: -0.2, z: 1 },
  // Rechtervoet breed naast de bank en iets naar achteren, zodat de dumbbell vrij langs het been gaat.
  enkelRechts: { x: -0.3, y: 0.08, z: -0.16 },
  voetRechts: { kanteling: 0, uitdraai: 12 },
  knieRichtingRechts: { x: -0.6, y: 0, z: 1 },
  elleboogRichting: { x: 0.3, y: 0.2, z: -1 },
  elleboogRichtingRechts: { x: -0.12, y: 1, z: -0.35 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'bankKaal', plek: BANK }, { soort: 'halters', zijde: 'rechts' }],
  spieren: ['rug'],
  spierenSecundair: ['bovenarm', 'schouder'],
  blik: { hoek: 62 },
  camera: { hoek: -76, hoogte: 14, afstand: 3.1, doel: { x: 0, y: 0.68, z: 0.08 } },
}

/** Stand van de werkende arm: `heffen` 0 = recht omlaag, negatief = naar achteren. */
function stand(p: { heffen: number; opzij: number; elleboog: number; rol: number; laag: number }): Houding {
  // Onderin draait de romp een paar graden naar de werkende kant: die schouder zakt (rek).
  // Het bekken zakt iets mee, zodat de steunarm de bank blijft halen.
  const romp = { ...ROMP, rol: p.rol, bekkenY: ROMP.bekkenY - p.laag }
  const s = schouderIn(romp)
  // Linkerhand plat op de bank, recht onder de schouder.
  const steun = { ...romp, greep: 0.165, lastY: BANK_Y + POLS_BOVEN_VLAK, lastZ: s.z }
  // De rechterarm gespiegeld uit gewrichtshoeken: de baan wordt zo een boog om de schouder.
  // Gespiegeld lichaam met tegengestelde rol, zodat de rechterschouder op de goede plek zit.
  const g = handPlek({ ...romp, rol: -p.rol }, { heffen: p.heffen, opzij: p.opzij, elleboog: p.elleboog, buig: OMLAAG })
  return rechtsNaar(BASIS, steun, { x: -g.greep, y: g.lastY, z: g.lastZ })
}

export const EENARMIGE_DUMBBELL_ROW: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus(
    { heffen: 6, opzij: 0, elleboog: 8, rol: 13, laag: 0.05 },
    { heffen: -90, opzij: 1, elleboog: 88, rol: 0, laag: 0 },
    stand,
    { begin: 0.5, heen: 1.0, eind: 0.6, terug: 2.0 },
    3,
  ),
})
