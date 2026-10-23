import { describe, expect, it } from 'vitest'
import { HOOFDSTUKKEN } from './functies'
import { NIEUW, aantalNieuw, korteDatum, maandNaam } from './nieuw'

// Wat er nieuw is: alleen wat al live is, met een echte datum, en volgens de
// schrijfregels van Kane.

const DATUM = /^\d{4}-\d{2}-\d{2}$/

describe('wat er nieuw is', () => {
  it('heeft per maand punten met een geldige datum binnen die maand, nieuwste eerst', () => {
    const maanden = NIEUW.map((m) => m.maand)
    expect([...maanden].sort().reverse()).toEqual(maanden)
    for (const m of NIEUW) {
      expect(m.punten.length).toBeGreaterThan(0)
      const datums = m.punten.map((p) => p.datum)
      expect([...datums].sort().reverse()).toEqual(datums)
      for (const d of datums) {
        expect(d).toMatch(DATUM)
        expect(Number.isNaN(Date.parse(`${d}T12:00:00Z`))).toBe(false)
        expect(d.startsWith(`${m.maand}-`)).toBe(true)
      }
    }
  })

  it('belooft niets voor later: geen datum in de toekomst en geen woorden als binnenkort', () => {
    const vandaag = new Date().toISOString().slice(0, 10)
    for (const m of NIEUW) for (const p of m.punten) expect(p.datum <= vandaag).toBe(true)
    expect(JSON.stringify(NIEUW)).not.toMatch(/binnenkort|straks|komt eraan|gepland voor|later dit jaar/i)
  })

  it('volgt de schrijfregels en noemt geen andere bedrijven', () => {
    const tekst = JSON.stringify(NIEUW)
    expect(tekst).not.toMatch(/[–—]| - /)
    expect(tekst).not.toMatch(/[éèëêáàóòúùíì]/i)
    expect(tekst).not.toMatch(/fit ?factory|virtuagym|sportivity|repdb|excel|stripe|ruben|kane/i)
  })

  it('hoort elk punt bij een bestaand hoofdstuk', () => {
    const sleutels = new Set(HOOFDSTUKKEN.map((h) => h.sleutel as string))
    for (const m of NIEUW) for (const p of m.punten) expect(sleutels.has(p.hoofdstuk)).toBe(true)
  })

  it('schrijft maanden en datums in het Nederlands', () => {
    expect(maandNaam('2026-10')).toBe('Oktober 2026')
    expect(korteDatum('2026-10-03')).toBe('3 okt')
    expect(aantalNieuw()).toBe(NIEUW.reduce((s, m) => s + m.punten.length, 0))
  })
})
