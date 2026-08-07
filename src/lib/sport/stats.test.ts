import { describe, it, expect } from 'vitest'
import { geschat1RM, beste1RM, piekGewicht, weekStreak } from './stats'

describe('geschat1RM (Epley)', () => {
  it('geeft het gewicht zelf bij 1 herhaling', () => {
    expect(geschat1RM(100, 1)).toBe(100)
  })
  it('schat hoger bij meer herhalingen', () => {
    expect(geschat1RM(100, 10)).toBe(133) // 100 × (1 + 10/30)
    expect(geschat1RM(60, 5)).toBe(70)
  })
  it('is 0 bij onbruikbare invoer', () => {
    expect(geschat1RM(0, 5)).toBe(0)
    expect(geschat1RM(100, 0)).toBe(0)
  })
})

describe('beste1RM en piekGewicht', () => {
  const sets = [
    { herhalingen: 10, gewichtKg: 60 }, // 1RM ~80
    { herhalingen: 3, gewichtKg: 80 },  // 1RM ~88
    { herhalingen: 12, gewichtKg: null },
  ]
  it('beste1RM neemt het hoogste geschatte 1RM', () => {
    expect(beste1RM(sets)).toBe(88)
  })
  it('piekGewicht neemt het zwaarste gewicht', () => {
    expect(piekGewicht(sets)).toBe(80)
  })
  it('is 0 zonder bruikbare sets', () => {
    expect(beste1RM([{ herhalingen: 5, gewichtKg: null }])).toBe(0)
    expect(piekGewicht([])).toBe(0)
  })
})

describe('weekStreak', () => {
  it('telt opeenvolgende weken met een training', () => {
    // 2026-08-07 is de "huidige" week; drie weken op rij ervoor.
    const datums = ['2026-07-24', '2026-07-31', '2026-08-07']
    expect(weekStreak(datums, '2026-08-07')).toBe(3)
  })
  it('staat een gemiste huidige week toe (ankert op vorige week)', () => {
    expect(weekStreak(['2026-07-31'], '2026-08-07')).toBe(1)
  })
  it('is 0 als er niet recent is getraind', () => {
    expect(weekStreak(['2026-06-01'], '2026-08-07')).toBe(0)
    expect(weekStreak([], '2026-08-07')).toBe(0)
  })
  it('breekt bij een gat', () => {
    // deze week + twee weken terug, maar vorige week overgeslagen → streak 1
    expect(weekStreak(['2026-07-24', '2026-08-07'], '2026-08-07')).toBe(1)
  })
})
