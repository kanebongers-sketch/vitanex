// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen schouders ophalen (PUUR) ──
// Shrug: rechtop staan met de last aan gestrekte armen; alleen de
// schouderbladen gaan recht omhoog naar de oren en weer helemaal omlaag. De
// last hangt (`hangend`), zodat de armen in elke stand gestrekt blijven en de
// last precies zo ver meegaat als de schouders. Een tel omhoog, een tel vast,
// twee tellen omlaag (volgens de coaching).

import type { Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import { balanceer, BLIK, HEUP_STAAND, houding, langsBeen, lus, metMoment, STAAND } from './basis'
import { schouderIn } from '../kinematica'

/** Schouders helemaal laag (armen hangen) en helemaal hoog (naar de oren). */
const SCHOUDERS = { laag: -0.022, hoog: 0.048 } as const

/** Zwaartepunt boven het midden van de voet. */
const MIDDEN_VOET = 0.04

export interface OphaalOpties {
  readonly naam: string
  readonly materiaal: readonly Materiaal[]
  /** Halve afstand tussen de handen (m). */
  readonly greep: number
  /** Waar de last hangt: naast de benen (onder de schouders) of voor de dijen. */
  readonly plek: { readonly soort: 'naast'; readonly terug: number } | { readonly soort: 'voor'; readonly afstand: number }
  readonly greepRichting?: Vec3
  readonly elleboogRichting: Vec3
  /** Gewicht van de last voor het zwaartepunt (fractie van het lichaam). */
  readonly gewicht: number
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
}

/** Schouders ophalen met een hangende last: dumbbells naast de benen of een stang voor de dijen. */
export function schoudersOphalen(op: OphaalOpties): Oefening3d {
  const o: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'hangend',
    handen: 'greep',
    enkel: { x: 0.12, y: 0.08, z: 0 },
    voet: { kanteling: 0, uitdraai: 8 },
    knieRichting: STAAND.knieRichting,
    elleboogRichting: op.elleboogRichting,
    ...(op.greepRichting ? { greepRichting: op.greepRichting } : {}),
    materiaal: op.materiaal,
    spieren: op.spieren,
    ...(op.spierenSecundair ? { spierenSecundair: op.spierenSecundair } : {}),
    camera: op.camera,
    // Kin licht in, recht vooruit kijken: het hoofd steekt niet naar voren.
    blik: { hoek: BLIK.vooruit.hoek - 2 },
  }
  const plek = op.plek
  const zetLast = (h: Houding): Houding =>
    plek.soort === 'naast' ? { ...h, greep: op.greep, lastZ: schouderIn(h).z - plek.terug } : langsBeen(o, { ...h, greep: op.greep }, plek.afstand)
  const maak = (p: { f: number }): Houding => {
    let h = zetLast(houding({ bekkenY: HEUP_STAAND, kantel: 2, lende: -1, schouders: SCHOUDERS.laag + (SCHOUDERS.hoog - SCHOUDERS.laag) * p.f }))
    for (let i = 0; i < 3; i++) h = zetLast(balanceer(o, h, MIDDEN_VOET, op.gewicht))
    return h
  }
  return metMoment({ ...o, sleutels: lus({ f: 0 }, { f: 1 }, maak, { begin: 0.5, heen: 1.0, eind: 1.0, terug: 2.0 }) })
}
