import { describe, expect, it } from 'vitest'
import { COACHING_BOEKEN, coachingSleutel, coachingVoor } from './index'
import type { Coaching } from './typen'

// De coaching is het belangrijkste wat leden lezen: dezelfde lat voor elke oefening.

const ALLES: [string, Coaching][] = COACHING_BOEKEN.flatMap((boek) => Object.entries(boek))

/** Alle tekst van een oefening, om de schrijfstijl te controleren. */
function teksten(c: Coaching): string[] {
  return [
    ...c.kernpunten.flatMap((k) => [k.punt, k.uitleg]),
    ...c.opstelling,
    ...c.stappen,
    ...c.fouten.flatMap((f) => [f.fout, f.beter]),
    c.ademhaling,
    c.tempo,
    c.makkelijker ?? '',
    c.zwaarder ?? '',
  ]
}

describe('coaching per oefening', () => {
  it('dekt de hele bibliotheek, zonder dubbele namen', () => {
    expect(ALLES.length).toBeGreaterThanOrEqual(140)
    const sleutels = ALLES.map(([naam]) => coachingSleutel(naam))
    expect(new Set(sleutels).size).toBe(sleutels.length)
  })

  it.each(ALLES)('%s heeft de juiste opbouw', (_naam, c) => {
    expect(c.kernpunten.length).toBeGreaterThanOrEqual(3)
    expect(c.kernpunten.length).toBeLessThanOrEqual(5)
    for (const k of c.kernpunten) {
      expect(k.punt.length).toBeGreaterThan(2)
      expect(k.punt.length).toBeLessThanOrEqual(32)
      expect(k.uitleg.length).toBeLessThanOrEqual(140)
    }
    expect(c.opstelling.length).toBeGreaterThanOrEqual(1)
    expect(c.opstelling.length).toBeLessThanOrEqual(3)
    expect(c.stappen.length).toBeGreaterThanOrEqual(2)
    expect(c.stappen.length).toBeLessThanOrEqual(4)
    expect(c.fouten.length).toBeGreaterThanOrEqual(2)
    expect(c.fouten.length).toBeLessThanOrEqual(4)
    for (const f of c.fouten) {
      expect(f.fout.length).toBeLessThanOrEqual(60)
      expect(f.beter.length).toBeLessThanOrEqual(140)
    }
    expect(c.ademhaling.length).toBeGreaterThan(10)
    expect(c.tempo.length).toBeGreaterThan(5)
    expect((c.makkelijker ?? '').length).toBeLessThanOrEqual(140)
    expect((c.zwaarder ?? '').length).toBeLessThanOrEqual(140)
  })

  it.each(ALLES)('%s volgt de schrijfstijl', (_naam, c) => {
    for (const t of teksten(c)) {
      expect(t).not.toMatch(/[–—]/)
      expect(t).not.toMatch(/\s-\s/)
      expect(t).not.toMatch(/\b(één|één|vóór|wél|níet|ín|zéér|dát|dié)\b/i)
      expect(t).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(t).toBe(t.trim())
    }
    // Kernpunten zijn uniek binnen een oefening (ze dienen ook als React-key).
    expect(new Set(c.kernpunten.map((k) => k.punt)).size).toBe(c.kernpunten.length)
    expect(new Set(c.fouten.map((f) => f.fout)).size).toBe(c.fouten.length)
    expect(new Set(c.stappen).size).toBe(c.stappen.length)
    expect(new Set(c.opstelling).size).toBe(c.opstelling.length)
  })

  it('vindt een oefening ongeacht hoofdletters en spaties', () => {
    const [naam] = ALLES[0]
    expect(coachingVoor(`  ${naam.toUpperCase()} `)).toBe(ALLES[0][1])
    expect(coachingVoor('Bestaat niet')).toBeNull()
  })
})
