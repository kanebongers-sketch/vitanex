// ─── Fit Factory Club, illustraties: het skelet in zijaanzicht (PUUR) ───────
// Voorwaartse kinematica: van het bekken via de wervelkolom (lage rug,
// borstwervels, nek) naar het hoofd en de schouder, en van de heup naar knie,
// enkel en voet; van de schouder naar elleboog, pols en greep. Het figuur kijkt
// naar rechts. "Nabij" is de kant naar de kijker, "ver" de kant erachter.
// Maten in cm, voor een figuur van ongeveer 178 cm (verhoudingen naar de
// gangbare antropometrische tabellen).

import { tweeDelen } from './ik'
import { assen, eind, min, plus, punt, richting, maal, type Assen, type Vec } from './vec'
import type { ArmHouding, BeenHouding, Doel, Lichaamspunt, ZijHouding } from './typen'

export const MATEN = {
  /** Lage-rugbasis in het bekken (langs, dwars). */
  lumbaalBasis: { langs: 9, dwars: -4 },
  lumbaal: 17,
  thoracaal: 28,
  /** Schoudergewricht in de borstwervels (langs, dwars). */
  schouder: { langs: 22.5, dwars: 1.5 },
  nekBasis: { langs: 27.5, dwars: 1.5 },
  nek: 8,
  bovenbeen: 44,
  onderbeen: 43,
  bovenarm: 30,
  onderarm: 25,
  /** Van pols tot midden van de vuist. */
  hand: 7,
  /** Enkel boven de zool, hiel achter en bal voor de enkel (in de voet). */
  enkelHoogte: 7.5,
  hiel: -4.5,
  bal: 14,
  teen: 19,
  /** De verre kant schuift een fractie naar voren: zo is er diepte zonder perspectief. */
  verSchuif: 1.6,
} as const

export interface ArmSkelet {
  /** Zichtbare lengtes (korter bij een brede greep). */
  readonly lBoven: number
  readonly lOnder: number
  readonly boven: Assen
  readonly onder: Assen
  readonly hand: Assen
  readonly greep: Vec
  readonly bereikt: boolean
}

export interface BeenSkelet {
  readonly boven: Assen
  readonly onder: Assen
  readonly voet: Assen
  readonly bereikt: boolean
}

export interface ZijSkelet {
  readonly bekken: Assen
  readonly lumbaal: Assen
  readonly thoracaal: Assen
  readonly nek: Assen
  readonly hoofd: Assen
  readonly armNabij: ArmSkelet
  readonly armVer: ArmSkelet
  readonly beenNabij: BeenSkelet
  readonly beenVer: BeenSkelet
}

export interface Romp {
  readonly bekken: Assen
  readonly lumbaal: Assen
  readonly thoracaal: Assen
  readonly nek: Assen
  readonly hoofd: Assen
}

/** Wervelkolom en hoofd, met de heup op de gegeven plek. */
export function rompVan(h: ZijHouding, heup: Vec): Romp {
  const bekken = assen(heup, h.bekken)
  const lHoek = h.bekken + h.lumbaal
  const lumbaal = assen(punt(bekken, MATEN.lumbaalBasis.langs, MATEN.lumbaalBasis.dwars), lHoek)
  const tHoek = lHoek + h.thoracaal
  const thoracaal = assen(eind(lumbaal, MATEN.lumbaal), tHoek)
  const nek = assen(punt(thoracaal, MATEN.nekBasis.langs, MATEN.nekBasis.dwars), tHoek + h.hoofd * 0.5)
  const hoofd = assen(eind(nek, MATEN.nek), tHoek + h.hoofd)
  return { bekken, lumbaal, thoracaal, nek, hoofd }
}

export function schouderVan(romp: Romp, ver: boolean, schouderblad = 0): Vec {
  return punt(romp.thoracaal, MATEN.schouder.langs, MATEN.schouder.dwars + schouderblad + (ver ? MATEN.verSchuif : 0))
}

export function heupVan(romp: Romp, ver: boolean): Vec {
  // Horizontaal verschoven: zo blijft de verre voet ook bij een gekanteld bekken op de vloer.
  return ver ? { x: romp.bekken.o.x + MATEN.verSchuif, y: romp.bekken.o.y } : romp.bekken.o
}

function armUitHoeken(schouder: Vec, schouderHoek: number, elleboog: number, pols: number): ArmSkelet {
  const boven = assen(schouder, schouderHoek)
  const onder = assen(eind(boven, MATEN.bovenarm), schouderHoek - elleboog)
  const hand = assen(eind(onder, MATEN.onderarm), onder.hoek - pols)
  return { lBoven: MATEN.bovenarm, lOnder: MATEN.onderarm, boven, onder, hand, greep: eind(hand, MATEN.hand), bereikt: true }
}

function beenUitHoeken(heup: Vec, b: { heup: number; knie: number; voet: number }): BeenSkelet {
  const boven = assen(heup, b.heup)
  const onder = assen(eind(boven, MATEN.bovenbeen), b.heup + b.knie)
  const voet = assen(eind(onder, MATEN.onderbeen), b.voet)
  return { boven, onder, voet, bereikt: true }
}

/** Een arm naar een doel: de greep (midden van de vuist) moet op het doel komen. */
export function armNaarDoel(schouder: Vec, doel: Vec, buig: 1 | -1, lengte: readonly [number, number] = [1, 1]): ArmSkelet {
  // Onderarm en hand samen als een recht deel: bij een greep staat de pols neutraal.
  // De hand (vuist) blijft altijd even groot, alleen de arm kan korter lijken.
  const lBoven = MATEN.bovenarm * lengte[0]
  const lOnder = (MATEN.onderarm + MATEN.hand) * lengte[1] - MATEN.hand
  const ik = tweeDelen(schouder, doel, lBoven, lOnder + MATEN.hand, buig)
  const boven = assen(schouder, ik.hoek1)
  const onder = assen(ik.midden, ik.hoek2)
  const hand = assen(eind(onder, lOnder), ik.hoek2)
  return { lBoven, lOnder, boven, onder, hand, greep: eind(hand, MATEN.hand), bereikt: ik.bereikt }
}

/** Een been naar een doel (de enkel, of de bal van de voet). */
export function beenNaarDoel(heup: Vec, doel: Vec, buig: 1 | -1, voetHoek: number, bal: boolean): BeenSkelet {
  const vu = richting(voetHoek)
  const vn = { x: -vu.y, y: vu.x }
  // Bij `bal` ligt het doel op de vloer onder de bal: de enkel zit daar langs en boven.
  const enkel = bal ? min(doel, plus(maal(vu, MATEN.bal), maal(vn, MATEN.enkelHoogte))) : doel
  const ik = tweeDelen(heup, enkel, MATEN.bovenbeen, MATEN.onderbeen, buig)
  const boven = assen(heup, ik.hoek1)
  const onder = assen(ik.midden, ik.hoek2)
  const voet = assen(ik.eind, voetHoek)
  return { boven, onder, voet, bereikt: ik.bereikt }
}

/** Contactpunten van de voet met de vloer. */
export function voetPunt(voet: Assen, welk: 'hiel' | 'bal' | 'teen'): Vec {
  return punt(voet, MATEN[welk], MATEN.enkelHoogte)
}

export type DoelZoeker = (doel: Doel) => Vec

function arm(h: ArmHouding, schouder: Vec, zoek: DoelZoeker | null): ArmSkelet | null {
  if ('hoeken' in h) return armUitHoeken(schouder, h.hoeken.schouder, h.hoeken.elleboog, h.pols ?? 0)
  return zoek ? armNaarDoel(schouder, zoek(h.doel), h.buig, h.lengte) : null
}

function been(h: BeenHouding, heup: Vec, zoek: DoelZoeker | null): BeenSkelet | null {
  if ('hoeken' in h) return beenUitHoeken(heup, h.hoeken)
  return zoek ? beenNaarDoel(heup, zoek(h.doel), h.buig, h.voet, h.bal ?? false) : null
}

interface Deels {
  romp: Romp
  armNabij: ArmSkelet | null
  armVer: ArmSkelet | null
  beenNabij: BeenSkelet | null
  beenVer: BeenSkelet | null
}

function deels(h: ZijHouding, heup: Vec, zoek: DoelZoeker | null): Deels {
  const romp = rompVan(h, heup)
  return {
    romp,
    armNabij: arm(h.armNabij, schouderVan(romp, false, h.schouderblad), zoek),
    armVer: arm(h.armVer, schouderVan(romp, true, h.schouderblad), zoek),
    beenNabij: been(h.beenNabij, heupVan(romp, false), zoek),
    beenVer: been(h.beenVer, heupVan(romp, true), zoek),
  }
}

function vereist<T>(x: T | null, wat: string): T {
  if (x === null) throw new Error(`Anker ${wat} hangt af van een doel; kies een anker dat uit hoeken volgt.`)
  return x
}

/** Waar een lichaamspunt nu zit (alleen voor delen die al bekend zijn). */
export function lichaamspunt(d: Deels | ZijSkelet, p: Lichaamspunt): Vec {
  const r = 'romp' in d ? d.romp : d
  switch (p) {
    case 'heup': return r.bekken.o
    case 'schouder': return schouderVan(r, false)
    case 'enkelNabij': return vereist(d.beenNabij, p).voet.o
    case 'enkelVer': return vereist(d.beenVer, p).voet.o
    case 'balNabij': return voetPunt(vereist(d.beenNabij, p).voet, 'bal')
    case 'balVer': return voetPunt(vereist(d.beenVer, p).voet, 'bal')
    case 'hielNabij': return voetPunt(vereist(d.beenNabij, p).voet, 'hiel')
    case 'hielVer': return voetPunt(vereist(d.beenVer, p).voet, 'hiel')
    case 'knieNabij': return vereist(d.beenNabij, p).onder.o
    case 'knieVer': return vereist(d.beenVer, p).onder.o
    case 'elleboogNabij': return vereist(d.armNabij, p).onder.o
    case 'elleboogVer': return vereist(d.armVer, p).onder.o
    case 'handNabij': return vereist(d.armNabij, p).greep
    case 'handVer': return vereist(d.armVer, p).greep
  }
}

/** Plaats de romp zo dat het anker op zijn plek staat (zonder doelen). */
export function geplaatsteRomp(h: ZijHouding): { romp: Romp; heup: Vec } {
  const proef = deels(h, { x: 0, y: 0 }, null)
  const a = lichaamspunt(proef, h.anker.punt)
  const heup = min(h.anker.op, a)
  return { romp: rompVan(h, heup), heup }
}

/** Het hele skelet. `zoek` geeft de plek van een doel (materiaal is dan al geplaatst). */
export function zijSkelet(h: ZijHouding, zoek: DoelZoeker): ZijSkelet {
  const { heup } = geplaatsteRomp(h)
  const d = deels(h, heup, zoek)
  return {
    ...d.romp,
    armNabij: vereist(d.armNabij, 'armNabij'),
    armVer: vereist(d.armVer, 'armVer'),
    beenNabij: vereist(d.beenNabij, 'beenNabij'),
    beenVer: vereist(d.beenVer, 'beenVer'),
  }
}
