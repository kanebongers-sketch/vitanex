import { describe, expect, test } from 'vitest'
import type { GoalLog, WeekDoel, WeekHistorieEntry } from '@/lib/doelen/weekdoelen'
import {
  doelmomentenTekst, telHistorieGehaald, telWeekMomenten, vorigeWeek, vorigeWeekTekst,
} from './weekdoelen-blok'

function maakDoel(logs: GoalLog[]): WeekDoel {
  return {
    vlak: 'slaap',
    doel_titel: 'Voor 23:00 naar bed',
    doel_beschrijving: 'Elke avond op tijd naar bed.',
    target_waarde: 8,
    eenheid: 'uur',
    meetType: 'dagelijks',
    logs,
  }
}

function maakHistorieEntry(weekStart: string, gehaald: number[]): WeekHistorieEntry {
  return {
    weekStart,
    doelen: gehaald.map(aantal => ({
      vlak: 'stress',
      doel_titel: 'Avondwandeling',
      target_waarde: 30,
      eenheid: 'minuten',
      gehaald: aantal,
    })),
  }
}

describe('telWeekMomenten', () => {
  test('telt gelogde momenten en gehaalde momenten over alle doelen op', () => {
    // Arrange: doel A 2 van 3 gehaald, doel B 1 van 1 gehaald
    const doelen = [
      maakDoel([
        { datum: '2026-06-29', gehaald: true },
        { datum: '2026-06-30', gehaald: false },
        { datum: '2026-07-01', gehaald: true },
      ]),
      maakDoel([{ datum: '2026-06-29', gehaald: true }]),
    ]
    // Act
    const resultaat = telWeekMomenten(doelen)
    // Assert
    expect(resultaat).toEqual({ gehaald: 3, gelogd: 4 })
  })

  test('geeft nullen bij doelen zonder logs', () => {
    expect(telWeekMomenten([maakDoel([]), maakDoel([])])).toEqual({ gehaald: 0, gelogd: 0 })
  })

  test('geeft nullen bij een lege doelenlijst', () => {
    expect(telWeekMomenten([])).toEqual({ gehaald: 0, gelogd: 0 })
  })

  test('muteert de meegegeven doelen niet', () => {
    // Arrange
    const doelen = [maakDoel([{ datum: '2026-06-29', gehaald: true }])]
    const kopie = structuredClone(doelen)
    // Act
    telWeekMomenten(doelen)
    // Assert
    expect(doelen).toEqual(kopie)
  })
})

describe('telHistorieGehaald', () => {
  test('somt de gehaalde momenten van alle doelen in een afgeronde week', () => {
    expect(telHistorieGehaald(maakHistorieEntry('2026-06-22', [2, 0, 3]))).toBe(5)
  })

  test('geeft 0 bij een week zonder doelen', () => {
    expect(telHistorieGehaald(maakHistorieEntry('2026-06-22', []))).toBe(0)
  })
})

describe('vorigeWeek', () => {
  test('geeft de nieuwste afgeronde week terug (historie is nieuwste eerst)', () => {
    // Arrange
    const historie = [
      maakHistorieEntry('2026-06-22', [3]),
      maakHistorieEntry('2026-06-15', [1]),
    ]
    // Act & Assert
    expect(vorigeWeek(historie, '2026-06-29')?.weekStart).toBe('2026-06-22')
  })

  test('slaat een entry met de actieve weekStart defensief over', () => {
    // Arrange: actieve week staat (onverwacht) ook in de historie
    const historie = [
      maakHistorieEntry('2026-06-29', [2]),
      maakHistorieEntry('2026-06-22', [4]),
    ]
    // Act & Assert
    expect(vorigeWeek(historie, '2026-06-29')?.weekStart).toBe('2026-06-22')
  })

  test('geeft null bij een lege historie', () => {
    expect(vorigeWeek([], '2026-06-29')).toBeNull()
  })

  test('werkt zonder actieve week (geen selectie deze week)', () => {
    const historie = [maakHistorieEntry('2026-06-22', [3])]
    expect(vorigeWeek(historie)?.weekStart).toBe('2026-06-22')
  })
})

describe('doelmomentenTekst', () => {
  test('meervoud bij meerdere gelogde momenten', () => {
    expect(doelmomentenTekst({ gehaald: 3, gelogd: 7 }))
      .toBe('3 van 7 doelmomenten gehaald deze week')
  })

  test('enkelvoud bij precies één gelogd moment', () => {
    expect(doelmomentenTekst({ gehaald: 1, gelogd: 1 }))
      .toBe('1 van 1 doelmoment gehaald deze week')
  })
})

describe('vorigeWeekTekst', () => {
  test('geeft null bij 0 gehaald — geen vergelijking, geen nullen', () => {
    expect(vorigeWeekTekst(0)).toBeNull()
  })

  test('enkelvoud bij 1 gehaald moment', () => {
    expect(vorigeWeekTekst(1)).toBe('Vorige week: 1 doelmoment gehaald.')
  })

  test('meervoud bij meerdere gehaalde momenten', () => {
    expect(vorigeWeekTekst(4)).toBe('Vorige week: 4 doelmomenten gehaald.')
  })
})
