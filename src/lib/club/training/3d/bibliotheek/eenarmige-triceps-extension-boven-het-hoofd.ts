// 3D-oefening: Eenarmige triceps extension boven het hoofd. Naam exact zoals in de oefenbibliotheek.
// Rechtop zittend dwars op een vlakke bank (geen hoge rugleuning, zodat de
// dumbbell vrij achter het hoofd zakt), voeten plat, rug recht, buik licht vast.
// De dumbbell zit in de linkerhand boven het hoofd (neutrale greep). De linker
// bovenarm staat verticaal naast het hoofd, de elleboog wijst naar het plafond
// en blijft op zijn plek (niet naar buiten). Alleen de onderarm beweegt: in 3
// tellen zakt de dumbbell achter het hoofd tot een goede rek, kort stil, en in
// 1 tel strek je de arm helemaal uit. De rechterhand rust op de rechterdij, zodat
// het gezicht en de werkende arm vrij in beeld blijven.
// De elleboog staat op een vaste plek (ELLEBOOG): de dumbbell zakt achter het
// hoofd langs richting nek en bovenrug, de elleboog wijst steeds naar het plafond.
// Een vlakke bank in plaats van een rugleuning: een hoge leuning zou de baan
// achter het hoofd verbergen. Camera bijna van opzij aan de werkende kant.

import { BLIK, handPlek, houding, lus, metMoment, rechtsNaar } from '../bouw/basis'
import { Vector3 } from 'three'
import { ARM_GREEP, figuurIn, schouderIn } from '../kinematica'
import { MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

/** De onderarm zakt achter het hoofd langs, iets naar het midden: richting nek en bovenrug. */
const NAAR_NEK = { x: -0.4, y: 0, z: -1 }

/** Romp: rechtop dwars op een vlakke bank, rug recht en buik licht vast. */
const ROMP = houding({ bekkenY: 0.535, bekkenZ: -0.1, kantel: -1, lende: 0, borst: 2, nek: 2, schouders: 0.01 })

/** Bovenarm: vrijwel verticaal, net naast het hoofd. */
const HEFFEN = 174
const OPZIJ = -3

const BASIS: Oefening3d = {
  naam: 'Eenarmige triceps extension boven het hoofd',
  sleutels: [],
  last: 'wereld',
  handen: 'greep',
  handenRechts: 'plat',
  greepAnatomisch: true,
  enkel: { x: 0.15, y: 0.08, z: 0.38 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.1, y: 0.3, z: 1 },
  elleboogRichting: { x: -0.12, y: 1, z: 0.45 },
  elleboogRichtingRechts: { x: -0.8, y: 0, z: -0.5 },
  materiaal: [{ soort: 'bankKaal', draai: 90, plek: { x: 0, y: 0, z: -0.14 } }, { soort: 'halters', zijde: 'links' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['romp'],
  blik: BLIK.vooruit,
  camera: { hoek: 80, hoogte: 12, afstand: 3.7, doel: { x: 0.04, y: 1.0, z: 0.04 } },
}

/** De rechterhand rust plat op de rechterdij, iets voor het midden: de romp blijft stil. */
function opDij(h: Houding): Houding {
  const been = figuurIn(BASIS, h).benen[1]
  const p = been.begin.clone().lerp(been.midden, 0.62)
  return rechtsNaar(BASIS, h, { x: p.x + 0.01, y: p.y + 0.075, z: p.z })
}

/** Vaste plek van de elleboog: op de lijn van de gestrekte arm, naast het hoofd. */
const ELLEBOOG = (() => {
  const s = schouderIn(ROMP)
  const g = handPlek(ROMP, { heffen: HEFFEN, opzij: OPZIJ, elleboog: 0 })
  const hand = new Vector3(g.greep, g.lastY, g.lastZ)
  return s.lerp(hand, MATEN.bovenarm / (MATEN.bovenarm + ARM_GREEP))
})()

/** Afstand van de elleboog tot ELLEBOOG bij een draai van de elleboog om de lijn schouder-hand. */
function elleboogFout(h: Houding, draai: number): number {
  return figuurIn(BASIS, { ...h, elleboog: draai }).armen[0].midden.distanceTo(ELLEBOOG)
}

/**
 * Houdt de elleboog op ELLEBOOG: de vuist komt precies op de berekende plek (de
 * greep ligt net voor de vuist) en de elleboog draait om de lijn schouder-hand tot
 * hij op zijn vaste plek naast het hoofd staat.
 */
function elleboogVast(h: Houding, vuist: Vector3): Houding {
  let uit = h
  for (let i = 0; i < 6; i++) {
    const fout = vuist.clone().sub(figuurIn(BASIS, uit).armen[0].eind)
    uit = { ...uit, greep: uit.greep + fout.x, lastY: uit.lastY + fout.y, lastZ: uit.lastZ + fout.z }
    let beste = uit.elleboog
    for (let d = -60; d <= 60; d += 0.5) if (elleboogFout(uit, d) < elleboogFout(uit, beste)) beste = d
    uit = { ...uit, elleboog: beste }
  }
  return uit
}

function stand(p: { elleboog: number }): Houding {
  const g = handPlek(ROMP, { heffen: HEFFEN, opzij: OPZIJ, elleboog: p.elleboog, buig: NAAR_NEK })
  return opDij(elleboogVast({ ...ROMP, ...g, draai: 90, draaiRechts: 0 }, new Vector3(g.greep, g.lastY, g.lastZ)))
}

/** 3 tellen omlaag, kort stil, 1 tel omhoog. */
const TEMPO_LUS = { begin: 0.4, heen: 2.8, eind: 0.4, terug: 1.0 }

/** Het contactblad begint midden in de pauze bovenin: 0 is de gestrekte arm, onderin valt rond 0,7. */
const ONDERIN_OP = (TEMPO_LUS.begin / 2 + TEMPO_LUS.heen + TEMPO_LUS.eind / 2) / (TEMPO_LUS.begin + TEMPO_LUS.heen + TEMPO_LUS.eind + TEMPO_LUS.terug)

export const EENARMIGE_TRICEPS_EXTENSION_BOVEN_HET_HOOFD: Oefening3d = metMoment(
  { ...BASIS, sleutels: lus({ elleboog: 2 }, { elleboog: 150 }, stand, TEMPO_LUS, 5) },
  ONDERIN_OP,
)
