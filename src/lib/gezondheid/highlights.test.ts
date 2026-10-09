import { describe, expect, test } from 'vitest'
import { beoordeelbareMetrieken, berekenHighlight, berekenHighlights } from './highlights'
import { verschuifDatum } from './statistiek'
import type { GezondheidsDag, MetriekSleutel } from './types'

const VANDAAG = '2026-10-09'

/** Bouwt `aantal` dagen tot en met vandaag; `waarde(i)` met i = dagen geleden. */
function reeks(
  sleutel: MetriekSleutel, aantal: number, waarde: (dagenGeleden: number) => number | null,
): GezondheidsDag[] {
  return Array.from({ length: aantal }, (_, i) => aantal - 1 - i)
    .map((geleden) => ({ geleden, w: waarde(geleden) }))
    .filter((x): x is { geleden: number; w: number } => x.w !== null)
    .map(({ geleden, w }) => ({
      datum: verschuifDatum(VANDAAG, -geleden), waarden: { [sleutel]: w }, fases: null, herkomst: {},
    }))
}

describe('berekenHighlight', () => {
  test('slaap: de afgelopen 7 nachten 34 min minder dan je normaal', () => {
    // Arrange: 28 nachten van 7 u 30, daarna 7 nachten van 6 u 56
    const dagen = reeks('slaap', 35, (g) => (g < 7 ? 416 : 450))
    // Act
    const h = berekenHighlight(dagen, 'slaap', VANDAAG)
    // Assert
    expect(h?.tekst).toBe('Je sliep de afgelopen 7 nachten gemiddeld 34 min minder dan je normaal.')
    expect(h?.verschil).toBe(-34)
    expect(h?.recentAantal).toBe(7)
    expect(h?.normaalAantal).toBe(28)
  })

  test('stappen: vandaag telt niet mee in de recente week', () => {
    // Vandaag pas 100 stappen; de 7 volle dagen daarvoor 9000, normaal 7500
    const dagen = reeks('stappen', 36, (g) => (g === 0 ? 100 : g <= 7 ? 9000 : 7500))
    const h = berekenHighlight(dagen, 'stappen', VANDAAG)
    expect(h?.tekst).toBe('Je zette de afgelopen 7 dagen gemiddeld 1.500 stappen per dag meer dan je normaal.')
  })

  test('zwijgt onder de drempel (ruis)', () => {
    const dagen = reeks('rusthartslag', 35, (g) => (g < 7 ? 59 : 58))
    expect(berekenHighlight(dagen, 'rusthartslag', VANDAAG)).toBeNull()
  })

  test('zwijgt bij minder dan 5 metingen voor de normaal', () => {
    const dagen = reeks('slaap', 35, (g) => (g < 7 ? 360 : g < 11 ? 480 : null))
    expect(berekenHighlight(dagen, 'slaap', VANDAAG)).toBeNull()
  })

  test('zwijgt bij minder dan 3 recente metingen', () => {
    const dagen = reeks('slaap', 35, (g) => (g < 2 ? 360 : g < 7 ? null : 480))
    expect(berekenHighlight(dagen, 'slaap', VANDAAG)).toBeNull()
  })

  test('bedtijd spreekt van later in slaap vallen', () => {
    // normaal 23:00 (660 na 12:00), recent 23:45 (705)
    const dagen = reeks('bedtijd', 35, (g) => (g < 7 ? 705 : 660))
    expect(berekenHighlight(dagen, 'bedtijd', VANDAAG)?.tekst)
      .toBe('Je viel de afgelopen 7 nachten gemiddeld 45 min later in slaap dan je normaal.')
  })

  test('trainingen krijgen geen highlight', () => {
    const dagen = reeks('workouts', 35, (g) => (g < 7 ? 90 : 20))
    expect(berekenHighlight(dagen, 'workouts', VANDAAG)).toBeNull()
  })
})

describe('berekenHighlights', () => {
  test('sterkste afwijking eerst en maximaal het gevraagde aantal', () => {
    const dagen = [
      ...reeks('slaap', 35, (g) => (g < 7 ? 420 : 450)),         // 30 min, drempel 20 → 1,5
      ...reeks('rusthartslag', 35, (g) => (g < 7 ? 66 : 58)),    // 8 slagen, drempel 3 → 2,7
    ]
    const samen = new Map<string, GezondheidsDag>()
    for (const d of dagen) {
      const bestaand = samen.get(d.datum)
      samen.set(d.datum, bestaand ? { ...bestaand, waarden: { ...bestaand.waarden, ...d.waarden } } : d)
    }
    const lijst = [...samen.values()].sort((a, b) => a.datum.localeCompare(b.datum))

    const highlights = berekenHighlights(lijst, VANDAAG, 1)
    expect(highlights).toHaveLength(1)
    expect(highlights[0].sleutel).toBe('rusthartslag')
  })

  test('zonder data geen highlights', () => {
    expect(berekenHighlights([], VANDAAG)).toEqual([])
  })
})

describe('beoordeelbareMetrieken', () => {
  test('alleen metrieken met genoeg recente én eerdere metingen', () => {
    const dagen = reeks('slaap', 35, () => 450)
    expect(beoordeelbareMetrieken(dagen, VANDAAG)).toEqual(['slaap'])
    expect(beoordeelbareMetrieken(reeks('slaap', 10, () => 450), VANDAAG)).toEqual([])
  })
})
