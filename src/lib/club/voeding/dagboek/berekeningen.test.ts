import { describe, expect, it } from 'vitest'
import { deelVanDoel, geldendDoel, maaltijdVoorUur, naarPer100, perMaaltijd, plusDag, recenteProducten, resterend, schaalNaarPortie, telOp, weekGemiddelde, weekOverzicht } from './berekeningen'
import type { DagboekRegel } from './model'

// Geporteerd uit MentaForce (components/voeding/berekeningen.test.ts) en
// uitgebreid: een fout hier laat de kcal- en macrocijfers van een lid liegen.

function regel(over: Partial<DagboekRegel>): DagboekRegel {
  return {
    id: 'x', datum: '2026-10-29', maaltijd: 'lunch', naam: 'Brood', merk: null, gram: null, maat: null, aantal: null,
    kcal: 0, eiwitG: 0, koolhydratenG: 0, vetG: 0, vezelsG: null, bron: 'handmatig', productSleutel: null, per100: null, aangemaaktOp: '2026-10-29T10:00:00Z',
    ...over,
  }
}

describe('telOp', () => {
  it('is nul voor een lege dag', () => {
    expect(telOp([])).toEqual({ kcal: 0, eiwitG: 0, koolhydratenG: 0, vetG: 0 })
  })

  it('telt macro\'s op met kcal heel en macro\'s op een decimaal', () => {
    const t = telOp([regel({ kcal: 500, eiwitG: 30.15, koolhydratenG: 50, vetG: 20 }), regel({ kcal: 300.4, eiwitG: 10.1 })])
    expect(t).toEqual({ kcal: 800, eiwitG: 40.3, koolhydratenG: 50, vetG: 20 })
  })
})

describe('schaalNaarPortie', () => {
  const per100 = { kcal: 250, eiwitG: 12.4, koolhydratenG: 30.2, vetG: 8.6, vezelsG: 3.1 }

  it('laat 100 g ongemoeid', () => {
    expect(schaalNaarPortie(per100, 100)).toEqual({ kcal: 250, eiwitG: 12.4, koolhydratenG: 30.2, vetG: 8.6, vezelsG: 3.1 })
  })

  it('schaalt naar een halve portie met kcal heel en macro\'s op een decimaal', () => {
    const s = schaalNaarPortie(per100, 50)
    expect(s.kcal).toBe(125)
    expect(s.eiwitG).toBe(6.2)
    expect(s.koolhydratenG).toBe(15.1)
    expect(s.vetG).toBe(4.3)
  })

  it('rekent 150 g goed en houdt onbekende vezels onbekend', () => {
    const s = schaalNaarPortie({ kcal: 100, eiwitG: 10, koolhydratenG: 0, vetG: 0, vezelsG: null }, 150)
    expect(s).toEqual({ kcal: 150, eiwitG: 15, koolhydratenG: 0, vetG: 0, vezelsG: null })
  })

  it('telt een ongeldige portie als 0 gram', () => {
    expect(schaalNaarPortie(per100, -5).kcal).toBe(0)
    expect(schaalNaarPortie(per100, Number.NaN).kcal).toBe(0)
  })

  it('naarPer100 is het omgekeerde', () => {
    const p = naarPer100({ kcal: 155, eiwitG: 13, koolhydratenG: 1, vetG: 11 }, 50)
    expect(schaalNaarPortie(p, 50)).toMatchObject({ kcal: 155, eiwitG: 13, vetG: 11 })
  })
})

describe('doel', () => {
  const plan = { kcal: 2200, eiwitG: 160, koolhydratenG: 220, vetG: 70 }
  const eigen = { kcal: 1800, eiwitG: 120, koolhydratenG: 180, vetG: 60 }

  it('het plan van de coach wint van het eigen doel', () => {
    expect(geldendDoel(plan, eigen)).toEqual({ doel: plan, bron: 'coach' })
    expect(geldendDoel(null, eigen)).toEqual({ doel: eigen, bron: 'eigen' })
    expect(geldendDoel(null, null)).toEqual({ doel: null, bron: 'geen' })
  })

  it('een ring stopt bij vol en resterend wordt negatief erboven', () => {
    expect(deelVanDoel(1000, 2000)).toBe(0.5)
    expect(deelVanDoel(2500, 2000)).toBe(1)
    expect(deelVanDoel(100, 0)).toBe(0)
    expect(resterend(2300, 2000)).toBe(-300)
  })
})

describe('dagen en week', () => {
  it('plusDag rekent over de zomertijd en de maandgrens heen', () => {
    expect(plusDag('2026-10-25', 1)).toBe('2026-10-26')
    expect(plusDag('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('weekOverzicht geeft zeven dagen tot en met de dag, oudste eerst', () => {
    const week = weekOverzicht([regel({ datum: '2026-10-29', kcal: 600 }), regel({ datum: '2026-10-29', kcal: 400 }), regel({ datum: '2026-10-25', kcal: 1800 }), regel({ datum: '2026-10-20', kcal: 9999 })], '2026-10-29')
    expect(week.map((d) => d.datum)).toEqual(['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'])
    expect(week[6].totaal.kcal).toBe(1000)
    expect(week.filter((d) => d.gelogd)).toHaveLength(2)
  })

  it('het gemiddelde telt alleen dagen met eten', () => {
    const week = weekOverzicht([regel({ datum: '2026-10-29', kcal: 1000 }), regel({ datum: '2026-10-28', kcal: 2000 })], '2026-10-29')
    expect(weekGemiddelde(week)).toMatchObject({ kcal: 1500, dagen: 2 })
    expect(weekGemiddelde(weekOverzicht([], '2026-10-29'))).toBeNull()
  })

  it('perMaaltijd houdt de vaste volgorde', () => {
    const per = perMaaltijd([regel({ maaltijd: 'diner', kcal: 700 }), regel({ maaltijd: 'ontbijt', kcal: 300 })])
    expect(per.map((m) => m.maaltijd)).toEqual(['ontbijt', 'lunch', 'diner', 'tussendoor'])
    expect(per[2].totaal.kcal).toBe(700)
  })

  it('kiest de maaltijd van het moment', () => {
    expect(maaltijdVoorUur(7)).toBe('ontbijt')
    expect(maaltijdVoorUur(12)).toBe('lunch')
    expect(maaltijdVoorUur(16)).toBe('tussendoor')
    expect(maaltijdVoorUur(19)).toBe('diner')
    expect(maaltijdVoorUur(23)).toBe('tussendoor')
  })
})

describe('recenteProducten', () => {
  const per100 = { kcal: 60, eiwitG: 10, koolhydratenG: 4, vetG: 0.2, vezelsG: null }

  it('uniek op sleutel, nieuwste eerst, met de laatste portie; handmatig niet', () => {
    const r = recenteProducten([
      regel({ productSleutel: 'off:12345678', naam: 'Kwark', per100, gram: 150, aangemaaktOp: '2026-10-27T08:00:00Z' }),
      regel({ productSleutel: 'off:12345678', naam: 'Kwark', per100, gram: 250, aangemaaktOp: '2026-10-29T08:00:00Z' }),
      regel({ productSleutel: null, naam: 'Soep', aangemaaktOp: '2026-10-29T12:00:00Z' }),
      regel({ productSleutel: 'off:87654321', naam: 'Banaan', per100, gram: 120, aangemaaktOp: '2026-10-28T08:00:00Z' }),
    ])
    expect(r.map((p) => p.naam)).toEqual(['Kwark', 'Banaan'])
    expect(r[0].gram).toBe(250)
  })
})
