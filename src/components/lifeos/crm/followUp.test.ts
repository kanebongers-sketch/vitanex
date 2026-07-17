// Tests voor het follow-up-label op een kaart. De kern: null ≠ 0 (geen dag → geen
// label, niet "vandaag"), en de vandaag/morgen/te-laat-grenzen kloppen — óók over
// de zomertijdgrens, waar een kaal millisecondenverschil zou kunnen wankelen.

import { describe, expect, it } from 'vitest'
import { followUpLabel } from '@/components/lifeos/crm/followUp'

// Vaste "vandaag" zodat de test niet van de echte klok afhangt.
const VANDAAG = new Date(2026, 6, 17) // 17 juli 2026 (lokale middernacht)

describe('followUpLabel', () => {
  it('geeft null bij een ongeldige datumsleutel', () => {
    expect(followUpLabel('binnenkort', VANDAAG)).toBeNull()
    expect(followUpLabel('2026-13-40', VANDAAG)).toBeNull()
  })

  it('noemt vandaag "vandaag" en markeert dat als dringend', () => {
    const uit = followUpLabel('2026-07-17', VANDAAG)
    expect(uit).toEqual({ tekst: 'vandaag', dringend: true })
  })

  it('noemt gisteren "te laat" en dringend', () => {
    const uit = followUpLabel('2026-07-16', VANDAAG)
    expect(uit).toEqual({ tekst: 'te laat', dringend: true })
  })

  it('noemt morgen "morgen", niet dringend', () => {
    const uit = followUpLabel('2026-07-18', VANDAAG)
    expect(uit).toEqual({ tekst: 'morgen', dringend: false })
  })

  it('toont een verre dag als korte datum, niet dringend', () => {
    const uit = followUpLabel('2026-07-25', VANDAAG)
    expect(uit?.dringend).toBe(false)
    expect(uit?.tekst).toMatch(/25/) // '... 25 jul'
  })

  // Zonder een vaste 'vandaag' (vóór mount) tonen we de absolute datum, geen
  // "vandaag"/"morgen" — dat voorkomt een hydration-mismatch op klok-afhankelijke
  // tekst.
  it('toont de absolute datum als vandaag null is', () => {
    const uit = followUpLabel('2026-07-17', null)
    expect(uit?.dringend).toBe(false)
    expect(uit?.tekst).toMatch(/17/)
  })

  // De zomertijdgrens: de nacht van 25 op 26 okt 2026 duurt in NL 25 uur. "Morgen"
  // moet dan nog steeds "morgen" heten (Math.round vangt de 25u/24u = 1,04 → 1).
  it('houdt "morgen" kloppend over de herfst-zomertijdgrens', () => {
    const vlakVoor = new Date(2026, 9, 25) // 25 okt 2026
    expect(followUpLabel('2026-10-26', vlakVoor)).toEqual({ tekst: 'morgen', dringend: false })
  })

  it('houdt "morgen" kloppend over de lente-zomertijdgrens (23-uursnacht)', () => {
    const vlakVoor = new Date(2026, 2, 28) // 28 mrt 2026
    expect(followUpLabel('2026-03-29', vlakVoor)).toEqual({ tekst: 'morgen', dringend: false })
  })
})
