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

/** Afspraak met minuutprecisie, om een "rommelig" vrij gat te maken. */
function afspraakM(sU: number, sM: number, eU: number, eM: number, titel = 'Afspraak'): Afspraak {
  return {
    id: `${titel}-${sU}:${sM}`,
    titel,
    startOp: new Date(2026, 8, 7, sU, sM),
    eindOp: new Date(2026, 8, 7, eU, eM),
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

  test('rondt de starttijd af naar een heel of half uur', () => {
    // Afspraak eindigt op 09:07 → het vrije gat begint rommelig; sport moet op
    // een net tijdstip (09:30) staan, niet op 09:07.
    const { sport, wandeling } = kiesBewegingsblokken([afspraakM(8, 0, 9, 7, 'Call')], DAG)

    expect(sport).not.toBeNull()
    if (sport) {
      expect([0, 30]).toContain(sport.startOp.getMinutes())
      expect(uur(sport.startOp)).toBe(9.5)
    }
    // Ook de wandeling staat op een net tijdstip.
    if (wandeling) expect([0, 30]).toContain(wandeling.startOp.getMinutes())
  })

  test('respecteert `nu`: plant niets vóór het huidige moment', () => {
    // Cron draait om 10:00 → sport niet meer om 08:00, maar vanaf 10:00.
    const nu = new Date(2026, 8, 7, 10, 0)
    const { sport } = kiesBewegingsblokken([], DAG, nu)
    expect(sport).not.toBeNull()
    if (sport) expect(sport.startOp.getTime()).toBeGreaterThanOrEqual(nu.getTime())
  })

  test('wandeling komt ná de sport, ook als er vóór de sport een gat is (echte dag 22-09)', () => {
    // Mail om 11:42; om 13:00 een overleg van 30 min. Sport past niet om 12:00
    // (zou tot 13:30 lopen) → 13:30–15:00. Het gat 12:00–13:00 past wel een
    // wandeling, maar die hoort ná de sport.
    const nu = new Date(2026, 8, 7, 11, 42)
    const { sport, wandeling } = kiesBewegingsblokken([afspraakM(13, 0, 13, 30, 'Ruben en Marit')], DAG, nu)

    expect(sport && uur(sport.startOp)).toBe(13.5)
    expect(wandeling).not.toBeNull()
    expect(wandeling!.startOp.getTime()).toBeGreaterThanOrEqual(sport!.eindOp.getTime())
  })

  test('is er na de sport geen ruimte meer, dan valt de wandeling terug op eerder', () => {
    // Vrij: 10:00–11:00 (past wandeling, geen sport) en 18:30–20:00 (sport).
    const { sport, wandeling } = kiesBewegingsblokken(
      [afspraak(8, 10, 'Ochtend'), afspraakM(11, 0, 18, 30, 'Dag')],
      DAG,
    )
    expect(sport && uur(sport.startOp)).toBe(18.5)
    expect(wandeling && uur(wandeling.startOp)).toBe(10)
  })

  test('eigen training in de agenda → geen extra sportblok, wandeling erna (echte dag 25-09)', () => {
    const { sport, wandeling } = kiesBewegingsblokken([afspraak(14, 15, 'Rick gym')], DAG)
    expect(sport).toBeNull()
    expect(wandeling && uur(wandeling.startOp)).toBeGreaterThanOrEqual(15)
  })

  test('het eigen sportblok van een eerdere run telt ook als training', () => {
    const { sport } = kiesBewegingsblokken([afspraakM(9, 0, 10, 30, 'Sporten (incl. reistijd)')], DAG)
    expect(sport).toBeNull()
  })

  test('een PT-sessie met een klant is geen eigen training', () => {
    const { sport } = kiesBewegingsblokken([afspraak(9, 10, 'Kevin PT'), afspraak(10, 11, 'Personal training Sanne')], DAG)
    expect(sport).not.toBeNull()
  })
})
