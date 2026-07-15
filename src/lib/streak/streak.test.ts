import { describe, it, expect } from 'vitest'
import { berekenStreak } from './streak'

// Vaste referentiedag: dagTerug wordt geïnjecteerd, dus de test hangt niet van
// de echte klok of tijdzone af.
const VANDAAG = '2026-07-15'

function dagTerug(n: number): string {
  const d = new Date(`${VANDAAG}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Leesbare helper: dagen(0, 1, 2) = vandaag, gisteren, eergisteren. */
function dagen(...n: number[]): string[] {
  return n.map(dagTerug)
}

describe('berekenStreak', () => {
  it('geeft 0 zonder enige activiteit', () => {
    expect(berekenStreak([], dagTerug)).toBe(0)
  })

  it('telt aaneengesloten dagen vanaf vandaag', () => {
    expect(berekenStreak(dagen(0, 1, 2), dagTerug)).toBe(3)
  })

  it('breekt af op de eerste gemiste dag', () => {
    // Vandaag + gisteren, gat op eergisteren, daarna weer activiteit.
    expect(berekenStreak(dagen(0, 1, 3, 4, 5), dagTerug)).toBe(2)
  })

  // ── De vergevende vandaag-regel (dark-pattern-fix) ────────────────────────
  it('telt door als vandaag nog niet gelogd is — een open dag is geen breuk', () => {
    expect(berekenStreak(dagen(1, 2, 3), dagTerug)).toBe(3)
  })

  it('geeft 1 als alleen vandaag gelogd is', () => {
    expect(berekenStreak(dagen(0), dagTerug)).toBe(1)
  })

  it('geeft 1 als alleen gisteren gelogd is', () => {
    expect(berekenStreak(dagen(1), dagTerug)).toBe(1)
  })

  it('geeft 0 als de reeks écht verbroken is (vandaag én gisteren leeg)', () => {
    expect(berekenStreak(dagen(2, 3, 4), dagTerug)).toBe(0)
  })

  it('negeert oude activiteit zonder verbinding met nu', () => {
    expect(berekenStreak(dagen(30, 31, 32), dagTerug)).toBe(0)
  })

  // ── Robuustheid ───────────────────────────────────────────────────────────
  it('telt dubbele datums maar één keer', () => {
    expect(berekenStreak([...dagen(0, 1), ...dagen(0, 1)], dagTerug)).toBe(2)
  })

  it('accepteert een Set net zo goed als een array', () => {
    expect(berekenStreak(new Set(dagen(0, 1, 2)), dagTerug)).toBe(3)
  })

  it('kijkt nooit verder terug dan maxDagen', () => {
    const aaneengesloten = Array.from({ length: 40 }, (_, i) => dagTerug(i))
    expect(berekenStreak(aaneengesloten, dagTerug, 10)).toBe(10)
    expect(berekenStreak(aaneengesloten, dagTerug, 90)).toBe(40)
  })

  it('kapt bij een open vandaag ook op maxDagen af', () => {
    // Gisteren t/m 39 dagen terug: de horizon telt vanaf vandaag (index 0),
    // dus maxDagen=10 levert de dagen 1 t/m 9 = 9 dagen.
    const zonderVandaag = Array.from({ length: 39 }, (_, i) => dagTerug(i + 1))
    expect(berekenStreak(zonderVandaag, dagTerug, 10)).toBe(9)
  })

  it('negeert datums buiten de reeks (ruis in de dataset)', () => {
    expect(berekenStreak([...dagen(0, 1), '2020-01-01'], dagTerug)).toBe(2)
  })
})
