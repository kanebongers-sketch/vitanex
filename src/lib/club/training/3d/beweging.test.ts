import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { houdingVan, metKnie, reikBijKnie, standTijdVan } from './beweging'
import { houdingOp, lusDuur, sleutelTijd, standTijd, startVoorSleutel } from './interpolatie'
import { figuurIn, nekMetBlik, rompHoek, type Figuur } from './kinematica'
import { GRENZEN } from './maten'
import { getekendeSpieren, SPIER_STERKTE, spierSterkte, spierSterktes } from './spieren'
import { BLIK, CAMERA_PATROON, houding, TEMPO } from './bouw/basis'
import { hinge, lunge, squat, swing, calfRaise, heupstrek, beenMachine, legPress } from './bouw/benen'
import { armOefening, CAMERA, LICHAAM } from './bouw/boven'
import { KANALEN, type Oefening3d } from './typen'

const STAPPEN = 120

function monsters(o: Oefening3d): { d: number; f: Figuur }[] {
  const duur = lusDuur(o.sleutels)
  return Array.from({ length: STAPPEN }, (_, i) => ({ d: i / STAPPEN, f: figuurIn(o, houdingVan(o, (i / STAPPEN) * duur)) }))
}

/** Wereldhoek van het hoofd (graden voorover) uit het frame van het hoofd. */
function hoofdHoek(f: Figuur): number {
  const q = new Quaternion().copy(f.hoofd.rot)
  return (2 * Math.atan2(q.x, q.w) * 180) / Math.PI
}

const BOUWSTENEN: readonly Oefening3d[] = [
  squat({ naam: 'Test squat halters', last: 'halters' }),
  squat({ naam: 'Test squat stang', last: 'stang', diepte: 0.46, kantel: 40 }),
  squat({ naam: 'Test goblet', last: 'goblet', diepte: 0.42, kantel: 28 }),
  hinge({ naam: 'Test RDL stang', last: 'stang' }),
  hinge({ naam: 'Test RDL halters', last: 'halters', knie: 12 }),
  hinge({ naam: 'Test stiff leg', last: 'stang', knie: 6, kantel: 72 }),
  swing('Test swing'),
  lunge({ naam: 'Test lunge achter', richting: 'achter', last: 'halters' }),
  lunge({ naam: 'Test lunge voor', richting: 'voor', last: 'geen' }),
  lunge({ naam: 'Test split squat', richting: 'plek', last: 'halters' }),
  heupstrek({ naam: 'Test hip thrust', steun: 'bank', last: 'stang' }),
  heupstrek({ naam: 'Test bridge', steun: 'vloer', last: 'geen' }),
  legPress({ naam: 'Test leg press', hoek: 45 }),
  beenMachine({ naam: 'Test leg curl', variant: 'curl' }),
  calfRaise('Test calf raise'),
  armOefening({
    naam: 'Test row',
    lichaam: LICHAAM.voorover,
    van: { dx: 0.02, dy: -0.6, dz: 0.03 },
    naar: { dx: 0.04, dy: -0.29, dz: -0.17 },
    balans: 0.04,
    elleboogRichting: { x: 0.25, y: 0.6, z: -0.8 },
    materiaal: [{ soort: 'halters' }],
    spieren: ['rug', 'bovenarm'],
    spierenSecundair: ['onderrug'],
    camera: CAMERA.opzij,
  }),
]

describe('3D-beweging: bouwstenen blijven binnen de grenzen', () => {
  it.each(BOUWSTENEN.map((o) => [o.naam, o] as const))('%s: gewrichten, voeten, vloer en nek', (_, o) => {
    for (const { f } of monsters(o)) {
      for (const b of f.benen) {
        expect(b.buiging).toBeGreaterThanOrEqual(GRENZEN.kniebuiging.min)
        expect(b.buiging).toBeLessThanOrEqual(GRENZEN.kniebuiging.max)
        expect(b.reik).toBeLessThanOrEqual(1.0015)
      }
      for (const a of f.armen) {
        expect(a.buiging).toBeLessThanOrEqual(GRENZEN.elleboogbuiging.max)
        expect(a.reik).toBeLessThanOrEqual(1.0015)
      }
      for (const h of f.heupbuiging) expect(h).toBeLessThanOrEqual(GRENZEN.heupbuiging.max)
      for (const p of [f.bekken.pos, f.hoofd.pos, ...f.benen.map((b) => b.midden), ...f.armen.map((a) => a.eind)]) expect(p.y).toBeGreaterThan(0.02)
      const nek = new Quaternion().copy(f.borst.rot).invert().multiply(f.hoofd.rot)
      const graden = (2 * Math.atan2(nek.x, nek.w) * 180) / Math.PI
      expect(graden).toBeGreaterThanOrEqual(GRENZEN.nek.min - 0.01)
      expect(graden).toBeLessThanOrEqual(GRENZEN.nek.max + 0.01)
    }
  })

  it.each(BOUWSTENEN.map((o) => [o.naam, o] as const))('%s: vloeiend, sluit aan en tempo tussen 1,6 en 6 seconden', (_, o) => {
    const duur = lusDuur(o.sleutels)
    expect(duur).toBeGreaterThanOrEqual(1.6)
    expect(duur).toBeLessThanOrEqual(6)
    for (let t = 0; t < duur; t += 1 / 60) {
      const a = houdingVan(o, t)
      const b = houdingVan(o, t + 1 / 60)
      expect(Math.abs(a.bekkenY - b.bekkenY)).toBeLessThan(0.02)
      expect(Math.abs(a.kantel - b.kantel)).toBeLessThan(3.5)
    }
    const begin = houdingVan(o, 0)
    const eind = houdingVan(o, duur)
    for (const k of KANALEN) expect(eind[k]).toBeCloseTo(begin[k], 6)
  })
})

describe('3D-beweging: blik', () => {
  it('zonder blik volgt het hoofd de romp plus het kanaal nek', () => {
    const h = houding({ kantel: 30, nek: -5 })
    expect(nekMetBlik(h)).toBe(-5)
  })

  it('met blik vangt de nek de rompkanteling op, binnen de grenzen', () => {
    const h = houding({ kantel: 30, lende: 2, borst: -4, nek: 0 })
    expect(rompHoek(h)).toBe(28)
    expect(nekMetBlik(h, { hoek: 6 })).toBeCloseTo(-22, 6)
    // Half: midden tussen het kanaal (0) en de wereldhoek (-22).
    expect(nekMetBlik(h, { hoek: 6, sterkte: 0.5 })).toBeCloseTo(-11, 6)
    // Ver voorover: de nek strekt niet verder dan de grens.
    expect(nekMetBlik(houding({ kantel: 80 }), { hoek: 0 })).toBe(GRENZEN.nek.min)
  })

  it('squat met blik vooruit: het hoofd houdt de wereldhoek terwijl de romp kantelt', () => {
    const o = squat({ naam: 'Test squat', last: 'goblet', kantel: 30 })
    expect(o.blik).toEqual(BLIK.vooruit)
    for (const { f } of monsters(o)) expect(hoofdHoek(f)).toBeCloseTo(BLIK.vooruit.hoek, 3)
  })

  it('heupscharnier: de nek blijft half in lijn, het hoofd kantelt minder dan de romp', () => {
    const o = hinge({ naam: 'Test RDL', last: 'stang' })
    const onder = figuurIn(o, houdingVan(o, standTijdVan(o, 'eind')))
    const romp = (2 * Math.atan2(onder.borst.rot.x, onder.borst.rot.w) * 180) / Math.PI
    expect(hoofdHoek(onder)).toBeLessThan(romp - 10)
    expect(hoofdHoek(onder)).toBeGreaterThan(BLIK.scharnier.hoek - 5)
  })

  it('armOefening staand krijgt standaard een blik; voorover naar de vloer; liggend geen', () => {
    const basis = {
      van: { heffen: 4, opzij: 7, elleboog: 12 },
      naar: { heffen: 12, opzij: 7, elleboog: 138 },
      elleboogRichting: { x: 0.15, y: -0.3, z: -1 },
      materiaal: [{ soort: 'halters' as const }],
      spieren: ['bovenarm' as const],
      camera: CAMERA.schuin,
    }
    expect(armOefening({ ...basis, naam: 'a', lichaam: LICHAAM.staand, balans: 0.03 }).blik).toEqual(BLIK.vooruit)
    expect(armOefening({ ...basis, naam: 'b', lichaam: LICHAAM.voorover, balans: 0.03 }).blik).toEqual(BLIK.vloer)
    expect(armOefening({ ...basis, naam: 'c', lichaam: LICHAAM.bankLig }).blik).toBeUndefined()
    expect(armOefening({ ...basis, naam: 'd', lichaam: LICHAAM.staand, balans: 0.03, blik: null }).blik).toBeUndefined()
  })
})

describe('3D-beweging: timing', () => {
  it('startVoorSleutel legt het midden van de pauze op de gevraagde fractie', () => {
    const o = squat({ naam: 'Test', last: 'geen' })
    const i = o.sleutels.length / 2
    const duur = lusDuur(o.sleutels)
    const start = startVoorSleutel(o.sleutels, i, 0.5)
    const midden = sleutelTijd(o.sleutels, i) + o.sleutels[i].vast / 2
    expect((start * duur + 0.5 * duur) % duur).toBeCloseTo(midden, 6)
    expect(startVoorSleutel(o.sleutels, 99)).toBe(0)
  })

  it('bouwstenen leggen het zwaarste moment op de helft van de lus', () => {
    for (const o of [squat({ naam: 'a', last: 'goblet' }), hinge({ naam: 'b', last: 'stang' }), lunge({ naam: 'c', richting: 'plek', last: 'geen' })]) {
      const duur = lusDuur(o.sleutels)
      const eind = o.sleutels[o.sleutels.length / 2].houding
      const opDeHelft = houdingVan(o, duur / 2)
      expect(opDeHelft.kantel).toBeCloseTo(eind.kantel, 3)
    }
  })

  it('standTijdVan wijst naar de begin- en eindhouding, ook met startfractie', () => {
    const o = squat({ naam: 'Test', last: 'goblet' })
    expect(o.start).toBeGreaterThan(0)
    const eind = houdingVan(o, standTijdVan(o, 'eind'))
    const verwacht = houdingOp(o.sleutels, standTijd(o.sleutels, 'eind'))
    expect(eind.kantel).toBeCloseTo(verwacht.kantel, 6)
    const begin = houdingVan(o, standTijdVan(o, 'begin'))
    expect(begin.kantel).toBeCloseTo(o.sleutels[0].houding.kantel, 6)
  })

  it('squat: heup en knie buigen samen (geen knie-eerst)', () => {
    const o = squat({ naam: 'Test squat', last: 'goblet' })
    const duur = lusDuur(o.sleutels)
    const t0 = standTijd(o.sleutels, 'begin') + o.sleutels[0].vast
    const t1 = standTijd(o.sleutels, 'eind')
    const knie = (t: number) => figuurIn(o, houdingOp(o.sleutels, t)).benen[0].buiging
    const kantel = (t: number) => houdingOp(o.sleutels, t).kantel
    const k0 = knie(t0)
    const k1 = knie(t1)
    for (let i = 1; i < 10; i++) {
      const t = t0 + ((t1 - t0) * i) / 10
      // Afspelen met de verschuiving van de startfractie.
      const h = houdingVan(o, t - (o.start ?? 0) * duur)
      const kn = (figuurIn(o, h).benen[0].buiging - k0) / (k1 - k0)
      const ka = (h.kantel - kantel(t0)) / (kantel(t1) - kantel(t0))
      expect(Math.abs(kn - ka)).toBeLessThan(0.12)
    }
  })

  it('kniePad: met alleen een begin- en eindsleutel buigen heup en knie samen, zonder buigt de knie eerst', () => {
    const s = squat({ naam: 'Test squat', last: 'goblet' })
    const twee = [
      { houding: s.sleutels[0].houding, vast: 0.5, naarVolgende: 3 },
      { houding: s.sleutels[s.sleutels.length / 2].houding, vast: 0.4, naarVolgende: 1.1 },
    ]
    const met: Oefening3d = { ...s, sleutels: twee, start: 0, kniePad: true }
    const zonder: Oefening3d = { ...met, kniePad: false }
    const voortgang = (o: Oefening3d, t: number) => {
      const k = (x: number) => figuurIn(o, houdingVan(o, x)).benen[0].buiging
      const a = (x: number) => houdingVan(o, x).kantel
      return { knie: (k(t) - k(0.5)) / (k(3.5) - k(0.5)), kantel: (a(t) - a(0.5)) / (a(3.5) - a(0.5)) }
    }
    const v1 = voortgang(zonder, 0.5 + 3 * 0.15)
    expect(v1.knie - v1.kantel).toBeGreaterThan(0.08)
    for (const f of [0.15, 0.3, 0.5, 0.7]) {
      const v2 = voortgang(met, 0.5 + 3 * f)
      expect(Math.abs(v2.knie - v2.kantel)).toBeLessThan(0.05)
    }
  })

  it('TEMPO.squat: 3 tellen omlaag zoals de coaching', () => {
    expect(TEMPO.squat.heen).toBe(3)
    expect(TEMPO.hinge.heen).toBe(3)
  })
})

describe('3D-beweging: knie en last', () => {
  it('reikBijKnie: gestrekt is 1, gebogen korter', () => {
    expect(reikBijKnie(0)).toBeCloseTo(1, 6)
    expect(reikBijKnie(90)).toBeLessThan(0.75)
  })

  it('metKnie zet de knie op de gevraagde buiging', () => {
    const o = squat({ naam: 'Test', last: 'geen' })
    for (const doel of [10, 45, 90]) {
      const h = metKnie(o, houding({ bekkenY: 0.9, kantel: 20 }), doel)
      expect(figuurIn(o, h).benen[0].buiging).toBeCloseTo(doel, 1)
    }
  })

  it('heupscharnier: de knie houdt een vaste buiging, los van de diepte', () => {
    const o = hinge({ naam: 'Test RDL', last: 'stang', knie: 18 })
    const n = o.sleutels.length / 2
    for (let i = 1; i <= n; i++) {
      const kb = figuurIn(o, o.sleutels[i].houding).benen[0].buiging
      if (i >= 2) expect(kb).toBeCloseTo(18, 0)
    }
  })

  it('heupscharnier: de stang glijdt langs de benen', () => {
    const o = hinge({ naam: 'Test RDL', last: 'stang' })
    const f = figuurIn(o, o.sleutels[o.sleutels.length / 2].houding)
    const b = f.benen[0]
    const lijn = b.eind.clone().sub(b.midden)
    const naarStang = new Vector3(0, f.last.pos.y, f.last.pos.z).sub(new Vector3(0, b.midden.y, b.midden.z))
    const afstand = Math.abs(new Vector3(0, lijn.y, lijn.z).normalize().cross(naarStang).x)
    expect(afstand).toBeLessThan(0.15)
  })

  it('kettlebell in een scharnier: de last hangt vrij (niet langs de benen)', () => {
    const o = hinge({ naam: 'Test kb', last: 'kettlebell' })
    expect(o.sleutels.every((s) => Number.isFinite(s.houding.lastZ))).toBe(true)
  })

  it('squat met halters: de halters hangen naast de knieen', () => {
    const o = squat({ naam: 'Test', last: 'halters' })
    for (const { f } of monsters(o)) {
      const halter = f.armen[0].eind.x
      expect(halter - f.benen[0].midden.x).toBeGreaterThan(0.08)
    }
  })
})

describe('3D-beweging: spieren en camera', () => {
  const o = { spieren: ['hamstring', 'bil'] as const, spierenSecundair: ['onderrug'] as const }

  it('spierSterkte: primair vol, secundair zachter, anders niets', () => {
    expect(spierSterkte(o, 'bil')).toBe(SPIER_STERKTE.primair)
    expect(spierSterkte(o, 'hamstring')).toBe(SPIER_STERKTE.primair)
    expect(spierSterkte(o, 'onderrug')).toBe(SPIER_STERKTE.secundair)
    expect(spierSterkte(o, 'borst')).toBe(0)
    expect(SPIER_STERKTE.secundair).toBeLessThan(SPIER_STERKTE.primair)
  })

  it('hamstring en onderrug hebben een eigen zone: dij en rug lichten niet mee op', () => {
    expect(spierSterkte(o, 'dij')).toBe(0)
    expect(spierSterkte(o, 'rug')).toBe(0)
    expect(getekendeSpieren(o)).toEqual(['hamstring', 'bil'])
  })

  it('spierSterktes: elk werkend deel met zijn sterkte, voor het palet', () => {
    expect(spierSterktes(o)).toEqual({
      hamstring: SPIER_STERKTE.primair,
      bil: SPIER_STERKTE.primair,
      onderrug: SPIER_STERKTE.secundair,
    })
  })

  it('camera per patroon past binnen de regels van de bibliotheek', () => {
    for (const k of Object.values(CAMERA_PATROON)) {
      expect(k.afstand).toBeGreaterThanOrEqual(3)
      expect(k.afstand).toBeLessThanOrEqual(6)
      expect(Math.abs(k.hoek)).toBeLessThanOrEqual(120)
    }
    expect(hinge({ naam: 'x', last: 'stang' }).camera).toEqual(CAMERA_PATROON.scharnier)
    expect(squat({ naam: 'x', last: 'stang' }).camera).toEqual(CAMERA_PATROON.squat)
  })
})
