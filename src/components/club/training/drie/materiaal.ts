// ─── Fit Factory Club, 3D-oefenbeelden: materiaal ────────────────────────────
// Bouwt het materiaal van een oefening uit de lijst in de data en zet het per
// beeld in de juiste stand. De onderdelen zelf staan in materiaal-vrij (stang,
// dumbbells, kettlebell), materiaal-banken (banken, rek, verhoging, mat),
// materiaal-kabels (kabelstations) en materiaal-machines (machines).

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding, Materiaal } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import { voegSamen, type MateriaalMaterialen, type Stuk, type Zetter } from './materiaal-delen'
import { curlStang, halter, kettlebell, stang, zetHalters, zetHalterStaand, zetKettlebell } from './materiaal-vrij'
import { mat, rugBank, schuineBank, verhoging, vlakkeBank } from './materiaal-banken'
import { kabel, kabelstation } from './materiaal-kabels'
import { latstationMetGreep } from './materiaal-latstation'
import { reverseFly } from './materiaal-reversefly'
import { beenMachine, chestPress, kuitMachine, legPress } from './materiaal-machines'
import { zetDoorzicht, type Zicht } from './materiaal-zicht'

export type { MateriaalMaterialen } from './materiaal-delen'
export type { Zicht } from './materiaal-zicht'

export interface MateriaalMeshes {
  readonly groep: Group
  zet(f: Figuur, h: Houding): void
  /** Meet vooraf de hele beweging (slag van kabels en hefbomen); aanroepen voor een reeks standen. */
  meet(f: Figuur, h: Houding): void
}

function aanLast(g: Group): Zetter {
  return (f) => {
    g.position.copy(f.last.pos)
    g.quaternion.copy(f.last.rot)
  }
}

function vast(g: Group, bak: GeoBak): Stuk {
  return { groep: voegSamen(g, bak), zet: () => undefined }
}

function olympischeStang(bak: GeoBak, m: MateriaalMaterialen, schijven: number, zicht: Zicht): Stuk {
  const s = stang(bak, m, schijven)
  const plaats = aanLast(s.groep)
  return {
    groep: s.groep,
    zet(f, h) {
      plaats(f, h)
      zetDoorzicht(s.groep, s.kanten, f, zicht)
    },
  }
}

function stuk(bak: GeoBak, m: MateriaalMaterialen, item: Materiaal, zicht: Zicht): Stuk {
  const plek = new Vector3(item.plek?.x ?? 0, item.plek?.y ?? 0, item.plek?.z ?? 0)
  switch (item.soort) {
    case 'stang':
      return olympischeStang(bak, m, item.schijven ?? 2, zicht)
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
      return vast(vlakkeBank(bak, m, plek, true, item.draai), bak)
    case 'bankKaal':
      return vast(vlakkeBank(bak, m, plek, false, item.draai), bak)
    case 'bankSchuin':
      return vast(schuineBank(bak, m, plek, item.hoek ?? 30), bak)
    case 'bankRug':
      return vast(rugBank(bak, m, plek), bak)
    case 'verhoging':
      return vast(verhoging(bak, m, plek), bak)
    case 'mat':
      return vast(mat(bak, m, plek), bak)
    case 'kabelstation':
      return item.greep ? latstationMetGreep(bak, m, plek, item.greep, zicht) : kabelstation(bak, m, plek, zicht)
    case 'kabel':
      return kabel(bak, m, plek, item.greep ?? 'handvat', zicht)
    case 'legPress':
      return legPress(bak, m, item.hoek ?? 45)
    case 'beenMachine':
      return beenMachine(bak, m, item.variant ?? 'extension', zicht)
    case 'chestPress':
      return chestPress(bak, m, zicht)
    case 'reverseFly':
      return reverseFly(bak, m, plek, zicht)
    case 'kuitMachine':
      return kuitMachine(bak, m, plek, zicht)
  }
}

export function bouwMateriaal(bak: GeoBak, m: MateriaalMaterialen, lijst: readonly Materiaal[], zicht: Zicht): MateriaalMeshes {
  const groep = new Group()
  const stukken = lijst.map((item) => stuk(bak, m, item, zicht))
  for (const s of stukken) groep.add(s.groep)
  return {
    groep,
    zet(f, h) {
      for (const s of stukken) s.zet(f, h)
    },
    meet(f, h) {
      for (const s of stukken) s.meet?.(f, h)
    },
  }
}
