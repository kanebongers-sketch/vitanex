// ─── Fit Factory Club, 3D-oefenbeelden: materiaal ────────────────────────────
// Bouwt het materiaal van een oefening uit de lijst in de data en zet het per
// beeld in de juiste stand. De onderdelen zelf staan in materiaal-vrij (stang,
// dumbbells, kettlebell), materiaal-banken (banken, verhoging, mat) en
// materiaal-machines (kabels en machines).

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding, Materiaal } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import type { MateriaalMaterialen, Zetter } from './materiaal-delen'
import { curlStang, halter, kettlebell, stang, zetHalters, zetHalterStaand, zetKettlebell } from './materiaal-vrij'
import { mat, rugBank, schuineBank, verhoging, vlakkeBank } from './materiaal-banken'
import { beenMachine, chestPress, kabel, kabelstation, kuitMachine, legPress, type Stuk } from './materiaal-machines'

export type { MateriaalMaterialen } from './materiaal-delen'

export interface MateriaalMeshes {
  readonly groep: Group
  zet(f: Figuur, h: Houding): void
}

function aanLast(g: Group): Zetter {
  return (f) => {
    g.position.copy(f.last.pos)
    g.quaternion.copy(f.last.rot)
  }
}

function vast(g: Group): Stuk {
  return { groep: g, zet: () => undefined }
}

function stuk(bak: GeoBak, m: MateriaalMaterialen, item: Materiaal): Stuk {
  const plek = new Vector3(item.plek?.x ?? 0, item.plek?.y ?? 0, item.plek?.z ?? 0)
  switch (item.soort) {
    case 'stang': {
      const s = stang(bak, m, item.schijven ?? 2)
      return { groep: s, zet: aanLast(s) }
    }
    case 'curlStang': {
      const s = curlStang(bak, m)
      return { groep: s, zet: aanLast(s) }
    }
    case 'halters': {
      const paar = [halter(bak, m), halter(bak, m)]
      const g = new Group()
      g.add(...paar)
      return { groep: g, zet: zetHalters(paar) }
    }
    case 'halterStaand': {
      const d = halter(bak, m, 1.25)
      return { groep: d, zet: zetHalterStaand(d) }
    }
    case 'kettlebell': {
      const k = kettlebell(bak, m)
      return { groep: k, zet: zetKettlebell(k) }
    }
    case 'bank':
      return vast(vlakkeBank(bak, m, plek, true, item.draai))
    case 'bankKaal':
      return vast(vlakkeBank(bak, m, plek, false, item.draai))
    case 'bankSchuin':
      return vast(schuineBank(bak, m, plek, item.hoek ?? 30))
    case 'bankRug':
      return vast(rugBank(bak, m, plek))
    case 'verhoging':
      return vast(verhoging(bak, m, plek))
    case 'mat':
      return vast(mat(bak, m, plek))
    case 'kabelstation':
      return kabelstation(bak, m, plek)
    case 'kabel':
      return kabel(bak, m, plek, item.greep ?? 'handvat')
    case 'legPress':
      return legPress(bak, m, item.hoek ?? 45)
    case 'beenMachine':
      return beenMachine(bak, m, item.variant ?? 'extension')
    case 'chestPress':
      return chestPress(bak, m)
    case 'kuitMachine':
      return kuitMachine(bak, m, plek)
  }
}

export function bouwMateriaal(bak: GeoBak, m: MateriaalMaterialen, lijst: readonly Materiaal[]): MateriaalMeshes {
  const groep = new Group()
  const zetters: Zetter[] = []
  for (const item of lijst) {
    const s = stuk(bak, m, item)
    groep.add(s.groep)
    zetters.push(s.zet)
  }
  return {
    groep,
    zet(f, h) {
      for (const z of zetters) z(f, h)
    },
  }
}
