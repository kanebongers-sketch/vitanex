// 3D-oefening: Push-up. Naam exact zoals in de oefenbibliotheek.
// Handen iets breder dan de schouders, lichaam een rechte lijn van hielen tot
// hoofd. Het hele lichaam draait als een plank om de tenen: zakken tot de borst
// net boven de vloer, ellebogen schuin naar achteren (ongeveer 45 graden), dan
// in een stuk terug omhoog.
//
// De houdingen worden uitgerekend in plaats van geschat: per stand kiezen we de
// hoek van de plank, de tenen blijven op de mat, het bekken ligt op de lijn
// enkel-schouder en de nek loopt in het verlengde van de rug.

import { houding, lus, type Tempo } from '../bouw/basis'
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
const VOET_STREK = 14
/** Hoe gestrekt de benen zijn (net niet op slot). */
const BEEN_STREK = 0.999
/** Schouder iets achter het rompmidden: zo ligt de schouder op de lijn enkel-heup. */
const ROMP_OFFSET = Math.atan2(0.035, 0.48) / GRAAD
/** Handen: pols op de mat, iets breder dan de schouders. */
const HAND = { y: 0.035, x: 0.22 }
const BOVENARM_ONDERARM = (MATEN.bovenarm + MATEN.onderarm) * 0.996
/** Hoogte van het schoudergewricht onderin: de borst hangt dan net boven de mat. */
const SCHOUDER_ONDER = 0.15
/** Onderin zakt het bekken een fractie, zodat het broekje niet boven de plank uitpiekt. */
const BEKKEN_ZAK = 0.025

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

/** De plank onder `hoek` graden, handen op `handZ`, bekken `zak` meter onder de lijn. */
function plank(hoek: number, handZ = 0.2, zak = 0): Houding {
  const enkel = enkelBij(hoek)
  const lengte = (MATEN.dij + MATEN.scheen) * BEEN_STREK
  const r = hoek * GRAAD
  return houding({
    bekkenY: enkel.y + Math.sin(r) * lengte - zak,
    bekkenZ: enkel.z + Math.cos(r) * lengte,
    kantel: 90 - hoek + ROMP_OFFSET,
    nek: 0,
    lastY: HAND.y,
    lastZ: handZ,
    greep: HAND.x,
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

/** Boven: schouder net voor de pols, armen bijna gestrekt. */
const HOEK_BOVEN = zoekHoek((hoek) => {
  const s = schouderIn(plank(hoek))
  const dx = s.x - HAND.x
  const hoogte = Math.sqrt(BOVENARM_ONDERARM ** 2 - dx * dx - 0.012 ** 2)
  return s.y - HAND.y - hoogte
}, 0)
const HAND_Z = schouderIn(plank(HOEK_BOVEN)).z - 0.012

/** Onder: schoudergewricht op de hoogte waarbij de borst net boven de mat is. */
const HOEK_ONDER = zoekHoek((hoek) => schouderIn(plank(hoek, HAND_Z)).y, SCHOUDER_ONDER)

/** 2 tellen omlaag, kort stil, 1 tel omhoog. */
const TEMPO_PUSH: Tempo = { begin: 0.4, heen: 1.7, eind: 0.25, terug: 1.0 }

export const PUSH_UP_3D: Oefening3d = {
  naam: 'Push-up',
  sleutels: lus(
    { hoek: HOEK_BOVEN, zak: 0 },
    { hoek: HOEK_ONDER, zak: BEKKEN_ZAK },
    (p) => plank(p.hoek, HAND_Z, p.zak),
    TEMPO_PUSH,
    2,
  ),
  last: 'wereld',
  handen: 'plat',
  enkel: { x: TEEN.x, y: BASIS_ENKEL.y, z: BASIS_ENKEL.z },
  voet: { kanteling: BASIS_VOET, uitdraai: 0 },
  knieRichting: { x: 0, y: -1, z: 0.15 },
  elleboogRichting: { x: 0.6, y: 0.6, z: -1.4 },
  materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.35 } }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 58, hoogte: 11, afstand: 3.6, doel: { x: 0, y: 0.3, z: -0.12 } },
}

