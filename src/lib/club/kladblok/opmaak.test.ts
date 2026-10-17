import { describe, expect, test } from 'vitest'
import { regels, vinkStand, voegVinkToe, wisselVinkje } from './opmaak'

const tekst = '# Afsluiten\n[ ] Lichten uit\n[x] Kassa geteld\n- sleutel in de kluis\n\nGewone regel'

describe('opmaak', () => {
  test('regels herkent kop, vinkjes, punten, tekst en lege regels', () => {
    expect(regels(tekst).map((r) => r.soort)).toEqual(['kop', 'vink', 'vink', 'punt', 'leeg', 'tekst'])
    expect(regels(tekst)[2]).toEqual({ soort: 'vink', index: 2, klaar: true, tekst: 'Kassa geteld' })
  })
  test('wisselVinkje raakt alleen die regel; geen vinkregel = ongewijzigd', () => {
    expect(wisselVinkje(tekst, 1)).toBe(tekst.replace('[ ] Lichten', '[x] Lichten'))
    expect(wisselVinkje(tekst, 2)).toBe(tekst.replace('[x] Kassa', '[ ] Kassa'))
    expect(wisselVinkje(tekst, 0)).toBe(tekst)
    expect(wisselVinkje(tekst, 99)).toBe(tekst)
  })
  test('vinkStand en voegVinkToe', () => {
    expect(vinkStand(tekst)).toEqual({ klaar: 1, totaal: 2 })
    expect(voegVinkToe('')).toBe('[ ] ')
    expect(voegVinkToe('[ ] a\n')).toBe('[ ] a\n[ ] ')
    expect(voegVinkToe('Tekst')).toBe('Tekst\n\n[ ] ')
  })
})
