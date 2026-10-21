// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen push-up (PUUR) ───────────
// Een push-up is een plank die als een geheel om een vast steunpunt draait: de
// neus van de schoen (op de vloer of op een bank) of de knie (push-up op
// knieen). De handen staan plat op een steunvlak (vloer of bank). Per stand
// rekenen we de hoek van de plank uit, zodat het bekken op de lijn
// steunpunt-schouder ligt en de nek in het verlengde van de rug loopt:
// - boven: armen bijna gestrekt, schouder net voor of boven de pols;
// - onder: de borst hangt net boven het steunvlak (vloer of rand van de bank).
// Zelfde rekenwijze als het prototype (../bibliotheek/push-up.ts), maar met de
// steun, het handvlak, de handbreedte en de ellebogen als instelling.

import { Vector3 } from 'three'
import { romp, schouderIn } from '../kinematica'
import { MATEN } from '../maten'
import type { Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import { houding, lus, metMoment, type Tempo } from './basis'

const GRAAD = Math.PI / 180

/** Neus van de schoen (onderkant) in het frame van de voet, ten opzichte van de enkel. */
const NEUS = { y: -0.068, z: 0.229 }
/** Voet iets gestrekt ten opzichte van het onderbeen (graden), zoals op de tenen. */
const VOET_STREK = 14
/** Hoe gestrekt de benen zijn (net niet op slot). */
const BEEN_STREK = 0.997
/** Schouder iets achter het rompmidden: zo ligt de schouder op de lijn steun-heup. */
const ROMP_OFFSET = Math.atan2(0.035, 0.48) / GRAAD
/** De pols staat zo ver boven het vlak waar de handpalm op ligt. */
const POLS_BOVEN_VLAK = 0.023
/** Arm bijna gestrekt (net niet op slot). */
const ARM = (MATEN.bovenarm + MATEN.onderarm) * 0.996

/** Op de tenen: de neus van de schoen staat op `teen` (linkervoet). */
export interface SteunTenen {
  readonly soort: 'tenen'
  readonly teen: Vec3
}

/**
 * Op de knieen: het kniegewricht ligt op `knie` (linkerknie), de schenen gaan
 * onder `scheenHoek` graden schuin omhoog naar achteren, voeten ontspannen.
 */
export interface SteunKnieen {
  readonly soort: 'knieen'
  readonly knie: Vec3
  readonly scheenHoek: number
}

export interface PushUpOpties {
  readonly naam: string
  readonly steun: SteunTenen | SteunKnieen
  /** Hoogte van het vlak onder de handen (mat, bank) en halve afstand tussen de polsen. */
  readonly hand: { readonly vlak: number; readonly x: number }
  /** Pols ten opzichte van de schouder (z) in de bovenste stand; negatief = pols iets onder de borst. */
  readonly handVoor?: number
  /** Ruimte tussen de borst en het vlak onder de handen in de onderste stand (m, standaard 1,5 cm). */
  readonly borstVrij?: number
  /** Hoeveel het bekken onderin een fractie zakt (m), zodat het broekje niet uitpiekt. */
  readonly bekkenZak?: number
  readonly nek?: number
  readonly elleboogRichting: Vec3
  readonly materiaal: readonly Materiaal[]
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly tempo?: Tempo
}

/** 2 tellen omlaag, kort stil, 1 tel omhoog (zoals de coaching van alle push-ups). */
export const TEMPO_PUSH_UP: Tempo = { begin: 0.4, heen: 1.7, eind: 0.3, terug: 1.0 }

/** Kanteling van de voet op de tenen als de plank `hoek` graden omhoog wijst. */
function voetHoek(hoek: number): number {
  return 90 - hoek + VOET_STREK
}

/** Plek van de enkel als de neus van de schoen op `teen` blijft staan. */
function enkelBij(teen: Vec3, hoek: number): { y: number; z: number } {
  const a = voetHoek(hoek) * GRAAD
  const dy = NEUS.y * Math.cos(a) - NEUS.z * Math.sin(a)
  const dz = NEUS.y * Math.sin(a) + NEUS.z * Math.cos(a)
  return { y: teen.y - dy, z: teen.z - dz }
}

interface Plank {
  /** De plank onder `hoek` graden met de handen op `handZ`, bekken `zak` onder de lijn. */
  stand(hoek: number, handZ: number, zak: number): Houding
  readonly enkel: Vec3
  readonly voet: { readonly kanteling: number; readonly uitdraai: number }
  readonly knieRichting: Vec3
}

function opTenen(op: PushUpOpties, s: SteunTenen): Plank {
  const basisVoet = voetHoek(0)
  const basisEnkel = enkelBij(s.teen, 0)
  const lengte = (MATEN.dij + MATEN.scheen) * BEEN_STREK
  return {
    stand(hoek, handZ, zak) {
      const enkel = enkelBij(s.teen, hoek)
      const r = hoek * GRAAD
      return houding({
        bekkenY: enkel.y + Math.sin(r) * lengte - zak,
        bekkenZ: enkel.z + Math.cos(r) * lengte,
        kantel: 90 - hoek + ROMP_OFFSET,
        nek: op.nek ?? 0,
        lastY: op.hand.vlak + POLS_BOVEN_VLAK,
        lastZ: handZ,
        greep: op.hand.x,
        voetY: enkel.y - basisEnkel.y,
        voetZ: enkel.z - basisEnkel.z,
        voetKantel: voetHoek(hoek) - basisVoet,
      })
    },
    enkel: { x: s.teen.x, y: basisEnkel.y, z: basisEnkel.z },
    voet: { kanteling: basisVoet, uitdraai: 0 },
    knieRichting: { x: 0, y: -1, z: 0.15 },
  }
}

function opKnieen(op: PushUpOpties, s: SteunKnieen): Plank {
  const b = s.scheenHoek * GRAAD
  return {
    stand(hoek, handZ, zak) {
      const r = hoek * GRAAD
      return houding({
        bekkenY: s.knie.y + Math.sin(r) * MATEN.dij - zak,
        bekkenZ: s.knie.z + Math.cos(r) * MATEN.dij,
        kantel: 90 - hoek + ROMP_OFFSET,
        nek: op.nek ?? 0,
        lastY: op.hand.vlak + POLS_BOVEN_VLAK,
        lastZ: handZ,
        greep: op.hand.x,
      })
    },
    // De schenen wijzen vanaf de knie schuin omhoog naar achteren en blijven stil.
    enkel: { x: s.knie.x, y: s.knie.y + Math.sin(b) * MATEN.scheen, z: s.knie.z - Math.cos(b) * MATEN.scheen },
    // Voet ontspannen gestrekt: wreef naar achteren, tenen wijzen weg van de knie.
    voet: { kanteling: 90 + s.scheenHoek + 22, uitdraai: 0 },
    knieRichting: { x: 0, y: -1, z: 0 },
  }
}

/** Punten op de voorkant van de borst (frame van de borst): van onder de borstspier tot de tepellijn. */
const BORST = [0.06, 0.1, 0.13, 0.16, 0.19].map((y) => new Vector3(0, y, 0.128))

/** Het laagste punt van de borst in de wereld. */
function borstLaagste(h: Houding): number {
  const b = romp(h).borst
  return Math.min(...BORST.map((p) => p.clone().applyQuaternion(b.rot).add(b.pos).y))
}

/** Zoek de hoek waarbij `maat` (stijgend met de hoek) het doel haalt. */
function zoekHoek(maat: (hoek: number) => number, doel: number): number {
  let laag = -45
  let hoog = 70
  for (let i = 0; i < 60; i++) {
    const m = (laag + hoog) / 2
    if (maat(m) < doel) laag = m
    else hoog = m
  }
  return (laag + hoog) / 2
}

/** Een push-up: plank om het steunpunt, handen plat op het vlak. */
export function pushUp(op: PushUpOpties): Oefening3d {
  const p = op.steun.soort === 'tenen' ? opTenen(op, op.steun) : opKnieen(op, op.steun)
  const polsY = op.hand.vlak + POLS_BOVEN_VLAK
  const handVoor = op.handVoor ?? -0.012
  const hoekBoven = zoekHoek((hoek) => {
    const s = schouderIn(p.stand(hoek, 0, 0))
    const dx = s.x - op.hand.x
    const hoogte = Math.sqrt(ARM ** 2 - dx * dx - handVoor ** 2)
    return s.y - polsY - hoogte
  }, 0)
  const handZ = schouderIn(p.stand(hoekBoven, 0, 0)).z + handVoor
  const zak = op.bekkenZak ?? 0.02
  const hoekOnder = zoekHoek((hoek) => borstLaagste(p.stand(hoek, handZ, zak)), op.hand.vlak + (op.borstVrij ?? 0.015))
  const o: Oefening3d = {
    naam: op.naam,
    sleutels: lus({ hoek: hoekBoven, zak: 0 }, { hoek: hoekOnder, zak }, (q) => p.stand(q.hoek, handZ, q.zak), op.tempo ?? TEMPO_PUSH_UP, 2),
    last: 'wereld',
    handen: 'plat',
    enkel: p.enkel,
    voet: p.voet,
    knieRichting: p.knieRichting,
    elleboogRichting: op.elleboogRichting,
    materiaal: op.materiaal,
    spieren: op.spieren,
    ...(op.spierenSecundair ? { spierenSecundair: op.spierenSecundair } : {}),
    camera: op.camera,
  }
  return metMoment(o)
}
