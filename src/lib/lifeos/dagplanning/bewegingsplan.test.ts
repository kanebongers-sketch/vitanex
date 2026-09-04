import { describe, expect, test } from 'vitest'
import { kiesBewegingsblokken } from './bewegingsplan'
import type { Afspraak } from '../agenda/vrije-blokken'

// Lokale-tijd-Date's, net als `werkVenster` (setHours). Zo vallen de tests niet
// anders uit in een andere tijdzone dan de code zelf zou draaien.
function afspraak(startUur: number, eindUur: number, titel = 'Afspraak'): Afspraak {
  return {
    id: `${titel}-${startUur}`,
    titel,
    startOp: new Date(2026, 8, 7, startUur, 0), // ma 7 sep 2026
    eindOp: new Date(2026, 8, 7, eindUur, 0),
    heleDag: false,
    locatie: null,
  }
}

const DAG = new Date(2026, 8, 7)

function uur(d: Date): number {
  return d.getHours() + d.getMinutes() / 60
}

describe('kiesBewegingsblokken', () => {
  test('lege dag: sport ’s ochtends (90 min), wandeling erna (60 min), geen overlap', () => {
    const { sport, wandeling } = kiesBewegingsblokken([], DAG)

    expect(sport).not.toBeNull()
    expect(wandeling).not.toBeNull()
    if (!sport || !wandeling) return

    // Sport start aan het begin van het werkvenster (08:00) en duurt 90 min.
    expect(uur(sport.startOp)).toBe(8)
    expect((sport.eindOp.getTime() - sport.startOp.getTime()) / 60000).toBe(90)
    // Wandeling 60 min, en begint niet vóór de sport eindigt (geen overlap).
    expect((wandeling.eindOp.getTime() - wandeling.startOp.getTime()) / 60000).toBe(60)
    expect(wandeling.startOp.getTime()).toBeGreaterThanOrEqual(sport.eindOp.getTime())
  })

  test('volle ochtend: sport schuift naar de eerste vrije ruimte, niet in het verleden van de dag', () => {
    // 08:00–12:00 bezet → geen ochtendblok van 90 min; sport valt terug op 12:00.
    const { sport, wandeling } = kiesBewegingsblokken([afspraak(8, 12, 'Werken')], DAG)

    expect(sport).not.toBeNull()
    expect(wandeling).not.toBeNull()
    if (!sport || !wandeling) return
    expect(uur(sport.startOp)).toBe(12)
    expect(wandeling.startOp.getTime()).toBeGreaterThanOrEqual(sport.eindOp.getTime())
  })

  test('volle dag: niets in te plannen, geen gok', () => {
    const { sport, wandeling } = kiesBewegingsblokken([afspraak(8, 20, 'Vol')], DAG)
    expect(sport).toBeNull()
    expect(wandeling).toBeNull()
  })

  test('respecteert `nu`: plant niets vóór het huidige moment', () => {
    // Cron draait om 10:00 → sport niet meer om 08:00, maar vanaf 10:00.
    const nu = new Date(2026, 8, 7, 10, 0)
    const { sport } = kiesBewegingsblokken([], DAG, nu)
    expect(sport).not.toBeNull()
    if (sport) expect(sport.startOp.getTime()).toBeGreaterThanOrEqual(nu.getTime())
  })
})
