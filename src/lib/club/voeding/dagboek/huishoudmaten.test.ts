import { describe, expect, it } from 'vitest'
import { VOEDING_DAGBOEK } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { HUISHOUDMATEN, gramVoor, isMaatId } from './huishoudmaten'

// Geporteerd uit MentaForce (components/voeding/huishoudmaten.test.ts).

describe('gramVoor', () => {
  it('rekent een aantal maal het maatgewicht', () => {
    expect(gramVoor('snee', 2)).toBe(70)
    expect(gramVoor('glas', 1)).toBe(250)
  })

  it('valt terug op 1 bij een ongeldig aantal', () => {
    expect(gramVoor('stuk', 0)).toBe(100)
    expect(gramVoor('stuk', -3)).toBe(100)
    expect(gramVoor('stuk', Number.NaN)).toBe(100)
  })

  it('rondt af op hele grammen', () => {
    expect(gramVoor('theelepel', 3)).toBe(15)
    expect(gramVoor('snee', 1.5)).toBe(53)
  })

  it('geeft null bij een onbekende maat', () => {
    expect(gramVoor('emmer', 1)).toBeNull()
    expect(isMaatId('emmer')).toBe(false)
    expect(isMaatId('snee')).toBe(true)
  })

  it('heeft alleen positieve maatgewichten en een naam in beide talen', () => {
    for (const m of HUISHOUDMATEN) {
      expect(m.gram).toBeGreaterThan(0)
      expect(VOEDING_DAGBOEK.nl.maten[m.id]).toBeTruthy()
      expect(VOEDING_DAGBOEK.en.maten[m.id]).toBeTruthy()
    }
  })
})
