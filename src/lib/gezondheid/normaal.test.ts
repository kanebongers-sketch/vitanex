import { describe, expect, test } from 'vitest'
import { berekenNormaal, metingenVoorNormaal, MIN_METINGEN_NORMAAL } from './normaal'
import { verschuifDatum } from './statistiek'
import type { GezondheidsDag, MetriekSleutel } from './types'

const VANDAAG = '2026-10-09'

/** `waarden[i]` hoort bij i dagen geleden; null = geen meting. */
function reeks(sleutel: MetriekSleutel, waarden: (number | null)[]): GezondheidsDag[] {
  return waarden
    .map((w, i) => ({ w, datum: verschuifDatum(VANDAAG, -i) }))
    .filter((x): x is { w: number; datum: string } => x.w !== null)
    .map(({ w, datum }) => ({ datum, waarden: { [sleutel]: w }, fases: null, herkomst: {} }))
    .reverse()
}

describe('berekenNormaal', () => {
  test('mediaan en gebruikelijk bereik over de 28 dagen vóór vandaag', () => {
    // Arrange: vandaag 20000 (telt niet mee), dan 10 dagen 5000..9500
    const dagen = reeks('stappen', [20000, ...Array.from({ length: 10 }, (_, i) => 5000 + i * 500)])
    // Act
    const normaal = berekenNormaal(dagen, 'stappen', VANDAAG)
    // Assert
    expect(normaal?.mediaan).toBe(7250)
    expect(normaal?.aantal).toBe(10)
    expect(normaal?.laag).toBeLessThan(normaal?.mediaan ?? 0)
    expect(normaal?.hoog).toBeGreaterThan(normaal?.mediaan ?? 0)
    expect(normaal?.tot).toBe('2026-10-08')
    expect(normaal?.vanaf).toBe('2026-09-11')
  })

  test('geen normaal onder het minimum aantal metingen', () => {
    const dagen = reeks('slaap', [null, 420, 430, 440, 450])
    expect(MIN_METINGEN_NORMAAL).toBe(5)
    expect(berekenNormaal(dagen, 'slaap', VANDAAG)).toBeNull()
    expect(metingenVoorNormaal(dagen, 'slaap', VANDAAG)).toBe(4)
  })

  test('metingen ouder dan 28 dagen tellen niet mee', () => {
    const waarden: (number | null)[] = Array.from({ length: 40 }, (_, i) => (i > 28 ? 60 : null))
    expect(berekenNormaal(reeks('rusthartslag', waarden), 'rusthartslag', VANDAAG)).toBeNull()
  })

  test('trainingen krijgen nooit een normaal', () => {
    const dagen = reeks('workouts', [null, 30, 40, 50, 60, 70, 80])
    expect(berekenNormaal(dagen, 'workouts', VANDAAG)).toBeNull()
  })
})
