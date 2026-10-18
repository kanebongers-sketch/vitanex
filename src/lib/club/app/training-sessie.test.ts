import { describe, expect, it } from 'vitest'
import { CONCEPT_MAX_MS, leesConcept, nieuwConcept, rustOver, verlengRust, verstreken } from './training-sessie'

const NU = 1_800_000_000_000

describe('lopende training op het toestel', () => {
  it('leest een bewaarde training terug, met de rust', () => {
    const ruw = JSON.stringify({ start: NU - 600_000, scherm: 2, invoer: { 'abc:1': { kg: '40', herh: '10', tijd: '', klaar: true } }, rust: { start: NU - 30_000, sec: 90, volgende: 'set 2 Squat' } })
    const c = leesConcept(ruw, NU)
    expect(c?.scherm).toBe(2)
    expect(c?.invoer['abc:1']).toEqual({ kg: '40', herh: '10', tijd: '', klaar: true })
    expect(c?.rust && rustOver(c.rust, NU)).toBe(60)
  })

  it('gooit onzin, oude trainingen en vreemde sleutels weg', () => {
    expect(leesConcept('{kapot', NU)).toBeNull()
    expect(leesConcept(JSON.stringify({ start: NU - CONCEPT_MAX_MS, invoer: {} }), NU)).toBeNull()
    expect(leesConcept(JSON.stringify({ start: NU, invoer: [] }), NU)).toBeNull()
    const c = leesConcept(JSON.stringify({ start: NU, scherm: -1, invoer: { '<script>': { klaar: true }, 'a:1': { kg: 5, klaar: 'ja' } } }), NU)
    expect(c).toEqual({ id: expect.any(String), start: NU, scherm: 0, rust: null, wissels: {}, invoer: { 'a:1': { kg: '', herh: '', tijd: '', klaar: false } } })
  })

  it('een rust die lang voorbij is komt niet terug', () => {
    const ruw = JSON.stringify({ start: NU - 900_000, invoer: {}, rust: { start: NU - 300_000, sec: 60, volgende: null } })
    expect(leesConcept(ruw, NU)?.rust).toBeNull()
  })

  it('rust telt vanaf de starttijd, ook na een scherm dat uit was', () => {
    const rust = { start: NU, sec: 90, volgende: null }
    expect(rustOver(rust, NU + 45_000)).toBe(45)
    expect(rustOver(rust, NU + 600_000)).toBe(0)
    expect(verlengRust(rust, 15, NU).sec).toBe(105)
    expect(verlengRust(rust, -15, NU + 80_000).sec).toBe(80)
    expect(verstreken(NU - 61_500, NU)).toBe(61)
  })

  it('bewaart een andere oefening (toestel bezet), zonder vreemde beelden', () => {
    const alt = { oefeningId: 'o-9', naam: 'Leg press', materiaal: 'machine', beeld: { start: 'javascript:x', eind: 'x', bron: 'repdb' } }
    const c = leesConcept(JSON.stringify({ start: NU, invoer: {}, wissels: { 'r-1': alt, 'r-2': { naam: 'zonder id' } } }), NU)
    expect(Object.keys(c?.wissels ?? {})).toEqual(['r-1'])
    expect(c?.wissels['r-1'].beeld).toBeNull()
  })

  it('een training houdt haar vaste id, ook na herladen; zonder geldig id komt er een nieuw', () => {
    const id = 'AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE'
    expect(leesConcept(JSON.stringify({ id, start: NU, invoer: {} }), NU)?.id).toBe(id.toLowerCase())
    const zonder = leesConcept(JSON.stringify({ id: 'x', start: NU, invoer: {} }), NU)
    expect(zonder?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    const nieuw = nieuwConcept({}, NU)
    expect(leesConcept(JSON.stringify(nieuw), NU)?.id).toBe(nieuw.id)
    expect(nieuwConcept({}, NU).id).not.toBe(nieuw.id)
  })
})
