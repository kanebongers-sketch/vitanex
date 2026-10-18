import { describe, expect, test } from 'vitest'
import { coachingVoor } from '../coaching'
import { REPDB_ALLE_KOPPELINGEN } from '../beelden-repdb'
import { SPIEREN } from '../spieren'
import { PROTOTYPE_OEFENINGEN } from './oefeningen'
import { animatie, standOp, type Stand } from './scene'
import { voetPunt, type ZijSkelet } from './skelet-zij'
import { punt } from './vec'
import type { VoorSkelet } from './voor'
import { materiaalVoorbeelden } from './galerij'

const MENGINGEN = Array.from({ length: 11 }, (_, i) => i / 10)
const MIDDENVOET = 4.75 // enkel tot midden van de voet, in cm

function oefening(naam: string) {
  const o = PROTOTYPE_OEFENINGEN.find((x) => x.naam === naam)
  if (!o) throw new Error(`Onbekend: ${naam}`)
  return o
}

function zij(s: Stand): ZijSkelet {
  if (!('beenNabij' in s.skelet)) throw new Error('Geen zijaanzicht')
  return s.skelet
}

function stangX(s: Stand, id = 'stang'): number {
  const m = s.materiaal.find((x) => x.id === id)
  if (!m) throw new Error(`Geen ${id}`)
  return m.pos.x
}

describe('alle prototype-oefeningen', () => {
  test('twaalf oefeningen, elk met coaching en een huidig RepDB-beeld om mee te vergelijken', () => {
    expect(PROTOTYPE_OEFENINGEN).toHaveLength(12)
    const repdb = new Set(REPDB_ALLE_KOPPELINGEN.map((k) => k.id))
    for (const o of PROTOTYPE_OEFENINGEN) {
      expect(coachingVoor(o.naam), o.naam).not.toBeNull()
      expect(repdb.has(o.repdb), o.repdb).toBe(true)
      for (const sp of [...o.spieren.primair, ...o.spieren.secundair]) expect(SPIEREN).toContain(sp)
    }
  })

  for (const o of PROTOTYPE_OEFENINGEN) {
    describe(o.naam, () => {
      test('elke tussenstand is geldig: doelen gehaald, geen ongeldige getallen', () => {
        for (const m of MENGINGEN) {
          const s = standOp(o, m)
          expect(s.bereikt, `menging ${m}`).toBe(true)
          for (const l of s.lagen) expect(l.d, l.sleutel).not.toMatch(/NaN|Infinity/)
        }
      })

      test('de animatie kan vloeiend: elke laag heeft in elk beeld dezelfde opbouw', () => {
        const a = animatie(o, 8)
        for (const spoor of a.sporen) {
          const opbouw = spoor.paden.map((d) => d.replace(/[^A-Za-z]/g, ''))
          expect(new Set(opbouw).size, spoor.laag.sleutel).toBe(1)
        }
        expect(a.kader.b).toBeGreaterThan(0)
      })

      test('voeten zakken niet door de vloer (begin en eind exact, onderweg hooguit 2 cm)', () => {
        for (const m of MENGINGEN) {
          const s = standOp(o, m)
          if (!('beenNabij' in s.skelet)) continue
          const grens = m === 0 || m === 1 ? 1 : 2
          for (const b of [s.skelet.beenNabij, s.skelet.beenVer]) {
            for (const p of ['hiel', 'bal', 'teen'] as const) expect(voetPunt(b.voet, p).y, `${p} op ${m}`).toBeLessThan(grens)
          }
        }
      })
    })
  }
})

describe('biomechanica volgens de coaching', () => {
  test('back squat: stang boven de middenvoet, hielen op de grond, diepte tot de heupplooi', () => {
    const o = oefening('Back squat')
    for (const m of [0, 1]) {
      const s = standOp(o, m)
      expect(Math.abs(stangX(s) - MIDDENVOET), `stang op ${m}`).toBeLessThan(4)
      expect(voetPunt(zij(s).beenNabij.voet, 'hiel').y).toBeCloseTo(0, 0)
    }
    const onder = zij(standOp(o, 1))
    expect(onder.bekken.o.y).toBeGreaterThan(onder.beenNabij.onder.o.y - 4)
  })

  test('back squat en goblet squat: de rug blijft neutraal (geen bolle onderrug)', () => {
    for (const naam of ['Back squat', 'Goblet squat', 'Roemeense deadlift met barbell', 'Deadlift']) {
      for (const h of [oefening(naam).begin, oefening(naam).eind]) {
        if (h.aanzicht !== 'zij') continue
        expect(Math.abs(h.lumbaal), naam).toBeLessThanOrEqual(4)
        expect(Math.abs(h.thoracaal), naam).toBeLessThanOrEqual(4)
      }
    }
  })

  test('goblet squat: ellebogen zakken tussen de knieen (onder kniehoogte of erop)', () => {
    const s = zij(standOp(oefening('Goblet squat'), 1))
    expect(s.armNabij.onder.o.y).toBeGreaterThan(s.beenNabij.onder.o.y - 20)
    expect(s.armNabij.onder.o.x).toBeLessThan(s.beenNabij.onder.o.x)
  })

  test('roemeense deadlift: heupscharnier met stille knieen en de stang langs de benen', () => {
    const o = oefening('Roemeense deadlift met barbell')
    const onder = standOp(o, 1)
    const s = zij(onder)
    expect(o.eind.aanzicht === 'zij' && o.eind.bekken).toBeGreaterThan(60)
    expect(Math.abs(s.beenNabij.onder.o.x - s.beenNabij.voet.o.x)).toBeLessThan(4)
    expect(Math.abs(stangX(onder) - MIDDENVOET)).toBeLessThan(3)
  })

  test('deadlift: stang op de vloer boven de middenvoet, bovenaan rechtop', () => {
    const o = oefening('Deadlift')
    const onder = standOp(o, 0)
    const stang = onder.materiaal.find((m) => m.id === 'stang')
    expect(stang && stang.pos.y + 22.5).toBeGreaterThan(-2)
    expect(stang && stang.pos.y + 22.5).toBeLessThan(0.5)
    expect(Math.abs(stangX(onder) - MIDDENVOET)).toBeLessThan(3)
    const boven = zij(standOp(o, 1))
    expect(Math.abs(boven.bekken.hoek)).toBeLessThan(3)
  })

  test('bankdrukken: onderin staat de onderarm verticaal onder de stang', () => {
    const s = zij(standOp(oefening('Bankdrukken met barbell'), 1))
    const hoek = ((s.armNabij.onder.hoek % 360) + 360) % 360
    expect(Math.min(hoek, 360 - hoek)).toBeLessThan(10)
  })

  test('schouderdrukken: onderin polsen boven de ellebogen, bovenin armen boven de schouders', () => {
    const o = oefening('Dumbbell shoulder press')
    const onder = zij(standOp(o, 0))
    expect(Math.abs(onder.armNabij.greep.x - onder.armNabij.onder.o.x)).toBeLessThan(5)
    expect(onder.armNabij.onder.o.x).toBeGreaterThan(onder.armNabij.boven.o.x)
    const boven = zij(standOp(o, 1))
    expect(Math.abs(boven.armNabij.greep.x - boven.armNabij.boven.o.x)).toBeLessThan(8)
  })

  test('lat pulldown: stang naar de bovenste borst, ellebogen omlaag', () => {
    const s = zij(standOp(oefening('Lat pulldown'), 1))
    expect(s.armNabij.onder.o.y).toBeGreaterThan(s.armNabij.boven.o.y + 10)
    const borst = punt(s.thoracaal, 22, 18)
    expect(Math.hypot(s.armNabij.greep.x - borst.x, s.armNabij.greep.y - borst.y)).toBeLessThan(8)
  })

  test('seated cable row: aan het eind ellebogen achter het lichaam en handvat bij de buik', () => {
    const s = zij(standOp(oefening('Seated cable row'), 1))
    expect(s.armNabij.onder.o.x).toBeLessThan(s.armNabij.boven.o.x)
    expect(s.armNabij.greep.y).toBeGreaterThan(s.armNabij.boven.o.y + 15)
  })

  test('walking lunge: voorste knie boven de voet, achterste knie net boven de vloer, romp rechtop', () => {
    const o = oefening('Walking lunge')
    const s = zij(standOp(o, 1))
    const voor = s.beenNabij
    expect(voor.onder.o.x).toBeGreaterThan(voor.voet.o.x)
    expect(voor.onder.o.x).toBeLessThan(voetPunt(voor.voet, 'teen').x)
    expect(s.beenVer.onder.o.y).toBeLessThan(-6)
    expect(s.beenVer.onder.o.y).toBeGreaterThan(-16)
    expect(o.eind.aanzicht === 'zij' && Math.abs(o.eind.bekken)).toBeLessThan(6)
  })

  test('hip thrust: bovenrug op de rand van de bank, bovenin romp horizontaal en scheenbenen verticaal', () => {
    const o = oefening('Hip thrust met barbell')
    for (const m of [0, 0.5, 1]) {
      const s = zij(standOp(o, m))
      const rug = punt(s.thoracaal, 14, -9.2)
      expect(Math.abs(rug.x), `rand op ${m}`).toBeLessThan(6)
      expect(Math.abs(rug.y + 42), `hoogte op ${m}`).toBeLessThan(2.5)
    }
    const boven = zij(standOp(o, 1))
    expect(Math.abs(boven.bekken.hoek + 90)).toBeLessThan(3)
    expect(Math.abs(boven.beenNabij.onder.o.x - boven.beenNabij.voet.o.x)).toBeLessThan(3)
  })

  test('plank: ellebogen onder de schouders, eind een rechte lijn op de tenen', () => {
    const o = oefening('Plank')
    const s = zij(standOp(o, 1))
    expect(Math.abs(s.armNabij.onder.o.x - s.armNabij.boven.o.x)).toBeLessThan(2)
    const lijn = s.beenNabij.boven.hoek - 180
    expect(Math.abs(lijn - s.bekken.hoek)).toBeLessThan(2)
    expect(voetPunt(s.beenNabij.voet, 'teen').y).toBeGreaterThan(-1.5)
    const begin = zij(standOp(o, 0))
    expect(begin.beenNabij.onder.o.y).toBeGreaterThan(-7)
  })

  test('lateral raise: vooraanzicht, tot schouderhoogte en de handen niet boven de ellebogen', () => {
    const o = oefening('Lateral raise')
    const s = standOp(o, 1).skelet as VoorSkelet
    for (const arm of s.armen) {
      expect(Math.abs(arm.boven.a.o.y - arm.onder.a.o.y)).toBeLessThan(5)
      expect(arm.greep.y).toBeGreaterThanOrEqual(arm.onder.a.o.y)
    }
  })
})

describe('materiaal', () => {
  test('elk stuk materiaal is los te tekenen', () => {
    const v = materiaalVoorbeelden()
    expect(v.length).toBeGreaterThanOrEqual(10)
    for (const m of v) {
      expect(m.lagen.length, m.naam).toBeGreaterThan(1)
      for (const l of m.lagen) expect(l.d).not.toMatch(/NaN/)
    }
  })
})
