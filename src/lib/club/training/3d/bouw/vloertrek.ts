// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen trekken van de vloer (PUUR) ─
// Deadlift-varianten waarbij de last op de vloer begint (trap bar, sumo,
// kettlebell): de greep hangt aan gestrekte armen en volgt een vaste baan boven
// de voet. Elke stand ligt vast met drie dingen: de hoogte van de greep, de plek
// van de schouders ten opzichte van de greep en de kniebuiging. Daaruit volgen
// de romphoek en de plek van het bekken.
//
// Onderin kiezen we de romphoek (en dus de kniebuiging), bovenin staat het
// figuur rechtop met het zwaartepunt boven het midden van de voet. Omhoog volgt
// de knie het patroon: 'benen' (trap bar, sumo) strekt de knie gelijk op met de
// greep, zodat de rughoek eerst gelijk blijft en heupen en schouders samen
// omhoog komen; 'heup' (kettlebell) houdt de knieen langer gebogen en laat de
// heupen het werk doen. Omlaag gaan altijd eerst de heupen naar achteren en
// buigen de knieen pas als de last voorbij de knie is, zoals de coaching zegt.

import { figuurIn, schouderIn } from '../kinematica'
import type { Blik, Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Sleutel, Vec3 } from '../typen'
import { bereikbaar, BLIK, HEUP_STAAND, houding, metMoment, zwaartepuntZ } from './basis'

export type Opbouw = 'benen' | 'heup'

export interface VloertrekOpties {
  readonly naam: string
  readonly materiaal: readonly Materiaal[]
  /** Halve afstand tussen de handen (m). */
  readonly greep: number
  /** Richting van het handvat (neutrale greep); zonder: dwars, langs de last. */
  readonly greepRichting?: Vec3
  readonly enkel: Vec3
  /** Tenen naar buiten (graden). */
  readonly uitdraai: number
  readonly knieRichting: Vec3
  readonly elleboogRichting: Vec3
  /** Z van de greep onderin (boven de voet). */
  readonly lastZ: number
  /** Z van de greep bovenin; zonder: dezelfde rechte baan als onderin. */
  readonly lastZBoven?: number
  /** Hoogte van de greep als de last op de vloer staat (m). */
  readonly vloer: number
  /** Gewicht van de last voor de balans bovenin (stang 0,5, kettlebell 0,2). */
  readonly gewicht: number
  /** Romphoek onderin: bekken plus rug, graden voorover. */
  readonly romp: number
  /** Schouders voor (+) of achter de greep onderin (m). */
  readonly schouderVoor: number
  readonly opbouw: Opbouw
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly blik?: Blik
}

/** Onderrug neutraal, bovenrug licht gestrekt (borst trots). */
const RUG = { lende: 0, borst: -3 } as const
/** Bovenin: billen aan, rechtop zonder achterover te leunen. */
const RUG_BOVEN = { lende: -2, borst: -1, romp: 1 } as const
/** Reik van het been bovenin: knie gestrekt maar niet op slot. */
const REIK_BOVEN = 0.995
/** Zwaartepunt van figuur en last boven het midden van de voet. */
const MIDDEN_VOET = 0.04

function glad(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

function meng(a: number, b: number, f: number): number {
  return a + (b - a) * f
}

/**
 * Hoe ver de knie al gestrekt is (0 = zoals onderin, 1 = bovenin) bij hoogte s
 * van de greep (0 = vloer, 1 = bovenin). Omhoog met de benen (trap bar, sumo)
 * strekt de knie gelijk op met de greep: de rughoek blijft eerst gelijk, heupen
 * en schouders komen samen omhoog. Bij een heupscharnier blijven de knieen
 * langer gebogen en doen de heupen het werk. Omlaag (alle patronen) blijven de
 * knieen langer gestrekt: de heupen gaan eerst naar achteren.
 */
function knieGestrekt(opbouw: Opbouw, s: number, omhoog: boolean): number {
  if (!omhoog) return s ** 0.55
  return opbouw === 'heup' ? s ** 1.3 : s
}

export function vloertrek(op: VloertrekOpties): Oefening3d {
  const zBoven = op.lastZBoven ?? op.lastZ
  const basis: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'hangend',
    handen: 'greep',
    enkel: op.enkel,
    voet: { kanteling: 0, uitdraai: op.uitdraai },
    knieRichting: op.knieRichting,
    elleboogRichting: op.elleboogRichting,
    ...(op.greepRichting ? { greepRichting: op.greepRichting } : {}),
    materiaal: op.materiaal,
    spieren: op.spieren,
    ...(op.spierenSecundair ? { spierenSecundair: op.spierenSecundair } : {}),
    camera: op.camera,
    blik: op.blik ?? BLIK.scharnier,
  }
  const knie = (h: Houding) => figuurIn(basis, h).benen[0].buiging

  /** Romp en schouders bij een romphoek: hoe rechter, hoe meer billen aan. */
  const rompBij = (romp: number): Houding => {
    const f = glad((op.romp - romp) / (op.romp - RUG_BOVEN.romp))
    const lende = meng(RUG.lende, RUG_BOVEN.lende, f)
    const borst = meng(RUG.borst, RUG_BOVEN.borst, f)
    return houding({ kantel: romp - lende - borst, lende, borst, schouders: meng(-0.02, -0.025, f), greep: op.greep })
  }

  // Bovenin: rechtop met de knieen net niet op slot, zwaartepunt boven de voet.
  let boven: Houding = { ...rompBij(RUG_BOVEN.romp), bekkenY: HEUP_STAAND, lastZ: zBoven }
  for (let i = 0; i < 10; i++) {
    const fout = zwaartepuntZ(basis, boven, op.gewicht) - MIDDEN_VOET
    boven = bereikbaar(basis, { ...boven, bekkenZ: boven.bekkenZ - fout * 1.2 }, REIK_BOVEN)
  }
  const hoogteBoven = figuurIn(basis, boven).last.pos.y
  const voorBoven = schouderIn(boven).z - zBoven
  const knieBoven = knie(boven)

  /** Greep op hoogte s, schouders op hun plek, met deze romphoek. */
  const metRomp = (s: number, romp: number): Houding => {
    const lastZ = meng(op.lastZ, zBoven, glad(s))
    const voor = meng(op.schouderVoor, voorBoven, s)
    const doelY = meng(op.vloer, hoogteBoven, s)
    let h: Houding = { ...rompBij(romp), bekkenY: 0.7, bekkenZ: -0.2, lastZ }
    for (let i = 0; i < 30; i++) {
      const greepY = figuurIn(basis, h).last.pos.y
      h = { ...h, bekkenY: h.bekkenY + doelY - greepY, bekkenZ: h.bekkenZ + lastZ + voor - schouderIn(h).z }
    }
    return h
  }

  const onder = metRomp(0, op.romp)
  const knieOnder = knie(onder)

  /** Greep op hoogte s met deze kniebuiging: zoek de romphoek die erbij past. */
  const metKnieBij = (s: number, doel: number): Houding => {
    // Meer voorover (bij gelijke greephoogte) geeft hogere heupen en een strakkere knie.
    let laag: number = RUG_BOVEN.romp
    let hoog = 92
    for (let i = 0; i < 26; i++) {
      const midden = (laag + hoog) / 2
      if (knie(metRomp(s, midden)) > doel) laag = midden
      else hoog = midden
    }
    return metRomp(s, (laag + hoog) / 2)
  }

  const stand = (s: number, omhoog: boolean): Houding =>
    metKnieBij(s, meng(knieOnder, knieBoven, knieGestrekt(op.opbouw, s, omhoog)))

  // Tempo volgens de coaching: kort spanning opbouwen, 1 tel omhoog, kort stil
  // bovenin, 2 tellen terug naar de vloer.
  const sleutels: Sleutel[] = [
    { houding: onder, vast: 0.5, naarVolgende: 0.3 },
    { houding: stand(0.3, true), vast: 0, naarVolgende: 0.27 },
    { houding: stand(0.6, true), vast: 0, naarVolgende: 0.26 },
    { houding: stand(0.85, true), vast: 0, naarVolgende: 0.34 },
    { houding: boven, vast: 0.5, naarVolgende: 0.52 },
    { houding: stand(0.75, false), vast: 0, naarVolgende: 0.5 },
    { houding: stand(0.45, false), vast: 0, naarVolgende: 0.5 },
    { houding: stand(0.18, false), vast: 0, naarVolgende: 0.5 },
  ]
  return metMoment({ ...basis, sleutels })
}
