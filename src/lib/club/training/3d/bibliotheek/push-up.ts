// 3D-oefening: Push-up. Naam exact zoals in de oefenbibliotheek.
// Handen iets breder dan de schouders, lichaam een rechte lijn van hielen tot
// hoofd. Het hele lichaam draait als een plank om de tenen: zakken tot de borst
// net boven de vloer, ellebogen schuin naar achteren (ongeveer 45 graden), dan
// in een stuk terug omhoog.
//
// De houdingen worden uitgerekend in plaats van geschat: per stand kiezen we de
// hoek van de plank, de tenen blijven op de mat, het bekken ligt op de lijn
// enkel-schouder en de blik ligt vast op de vloer net voor de handen.

import { houding, lus, metMoment, type Tempo } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

const GRAAD = Math.PI / 180

/** Bovenkant van de mat (de mat is 12 mm dik). */
const MAT = 0.012
/** Waar de neus van de schoen op de mat staat (linkervoet). */
const TEEN = { x: 0.1, y: MAT - 0.006, z: -1.02 }
/** Neus van de schoen (onderkant) in het frame van de voet, ten opzichte van de enkel. */
const NEUS = { y: -0.068, z: 0.229 }
/** Voet iets gestrekt ten opzichte van het onderbeen (graden), zoals op de tenen. */
const VOET_STREK = 0
/** Hoe gestrekt de benen zijn (net niet op slot). */
const BEEN_STREK = 0.9995
/** Schouder iets achter het rompmidden: zo ligt de schouder op de lijn enkel-heup. */
const ROMP_OFFSET = Math.atan2(0.035, 0.48) / GRAAD
/** Hoogte van de pols op de mat. */
const POLS_Y = 0.035
const BOVENARM_ONDERARM = (MATEN.bovenarm + MATEN.onderarm) * 0.99
/** Hoogte van het schoudergewricht onderin: de borst hangt dan een paar centimeter boven de mat. */
const SCHOUDER_ONDER = 0.185
/**
 * Elleboog onderin ten opzichte van de schouder: opzij en naar achteren (ongeveer
 * 40 graden van de romp), op borsthoogte naast de ribben, met de onderarm bijna
 * verticaal boven de pols.
 */
const ELLEBOOG_OPZIJ = 0.165
/** Hoe hoog de elleboog onderin boven de schouder komt: ongeveer op rughoogte, niet erboven. */
const ELLEBOOG_DY = 0.115
/** Pols iets binnen de elleboog: de onderarm staat bijna recht. */
const POLS_BINNEN = 0.03
/** Onderin zakt het bekken een fractie, zodat het broekje niet boven de plank uitpiekt. */
const BEKKEN_ZAK = 0.08
/** Bovenrug een paar graden gestrekt: borst vooruit, schouders laag en weg van de oren. */
const BORST = -7

/** Kanteling van de voet als de plank `hoek` graden omhoog wijst. */
function voetHoek(hoek: number): number {
  return 90 - hoek + VOET_STREK
}

/** Plek van de enkel als de neus van de schoen op TEEN blijft staan. */
function enkelBij(hoek: number): { y: number; z: number } {
  const a = voetHoek(hoek) * GRAAD
  const dy = NEUS.y * Math.cos(a) - NEUS.z * Math.sin(a)
  const dz = NEUS.y * Math.sin(a) + NEUS.z * Math.cos(a)
  return { y: TEEN.y - dy, z: TEEN.z - dz }
}

const BASIS_VOET = voetHoek(0)
const BASIS_ENKEL = enkelBij(0)

/** De plank onder `hoek` graden, polsen op `hand`, bekken `zak` meter onder de lijn. */
function plank(hoek: number, hand = { x: 0, z: 0 }, zak = 0): Houding {
  const enkel = enkelBij(hoek)
  const lengte = (MATEN.dij + MATEN.scheen) * BEEN_STREK
  const r = hoek * GRAAD
  // Het bekken zakt `zak` onder de lijn, maar het been blijft even lang.
  const dy = Math.sin(r) * lengte - zak
  const dz = Math.sqrt(Math.max(0, lengte * lengte - dy * dy))
  return houding({
    bekkenY: enkel.y + dy,
    bekkenZ: enkel.z + dz,
    kantel: 90 - hoek + ROMP_OFFSET,
    nek: 0,
    borst: BORST,
    lastY: POLS_Y,
    lastZ: hand.z,
    greep: hand.x,
    voetY: enkel.y - BASIS_ENKEL.y,
    voetZ: enkel.z - BASIS_ENKEL.z,
    voetKantel: voetHoek(hoek) - BASIS_VOET,
  })
}

/** Zoek de hoek waarbij `maat` (stijgend met de hoek) het doel haalt. */
function zoekHoek(maat: (hoek: number) => number, doel: number): number {
  let laag = -10
  let hoog = 40
  for (let i = 0; i < 50; i++) {
    const m = (laag + hoog) / 2
    if (maat(m) < doel) laag = m
    else hoog = m
  }
  return (laag + hoog) / 2
}

/** Onder: schoudergewricht op de hoogte waarbij de borst net boven de mat is. */
const HOEK_ONDER = zoekHoek((hoek) => schouderIn(plank(hoek, undefined, BEKKEN_ZAK)).y, SCHOUDER_ONDER)
const SCHOUDER_O = schouderIn(plank(HOEK_ONDER, undefined, BEKKEN_ZAK))

/** Elleboog onderin: de bovenarm reikt opzij en naar achteren, licht omhoog, langs de ribben. */
const ELLEBOOG_ACHTER = Math.sqrt(MATEN.bovenarm ** 2 - ELLEBOOG_OPZIJ ** 2 - ELLEBOOG_DY ** 2)
const ELLEBOOG_O = {
  x: SCHOUDER_O.x + ELLEBOOG_OPZIJ,
  y: SCHOUDER_O.y + ELLEBOOG_DY,
  z: SCHOUDER_O.z - ELLEBOOG_ACHTER,
}
/** De pols staat onder de elleboog, net iets naar binnen. */
const HAND = { x: ELLEBOOG_O.x - POLS_BINNEN, z: ELLEBOOG_O.z + 0.01 }

/** Boven: armen bijna gestrekt van schouder naar pols. */
const HOEK_BOVEN = zoekHoek((hoek) => {
  const s = schouderIn(plank(hoek))
  const dx = s.x - HAND.x
  const dz = s.z - HAND.z
  return s.y - POLS_Y - Math.sqrt(Math.max(0, BOVENARM_ONDERARM ** 2 - dx * dx - dz * dz))
}, 0)

/** 2 tellen omlaag, kort stil, 1 tel omhoog. */
const TEMPO_PUSH: Tempo = { begin: 0.4, heen: 1.7, eind: 0.25, terug: 1.0 }

export const PUSH_UP_3D: Oefening3d = metMoment({
  naam: 'Push-up',
  sleutels: lus(
    { hoek: HOEK_BOVEN, zak: 0 },
    { hoek: HOEK_ONDER, zak: BEKKEN_ZAK },
    (p) => plank(p.hoek, HAND, p.zak),
    TEMPO_PUSH,
    2,
  ),
  last: 'wereld',
  handen: 'plat',
  enkel: { x: TEEN.x, y: BASIS_ENKEL.y, z: BASIS_ENKEL.z },
  voet: { kanteling: BASIS_VOET, uitdraai: 0 },
  knieRichting: { x: 0, y: -1, z: 0.15 },
  elleboogRichting: {
    x: ELLEBOOG_O.x - SCHOUDER_O.x,
    y: ELLEBOOG_O.y - SCHOUDER_O.y,
    z: ELLEBOOG_O.z - SCHOUDER_O.z,
  },
  materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.25 } }],
  spieren: ['borst', 'bovenarm'],
  spierenSecundair: ['schouder', 'romp'],
  // Blik vast op de vloer net voor de handen: de nek strekt vanzelf iets mee als
  // de plank zakt, zodat de kin niet als eerste naar de mat gaat.
  blik: { hoek: 43 },
  camera: { hoek: 52, hoogte: 14, afstand: 3.5, doel: { x: 0, y: 0.24, z: -0.06 } },
})

