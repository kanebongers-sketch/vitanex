// ─── Fit Factory Club, 3D-oefenbeelden: bouwstenen, basis (PUUR) ────────────
// Gereedschap om een oefening in een paar regels data te beschrijven:
// - `houding()` vult niet genoemde kanalen met 0;
// - `lus()` maakt van een begin- en eindstand een herhaling met trainerstempo,
//   met tussenstanden in de ruimte van de parameters (een curl volgt zo een
//   echte boog in plaats van een rechte lijn);
// - `handPlek()` en `enkelPlek()` rekenen vanuit gewrichtshoeken uit waar een
//   hand of enkel zit (voorwaartse kinematica), zodat de inverse kinematica
//   precies die arm of dat been terugvindt;
// - `balanceer()` schuift het bekken tot het zwaartepunt boven de voeten ligt.

import { Vector3 } from 'three'
import { figuurIn, heupIn, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import { KANALEN, type Houding, type Kanaal, type Oefening3d, type Sleutel, type Vec3 } from '../typen'

const GRAAD = Math.PI / 180

/** Een houding waarin alle niet genoemde kanalen 0 zijn. */
export function houding(d: Partial<Houding>): Houding {
  const uit = {} as Record<Kanaal, number>
  for (const k of KANALEN) uit[k] = d[k] ?? 0
  return uit
}

/** Seconden: stil in het begin, naar het eind, stil op het eind, terug. */
export interface Tempo {
  readonly begin: number
  readonly heen: number
  readonly eind: number
  readonly terug: number
}

/** Gangbare tempo's zoals een trainer ze voordoet. */
export const TEMPO = {
  /** Zakken in 2 tellen, kort stil, krachtig omhoog (squat, drukken). */
  zakken: { begin: 0.6, heen: 2.0, eind: 0.3, terug: 1.3 },
  /** Eerst de zware fase in 1,2 tellen, even vasthouden, 2 tellen terug (trekken, curl). */
  trekken: { begin: 0.4, heen: 1.2, eind: 0.4, terug: 2.0 },
  /** Kort en snel (kettlebell swing). */
  explosief: { begin: 0.15, heen: 0.75, eind: 0.2, terug: 0.85 },
  /** Vasthouden met rustige ademhaling (plank). */
  houden: { begin: 1.4, heen: 1.1, eind: 1.0, terug: 1.1 },
} as const satisfies Record<string, Tempo>

export type Params = Readonly<Record<string, number>>

function meng<P extends Params>(van: P, naar: P, f: number): P {
  const uit: Record<string, number> = {}
  for (const k of Object.keys(van)) uit[k] = van[k] + ((naar[k] ?? van[k]) - van[k]) * f
  return uit as P
}

/**
 * Een herhaling van `van` naar `naar` en terug. `maak` zet de parameters om in een
 * houding; `tussen` extra standen per richting maken de baan rond.
 */
export function lus<P extends Params>(van: P, naar: P, maak: (p: P) => Houding, tempo: Tempo, tussen = 0): Sleutel[] {
  const n = tussen + 1
  const heen: Sleutel[] = [{ houding: maak(van), vast: tempo.begin, naarVolgende: tempo.heen / n }]
  for (let i = 1; i < n; i++) heen.push({ houding: maak(meng(van, naar, i / n)), vast: 0, naarVolgende: tempo.heen / n })
  const terug: Sleutel[] = [{ houding: maak(naar), vast: tempo.eind, naarVolgende: tempo.terug / n }]
  for (let i = 1; i < n; i++) terug.push({ houding: maak(meng(naar, van, i / n)), vast: 0, naarVolgende: tempo.terug / n })
  return [...heen, ...terug]
}

/** Een eenvoudige lus tussen twee kant-en-klare houdingen. */
export function lusTussen(a: Houding, b: Houding, tempo: Tempo): Sleutel[] {
  return [
    { houding: a, vast: tempo.begin, naarVolgende: tempo.heen },
    { houding: b, vast: tempo.eind, naarVolgende: tempo.terug },
  ]
}

/**
 * Stand van een arm in gewrichtshoeken (graden), in de wereld:
 * `heffen` 0 = arm hangt, 90 = recht vooruit, 180 = recht omhoog;
 * `opzij` 0 = in het vlak voor het lichaam, 90 = zijwaarts;
 * `elleboog` buiging, de onderarm buigt in de richting `buig`.
 */
export interface ArmStand {
  readonly heffen: number
  readonly opzij: number
  readonly elleboog: number
  readonly buig?: Vec3
}

function richtingArm(heffen: number, opzij: number): Vector3 {
  const f = heffen * GRAAD
  const o = opzij * GRAAD
  return new Vector3(Math.sin(o), -Math.cos(o) * Math.cos(f), Math.cos(o) * Math.sin(f))
}

function buigLid(boven: Vector3, buiging: number, buig: Vec3): Vector3 {
  const b = new Vector3(buig.x, buig.y, buig.z)
  const loodrecht = b.sub(boven.clone().multiplyScalar(b.dot(boven)))
  if (loodrecht.lengthSq() < 1e-8) return boven.clone()
  loodrecht.normalize()
  const e = buiging * GRAAD
  return boven.clone().multiplyScalar(Math.cos(e)).add(loodrecht.multiplyScalar(Math.sin(e)))
}

export interface Plek {
  readonly lastY: number
  readonly lastZ: number
  readonly greep: number
}

/**
 * Waar de linkerhand zit bij deze armstand (de rechter is gespiegeld). Geeft de
 * kanalen lastY, lastZ en greep voor een last in de wereld.
 */
export function handPlek(h: Houding, arm: ArmStand, plat = false): Plek {
  const s = schouderIn(h)
  const boven = richtingArm(arm.heffen, arm.opzij)
  const onder = buigLid(boven, arm.elleboog, arm.buig ?? { x: 0, y: 0, z: 1 })
  const hand = s.add(boven.multiplyScalar(MATEN.bovenarm)).add(onder.multiplyScalar(plat ? MATEN.onderarm : ARM_GREEP))
  return { lastY: hand.y, lastZ: hand.z, greep: hand.x }
}

/**
 * Waar de linkerenkel zit bij deze beenstand: `heffen` is de dij ten opzichte van
 * omlaag (90 = dij recht vooruit), `knie` de buiging, de scheen buigt naar `buig`.
 */
export function enkelPlek(h: Houding, been: { heffen: number; opzij?: number; knie: number; buig?: Vec3 }): Vector3 {
  const heup = heupIn(h)
  const dij = richtingArm(been.heffen, been.opzij ?? 0)
  const scheen = buigLid(dij, been.knie, been.buig ?? { x: 0, y: -1, z: 0 })
  return heup.add(dij.multiplyScalar(MATEN.dij)).add(scheen.multiplyScalar(MATEN.scheen))
}

/** Waar de enkel heen gaat als de voet om de bal van de voet kantelt (calf raise). */
export function opTenen(graden: number): { voetY: number; voetZ: number } {
  const a = graden * GRAAD
  const y = 0.08
  const z = -0.13
  return {
    voetY: y * Math.cos(a) - z * Math.sin(a) - y,
    voetZ: y * Math.sin(a) + z * Math.cos(a) - z,
  }
}

/** Gewichten van de delen voor het zwaartepunt (fractie van het lichaam). */
const DELEN = { romp: 0.43, hoofd: 0.08, dij: 0.1, scheen: 0.06, arm: 0.05 } as const

/** Het zwaartepunt (alleen z) van figuur plus last. */
export function zwaartepuntZ(o: Oefening3d, h: Houding, lastGewicht: number): number {
  const f = figuurIn(o, h)
  let som = 0
  let massa = 0
  const tel = (z: number, m: number) => {
    som += z * m
    massa += m
  }
  tel((f.bekken.pos.z + f.borst.pos.z) / 2, DELEN.romp)
  tel(f.hoofd.pos.z, DELEN.hoofd)
  for (const b of f.benen) {
    tel((b.begin.z + b.midden.z) / 2, DELEN.dij)
    tel((b.midden.z + b.eind.z) / 2, DELEN.scheen)
  }
  for (const a of f.armen) tel((a.begin.z + a.eind.z) / 2, DELEN.arm)
  tel(f.last.pos.z, lastGewicht)
  return som / massa
}

/**
 * Schuif het bekken naar voren of achteren tot het zwaartepunt boven `doelZ`
 * ligt (meestal het midden van de voet). Werkt voor staande oefeningen.
 */
export function balanceer(o: Oefening3d, h: Houding, doelZ: number, lastGewicht = 0): Houding {
  let uit = h
  for (let i = 0; i < 12; i++) {
    const fout = zwaartepuntZ(o, uit, lastGewicht) - doelZ
    if (Math.abs(fout) < 0.001) break
    uit = bereikbaar(o, { ...uit, bekkenZ: uit.bekkenZ - fout * 1.2 })
  }
  return bereikbaar(o, uit)
}

/**
 * Laat het bekken zakken tot beide voeten met een licht gebogen knie bereikbaar
 * zijn (staand, lunge). Zo staat een knie nooit op slot en blijft de voet staan.
 */
export function bereikbaar(o: Oefening3d, h: Houding, maxReik = 0.994): Houding {
  let uit = h
  for (let i = 0; i < 20; i++) {
    const f = figuurIn(o, uit)
    const reik = Math.max(f.benen[0].reik, f.benen[1].reik)
    if (reik <= maxReik) break
    uit = { ...uit, bekkenY: uit.bekkenY - (reik - maxReik) * (MATEN.dij + MATEN.scheen) - 0.0005 }
  }
  return uit
}

/**
 * Zet het bekken zo dat een punt op de romp (in het frame van de borst, standaard
 * de bovenrug) op `doel` in de wereld ligt. Voor oefeningen die op een bank
 * steunen (hip thrust).
 */
export function steunOp(h: Houding, doel: Vec3, punt: Vec3 = { x: 0, y: 0.12, z: -0.11 }): Houding {
  const nul = houding({ ...h, bekkenY: 0, bekkenZ: 0 })
  const f = figuurIn(LEEG, nul)
  const p = new Vector3(punt.x, punt.y, punt.z).applyQuaternion(f.borst.rot).add(f.borst.pos)
  return { ...h, bekkenY: doel.y - p.y, bekkenZ: doel.z - p.z }
}

/** Een lege oefening om alleen de romp mee door te rekenen. */
const LEEG: Oefening3d = {
  naam: '',
  sleutels: [],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.1, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 0 },
  knieRichting: { x: 0, y: 0, z: 1 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  materiaal: [],
  spieren: [],
  camera: { hoek: 0, hoogte: 0, afstand: 1, doel: { x: 0, y: 0, z: 0 } },
}

/** Standaard voor een staand figuur: enkel, voet en buigrichtingen. */
export const STAAND = {
  enkel: { x: 0.14, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.25, y: 0, z: 1 },
} as const

/** Hoogte van het heupgewricht staand met bijna gestrekte benen. */
export const HEUP_STAAND = 0.944
