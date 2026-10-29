import { describe, expect, it } from 'vitest'
import { BLENDER_OEFENINGEN } from '@/lib/club/training/blender-bibliotheek'
import { coachingVoor } from '@/lib/club/training/coaching'
import { COACHING_EN, COACHING_EN_NAMEN, standaardCoachingIn } from './coaching'

// Elke kiesbare oefening (een Blender-render) heeft coaching in het Engels, met
// precies dezelfde opbouw als het Nederlands uit de bibliotheek.

describe('Engelse coaching van de kiesbare oefeningen', () => {
  it('elke Blender-oefening heeft Engelse coaching', () => {
    const zonder = BLENDER_OEFENINGEN.map((o) => o.naam).filter((n) => !COACHING_EN_NAMEN.includes(n))
    expect(zonder).toEqual([])
  })

  it.each(COACHING_EN_NAMEN)('%s: zelfde opbouw als het Nederlands', (naam) => {
    const nl = coachingVoor(naam)
    const en = COACHING_EN[naam]
    expect(nl).not.toBeNull()
    if (!nl) return
    expect(en.kernpunten.length).toBe(nl.kernpunten.length)
    expect(en.opstelling.length).toBe(nl.opstelling.length)
    expect(en.stappen.length).toBe(nl.stappen.length)
    expect(en.fouten.length).toBe(nl.fouten.length)
    expect(Boolean(en.makkelijker)).toBe(Boolean(nl.makkelijker))
    expect(Boolean(en.zwaarder)).toBe(Boolean(nl.zwaarder))
  })

  it('Engels zonder gedachtestreepjes', () => {
    expect(JSON.stringify(COACHING_EN)).not.toMatch(/[–—]| - /)
  })

  it('kiest de taal, met het Nederlands als vangnet', () => {
    const nl = coachingVoor('Plank')
    expect(standaardCoachingIn('Plank', nl, 'nl')).toBe(nl)
    expect(standaardCoachingIn('plank', nl, 'en')?.kernpunten[0].punt).toBe('Straight line, head to heels')
    expect(standaardCoachingIn('Onbekend', null, 'en')).toBeNull()
  })
})
