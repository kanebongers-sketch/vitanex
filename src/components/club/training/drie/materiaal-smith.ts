// ─── Fit Factory Club, 3D-oefenbeelden: smith machine ───────────────────────
// Twee verchroomde geleiders naast het figuur waarlangs de stang verticaal
// loopt, een frame van gepoedercoate buis met staanders achter het figuur en
// een vloerframe. Op elke geleider een slede met haak (beweegt mee met de
// stang) en een veiligheidsstop net onder het diepste punt van de beweging.
// `plek.z` is de baan van de stang; de stang zelf (olympische stang met
// schijven) komt uit materiaal-vrij en hangt aan de last.

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, schaduw, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'

/** Halve afstand tussen de geleiders: tussen de handen en de kragen van de stang. */
const GELEIDER_X = 0.6
/** Zijframe en staanders: buiten de schijven. */
const FRAME_X = 0.78
/** Staanders achter de baan van de stang (m). */
const ACHTER = 0.42
const HOOGTE = 2.2
/** Onderkant en bovenkant van de geleiders. */
const ONDER = 0.1
const BOVEN = 2.12
/** Stang tot bovenkant van de veiligheidsstop onderin (straal stang plus wat lucht). */
const STOP_ONDER = 0.05

/** Vast deel: geleiders, frame en vloerframe. */
function frame(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.position.copy(plek)
  const zAchter = -ACHTER
  for (const z of [1, -1]) {
    const x = GELEIDER_X * z
    const fx = FRAME_X * z
    // Geleider met bevestiging boven en onder.
    const stang = cilinder(bak, m.staal, 0.016, BOVEN - ONDER, 20)
    stang.position.set(x, (ONDER + BOVEN) / 2, 0)
    g.add(stang)
    for (const y of [ONDER - 0.02, BOVEN + 0.03]) {
      g.add(blok(bak, m.frame, [FRAME_X - GELEIDER_X + 0.06, 0.06, 0.07], [(x + fx) / 2, y, 0], 0.012))
    }
    // Staander achter, zijbalk boven en vloerbalk langs de zijkant.
    g.add(blok(bak, m.frame, [0.08, HOOGTE, 0.08], [fx, HOOGTE / 2, zAchter], 0.016))
    g.add(blok(bak, m.frame, [0.07, 0.07, ACHTER + 0.12], [fx, HOOGTE - 0.035, (zAchter + 0.12) / 2], 0.016))
    g.add(blok(bak, m.frame, [0.07, 0.07, ACHTER + 0.12], [fx, BOVEN + 0.03, (zAchter + 0.12) / 2], 0.016))
    g.add(blok(bak, m.frame, [0.1, 0.05, ACHTER + 0.5], [fx, 0.025, (zAchter + 0.5) / 2], 0.016))
    // Staander tussen vloerbalk en onderste bevestiging van de geleider.
    g.add(blok(bak, m.frame, [0.07, ONDER - 0.02, 0.07], [fx, (ONDER - 0.02) / 2, 0], 0.012))
    for (const zv of [zAchter - 0.02, 0.24]) g.add(blok(bak, m.greep, [0.12, 0.014, 0.08], [fx, 0.007, zv], 0.004))
  }
  // Dwarsbalken achter, boven en op de vloer, met een accentstrip bovenin.
  g.add(blok(bak, m.frame, [FRAME_X * 2 + 0.08, 0.08, 0.08], [0, HOOGTE - 0.04, zAchter], 0.016))
  g.add(blok(bak, m.accent, [FRAME_X * 2 - 0.2, 0.012, 0.05], [0, HOOGTE + 0.006, zAchter], 0.004))
  g.add(blok(bak, m.frame, [FRAME_X * 2 + 0.1, 0.05, 0.08], [0, 0.025, zAchter], 0.016))
  return schaduw(g)
}

/** Slede om de geleider met een haak naar voren, de stang loopt er dwars doorheen. */
function slede(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(blok(bak, m.frame, [0.075, 0.13, 0.075], [0, 0, 0], 0.014))
  g.add(blok(bak, m.accent, [0.078, 0.02, 0.078], [0, 0.07, 0], 0.006))
  // Haak: korte arm naar voren met een opstaande lip (inhaken door de pols te draaien).
  g.add(blok(bak, m.frame, [0.03, 0.025, 0.09], [0, -0.035, 0.07], 0.008))
  g.add(blok(bak, m.frame, [0.03, 0.05, 0.02], [0, -0.015, 0.11], 0.006))
  return schaduw(g)
}

/** Veiligheidsstop: klem om de geleider met een arm naar voren en een rubberen dop. */
function stop(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  const klem = cilinder(bak, m.accent, 0.034, 0.05, 20)
  g.add(klem)
  g.add(blok(bak, m.frame, [0.04, 0.03, 0.16], [0, 0, 0.09], 0.01))
  g.add(blok(bak, m.greep, [0.05, 0.02, 0.05], [0, 0.022, 0.15], 0.006))
  return schaduw(g)
}

export function smithMachine(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Stuk {
  const g = new Group()
  g.add(voegSamen(frame(bak, m, plek), bak))
  const sleden = [1, -1].map((z) => {
    const s = slede(bak, m)
    s.position.set(plek.x + GELEIDER_X * z, 1.2, plek.z)
    return s
  })
  const stops = [1, -1].map((z) => {
    const s = stop(bak, m)
    s.position.set(plek.x + GELEIDER_X * z, 0.6, plek.z)
    return s
  })
  g.add(...sleden, ...stops)
  let laagste = Infinity
  return {
    groep: g,
    zet(f: Figuur) {
      for (const s of sleden) s.position.y = f.last.pos.y
      // Zonder meting: de stop staat net onder de stang van dit beeld.
      const y = (Number.isFinite(laagste) ? laagste : f.last.pos.y) - STOP_ONDER - 0.02
      for (const s of stops) s.position.y = y
    },
    meet(f: Figuur) {
      laagste = Math.min(laagste, f.last.pos.y)
    },
  }
}
