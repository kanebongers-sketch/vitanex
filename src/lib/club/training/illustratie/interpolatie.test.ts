import { describe, expect, test } from 'vitest'
import { meng, mengOpTijd, tempoProfiel, tijdlijn, zacht } from './interpolatie'
import { breedte, ellips, gladGesloten, type Profiel } from './vorm'
import { v } from './vec'

describe('mengen', () => {
  test('getallen lineair, ook diep in objecten en lijsten', () => {
    const a = { x: 0, lijst: [0, 10], tekst: 'gelijk', diep: { h: 90 } }
    const b = { x: 10, lijst: [10, 20], tekst: 'gelijk', diep: { h: 180 } }
    expect(meng(a, b, 0.5)).toEqual({ x: 5, lijst: [5, 15], tekst: 'gelijk', diep: { h: 135 } })
  })

  test('verschillende vaste waarden of vormen geven een fout', () => {
    expect(() => meng({ a: 'x' }, { a: 'y' }, 0.5)).toThrow()
    expect(() => meng([1, 2], [1], 0.5)).toThrow()
    expect(() => meng({ a: 1 }, { b: 1 }, 0.5)).toThrow()
  })
})

describe('tempo', () => {
  test('zacht begint en eindigt stil en is symmetrisch', () => {
    expect(zacht(0)).toBe(0)
    expect(zacht(1)).toBe(1)
    expect(zacht(0.5)).toBeCloseTo(0.5)
    for (const x of [0.1, 0.3, 0.7]) expect(zacht(1 - x)).toBeCloseTo(1 - zacht(x))
  })

  test('de concentrische fase is sneller dan de excentrische', () => {
    const p = tempoProfiel('excentrisch')
    expect(p.heen).toBeGreaterThan(p.terug)
    const q = tempoProfiel('concentrisch')
    expect(q.heen).toBeLessThan(q.terug)
    expect(p.totaal).toBeCloseTo(q.totaal)
  })

  test('menging op tijd: rust bij begin en eind, en herhaalt', () => {
    const p = tempoProfiel('excentrisch')
    expect(mengOpTijd(0.1, p)).toBe(0)
    expect(mengOpTijd(p.rustBegin + p.heen + 0.05, p)).toBe(1)
    expect(mengOpTijd(p.totaal + 0.1, p)).toBe(0)
    const half = mengOpTijd(p.rustBegin + p.heen / 2, p)
    expect(half).toBeGreaterThan(0.4)
    expect(half).toBeLessThan(0.6)
  })

  test('de tijdlijn loopt van 0 tot 1 en gaat heen en terug langs dezelfde beelden', () => {
    const t = tijdlijn('concentrisch', 6)
    expect(t.momenten[0]).toBe(0)
    expect(t.momenten[t.momenten.length - 1]).toBe(1)
    for (let i = 1; i < t.momenten.length; i++) expect(t.momenten[i]).toBeGreaterThan(t.momenten[i - 1])
    expect(t.beelden[0]).toBe(0)
    expect(t.beelden[t.beelden.length - 1]).toBe(0)
    expect(Math.max(...t.beelden)).toBe(6)
    expect(t.momenten.length).toBe(t.beelden.length)
  })
})

describe('vormen', () => {
  test('een gladde vorm heeft altijd dezelfde opbouw, wat de punten ook zijn', () => {
    const letters = (d: string) => d.replace(/[^A-Za-z]/g, '')
    const a = gladGesloten([v(0, 0), v(10, 0), v(10, 10), v(0, 10)])
    const b = gladGesloten([v(5, 3), v(18, -2), v(11, 14), v(-1, 9)])
    expect(letters(a)).toBe(letters(b))
    expect(letters(a)).toBe('MCCCCZ')
  })

  test('ellipsen zijn vier bogen', () => {
    expect(ellips(v(0, 0), 5, 3).match(/C/g)).toHaveLength(4)
  })

  test('de breedte van een profiel wordt lineair tussen de sleutels gelezen', () => {
    const p: Profiel = [[0, 4, 2], [1, 8, 6]]
    expect(breedte(p, 0.5, 1)).toBeCloseTo(6)
    expect(breedte(p, 0.25, -1)).toBeCloseTo(3)
    expect(breedte(p, 2, 1)).toBe(8)
  })
})
