import { describe, expect, test } from 'vitest'
import { FASES, MOMENTEN, TRAJECT_WEKEN, dezeWeek, faseVan, trajectStand, trajectWeek, verwachteMetingen, weekBereik } from './traject'

// Start op maandag 7 september 2026.
const START = '2026-09-07'

describe('trajectWeek', () => {
  test('vóór de start = week 0; startdag = week 1; dag 7 = week 2', () => {
    expect(trajectWeek(START, '2026-09-06')).toBe(0)
    expect(trajectWeek(START, START)).toBe(1)
    expect(trajectWeek(START, '2026-09-13')).toBe(1)
    expect(trajectWeek(START, '2026-09-14')).toBe(2)
  })
  test('loopt door voorbij week 13', () => {
    expect(trajectWeek(START, '2026-12-06')).toBe(13)
    expect(trajectWeek(START, '2026-12-07')).toBe(14)
  })
  test('over de zomertijdwissel heen blijft een week 7 dagen', () => {
    expect(trajectWeek('2026-10-19', '2026-10-26')).toBe(2)
  })
})

describe('fases en momenten', () => {
  test('de fases sluiten aan en dekken week 0 t/m 13', () => {
    expect(FASES[0].vanWeek).toBe(0)
    expect(FASES.at(-1)!.totWeek).toBe(TRAJECT_WEKEN)
    for (let i = 1; i < FASES.length; i++) expect(FASES[i].vanWeek).toBe(FASES[i - 1].totWeek + 1)
  })
  test('faseVan', () => {
    expect(faseVan(0)?.nr).toBe(1)
    expect(faseVan(4)?.nr).toBe(1)
    expect(faseVan(5)?.nr).toBe(2)
    expect(faseVan(9)?.nr).toBe(3)
    expect(faseVan(13)?.nr).toBe(3)
    expect(faseVan(14)).toBeNull()
  })
  test('meetmomenten: start, twee tussentijds, eind', () => {
    expect(MOMENTEN.filter((m) => m.meting).map((m) => [m.week, m.meting])).toEqual([[0, 'start'], [4, 'tussen'], [8, 'tussen'], [13, 'eind']])
  })
  test('weekBereik', () => {
    expect(weekBereik(START, 1)).toEqual({ van: START, tot: '2026-09-13' })
    expect(weekBereik(START, 5)).toEqual({ van: '2026-10-05', tot: '2026-10-11' })
  })
})

describe('dezeWeek', () => {
  test('week 0 = intake; week 1 = testen; gewone week = trainen; week 4 = trainen + check', () => {
    expect(dezeWeek(0)).toEqual(['Intake, nulmeting en foto’s'])
    expect(dezeWeek(1)).toEqual(['Cardio- en krachttest, eerste training'])
    expect(dezeWeek(2)).toEqual(['Trainen volgens het persoonlijke schema'])
    expect(dezeWeek(4)).toHaveLength(2)
    expect(dezeWeek(14)[0]).toMatch(/afgerond/)
  })
})

describe('trajectStand', () => {
  test('in week 5 (fase 2): bereik en het volgende moment is de test van deze week', () => {
    const s = trajectStand(START, '2026-10-08')
    expect(s).toMatchObject({ week: 5, afgerond: false, bereik: { van: '2026-10-05', tot: '2026-10-11' } })
    expect(s.fase?.nr).toBe(2)
    expect(s.volgende).toMatchObject({ moment: { week: 5, soort: 'test' }, van: '2026-10-05' })
  })
  test('vóór de start: week 0, geen bereik, volgende = week 1', () => {
    const s = trajectStand(START, '2026-09-01')
    expect(s).toMatchObject({ week: 0, bereik: null, volgende: { moment: { week: 1 }, van: START } })
  })
  test('na week 13: afgerond, geen volgend moment', () => {
    const s = trajectStand(START, '2027-01-04')
    expect(s).toMatchObject({ afgerond: true, fase: null, volgende: null })
  })
})

describe('verwachteMetingen', () => {
  test('groeit mee met het traject', () => {
    expect(verwachteMetingen(0)).toEqual({ start: 0, tussen: 0, eind: 0, weging: 0 })
    expect(verwachteMetingen(1)).toEqual({ start: 1, tussen: 0, eind: 0, weging: 0 })
    expect(verwachteMetingen(4)).toEqual({ start: 1, tussen: 0, eind: 0, weging: 0 })
    expect(verwachteMetingen(5)).toEqual({ start: 1, tussen: 1, eind: 0, weging: 0 })
    expect(verwachteMetingen(13)).toEqual({ start: 1, tussen: 2, eind: 0, weging: 0 })
    expect(verwachteMetingen(14)).toEqual({ start: 1, tussen: 2, eind: 1, weging: 0 })
  })
})
