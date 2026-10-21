// ─── Fit Factory Club, 3D-oefenbeelden: kabelkolom achter de sporter ────────
// Voor oefeningen met de rug naar het toestel (triceps extension boven het
// hoofd aan de kabel). Dezelfde opbouw als de kabelkolom in materiaal-kabels
// (slede met katrol op de gekozen hoogte, kolom, stapel en twee wielen
// bovenin), maar gespiegeld: de kolom en de stapel staan achter de katrol
// (-z), de sporter staat ervoor en kijkt van het toestel af. De kabel loopt
// echt over de wielen en de stapel gaat mee omhoog.

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { KabelGreep } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import { blok, cilinder, raakPunt, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { maakGreep } from './materiaal-grepen'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'
import { gewichtsstapel, katrol, kabelStuk, richtKatrol } from './materiaal-stapel'

const R = 0.045

interface Wiel {
  readonly midden: Vector3
  readonly mesh: Group
  /** Draait mee met de kabel (de katrol op de slede). */
  readonly zwenkt: boolean
}

/** Een katrolwiel; de vaste wielen bovenin hebben hun as langs x (wiel in het vlak van de kolom). */
function wiel(bak: GeoBak, m: MateriaalMaterialen, midden: Vector3, zwenkt: boolean): Wiel {
  const mesh = katrol(bak, m, R)
  mesh.position.copy(midden)
  return { midden, mesh, zwenkt }
}

/** De kabel van de greep over alle wielen naar de stapel, per beeld opnieuw gelegd. */
function kabelRoute(bak: GeoBak, m: MateriaalMaterialen, wielen: readonly Wiel[]) {
  const groep = new Group()
  const stukken = wielen.map(() => kabelStuk(bak, m)).concat(kabelStuk(bak, m))
  groep.add(...stukken, ...wielen.map((w) => w.mesh))
  const a = new Vector3()
  const b = new Vector3()
  const van = new Vector3()
  const tot = new Vector3()
  return {
    groep,
    leg(begin: Vector3, eind: Vector3) {
      const punten = [begin, ...wielen.map((w) => w.midden), eind]
      wielen.forEach((w, i) => {
        if (w.zwenkt) richtKatrol(w.mesh, a.copy(punten[i]).sub(w.midden), b.copy(punten[i + 2]).sub(w.midden))
      })
      for (let i = 0; i < stukken.length; i++) {
        const wVan = wielen[i - 1]
        const wTot = wielen[i]
        if (wVan) raakPunt(wVan.midden, R, a.copy(punten[i + 1]).sub(wVan.midden), b.copy(punten[i - 1]).sub(wVan.midden), van)
        else van.copy(begin)
        if (wTot) raakPunt(wTot.midden, R, a.copy(punten[i]).sub(wTot.midden), b.copy(punten[i + 2]).sub(wTot.midden), tot)
        else tot.copy(eind)
        stukken[i].leg(van, tot)
      }
    },
  }
}

/** Kabelkolom met de katrol op `k`; kolom en stapel staan erachter (-z). */
export function kabelAchter(bak: GeoBak, m: MateriaalMaterialen, k: Vector3, greepSoort: KabelGreep, zicht: Zicht): Stuk {
  const vast = new Group()
  const toren = new Group()
  const kolomZ = k.z - 0.11
  const stapelZ = kolomZ - 0.36
  const top = 2.28
  toren.add(blok(bak, m.frame, [0.09, top, 0.09], [0, top / 2, kolomZ], 0.022))
  toren.add(blok(bak, m.frame, [0.5, 0.08, 0.6], [0, top, (kolomZ + stapelZ) / 2 - 0.03], 0.025))
  vast.add(blok(bak, m.frame, [0.46, 0.05, 0.8], [0, 0.025, (kolomZ + stapelZ) / 2], 0.02))
  // Slede rond de kolom met verstelpen en een arm naar de katrol.
  toren.add(blok(bak, m.frame, [0.13, 0.17, 0.13], [0, k.y + 0.07, kolomZ], 0.025))
  const pen = cilinder(bak, m.accent, 0.013, 0.05, 16)
  pen.rotation.z = Math.PI / 2
  pen.position.set(0.085, k.y + 0.07, kolomZ)
  toren.add(pen)
  toren.add(blok(bak, m.frame, [0.05, 0.05, k.z - kolomZ - 0.02], [0, k.y + 0.07, (kolomZ + k.z) / 2 - 0.01], 0.012))
  const stapel = gewichtsstapel(bak, m, new Vector3(0, 0, stapelZ), top - 0.04, 0)
  const wielen = [
    wiel(bak, m, k.clone(), true),
    wiel(bak, m, new Vector3(0, top - 0.09, kolomZ), false),
    wiel(bak, m, new Vector3(0, top - 0.09, stapelZ), false),
  ]
  const greep = maakGreep(bak, m, greepSoort)
  const route = kabelRoute(bak, m, wielen)
  const slag = new Slag()
  const g = new Group()
  const hoog = new Group()
  hoog.add(toren, stapel.groep)
  g.add(vast, hoog, route.groep, greep.groep)
  schaduw(g)
  voegSamen(vast, bak, false)
  voegSamen(toren, bak)
  const afdekker = maakAfdekker(hoog, m.kopie)
  const katrolPunt = wielen[0].midden
  return {
    groep: g,
    meet(f: Figuur) {
      greep.zet(f, katrolPunt)
      slag.meet(greep.haak.distanceTo(katrolPunt))
    },
    zet(f: Figuur) {
      greep.zet(f, katrolPunt)
      const uit = greep.haak.distanceTo(katrolPunt)
      stapel.til(Math.min(0.42, slag.deel(uit) * slag.lengte * 0.5))
      route.leg(greep.haak, stapel.aangrijp)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}
