// ─── Fit Factory Club, 3D-oefenbeelden: het figuur ───────────────────────────
// Een atletisch figuur met gevormde spieren, sportkleding en sneakers. Alles
// wordt een keer gebouwd en per materiaal samengevoegd tot een SkinnedMesh
// (huid, stof, schoenen, haar). Per beeld zet het skelet alleen de botten.

import { Group, Matrix4, SkinnedMesh, type BufferGeometry, type Material } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Oefening3d } from '@/lib/club/training/3d/typen'
import { Bouwer } from './bouwer'
import { bouwHaar, bouwHoofd } from './hoofd'
import { bouwHanden, bouwSchoenen } from './handvoet'
import { bouwArmen, bouwBenen } from './ledematen'
import type { Palet } from './palet'
import { bouwKleding, bouwRomp } from './romp'
import { maakSkelet } from './skelet'
import type { FiguurMaterialen } from './stoffen'
import type { GeoBak } from './vormen'

export interface FiguurMeshes {
  readonly groep: Group
  /** Aantal driehoeken van het figuur. */
  readonly driehoeken: number
  zet(f: Figuur): void
}

/** Straal van wat de hand vasthoudt (stang, halter of greep van de kabel). */
function greepStraal(o: Oefening3d): number {
  if (o.materiaal.some((m) => m.soort === 'halters')) return 0.016
  if (o.materiaal.some((m) => m.soort === 'kabelstation')) return 0.018
  return 0.0135
}

export function bouwFiguur(bak: GeoBak, m: FiguurMaterialen, o: Oefening3d, p: Palet): FiguurMeshes {
  const huid = new Bouwer()
  const stof = new Bouwer()
  const schoen = new Bouwer()
  const haar = new Bouwer()
  bouwRomp(huid, p)
  bouwHoofd(huid, p)
  bouwBenen(huid, stof, p)
  bouwArmen(huid, stof, p)
  bouwHanden(huid, p, o.handen, greepStraal(o))
  bouwKleding(stof, p)
  bouwSchoenen(schoen, p)
  bouwHaar(haar, p)

  const skelet = maakSkelet(o)
  const groep = new Group()
  groep.add(...skelet.botten)
  const eenheid = new Matrix4()
  const mesh = (g: BufferGeometry, mat: Material) => {
    const s = new SkinnedMesh(bak.houd(g), mat)
    s.bind(skelet.skelet, eenheid)
    s.castShadow = true
    s.receiveShadow = true
    s.frustumCulled = false
    groep.add(s)
  }
  const delen: [Bouwer, Material][] = [[huid, m.huid], [stof, m.stof], [schoen, m.schoen], [haar, m.haar]]
  for (const [b, mat] of delen) mesh(b.geometrie(), mat)

  return {
    groep,
    driehoeken: delen.reduce((som, [b]) => som + b.driehoeken, 0),
    zet(f: Figuur) {
      skelet.zet(f)
    },
  }
}
