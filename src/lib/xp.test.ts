import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { laadXPData, verwerkCheckin, verwerkGoalLog } from './xp'

/** Minimale in-memory localStorage voor de node-environment. */
function maakLocalStorageStub() {
  const opslag = new Map<string, string>()
  return {
    getItem: (sleutel: string) => opslag.get(sleutel) ?? null,
    setItem: (sleutel: string, waarde: string) => {
      opslag.set(sleutel, waarde)
    },
    removeItem: (sleutel: string) => {
      opslag.delete(sleutel)
    },
    clear: () => {
      opslag.clear()
    },
  }
}

/** Lokale YYYY-MM-DD van een Date — onafhankelijke referentie-berekening. */
function ymdLokaal(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

beforeEach(() => {
  vi.stubGlobal('localStorage', maakLocalStorageStub())
  vi.stubGlobal('window', {})
  vi.useFakeTimers()
  // Woensdag 1 juli 2026, midden op de dag (UTC) — zodat UTC- en NL-machines
  // dezelfde lokale kalenderdatum zien.
  vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('verwerkCheckin — datumafleiding', () => {
  test('gebruikt vlak na middernacht de LOKALE kalenderdag, niet de UTC-dag', () => {
    // Arrange: 30 jun 22:30 UTC = 1 jul 00:30 NL. Op een NL-machine zou de
    // oude toISOString()-afleiding hier '2026-06-30' opleveren; de lokale
    // dag is '2026-07-01'. De verwachting rekent met dezelfde lokale kalender
    // als de machine waarop de test draait, zodat de test overal slaagt maar
    // op niet-UTC-machines een regressie naar UTC direct afvangt.
    vi.setSystemTime(new Date('2026-06-30T22:30:00Z'))
    const verwachteDag = ymdLokaal(new Date())
    // Act
    const resultaat = verwerkCheckin(3.0)
    // Assert
    expect(resultaat.xpData.lastCheckinDatum).toBe(verwachteDag)
    expect(resultaat.xpData.history[0].datum).toBe(verwachteDag)
  })
})

describe('verwerkCheckin — weekritme', () => {
  test('eerste check-in geeft basis-XP plus de eerste-stap achievement', () => {
    // Act
    const resultaat = verwerkCheckin(3.0)
    // Assert: 75 basis + 50 achievement 'eerste_checkin'
    expect(resultaat.xpGewonnen).toBe(125)
    expect(resultaat.xpData.checkinCount).toBe(1)
    expect(resultaat.nieuweAchievements.map(a => a.id)).toEqual(['eerste_checkin'])
  })

  test('tweede check-in in dezelfde week geeft geen extra XP', () => {
    // Arrange: check-in op woensdag
    verwerkCheckin(3.0)
    // Act: nogmaals op zondag 5 juli, zelfde week
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))
    const resultaat = verwerkCheckin(3.0)
    // Assert
    expect(resultaat.xpGewonnen).toBe(0)
    expect(resultaat.xpData.checkinCount).toBe(1)
  })

  test('een check-in in de volgende week geeft opnieuw XP', () => {
    // Arrange: check-in op woensdag 1 juli
    verwerkCheckin(3.0)
    // Act: maandag 6 juli, nieuwe week
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'))
    const resultaat = verwerkCheckin(3.0)
    // Assert
    expect(resultaat.xpGewonnen).toBe(75)
    expect(resultaat.xpData.checkinCount).toBe(2)
  })
})

describe('verwerkGoalLog — dagritme', () => {
  test('eerste doelregistratie van de dag geeft 15 XP, een tweede niets', () => {
    // Act
    const eerste = verwerkGoalLog(1)
    const tweede = verwerkGoalLog(2)
    // Assert
    expect(eerste.xpGewonnen).toBe(15)
    expect(tweede.xpGewonnen).toBe(0)
  })

  test('de volgende dag telt als nieuwe registratiedag', () => {
    // Arrange
    verwerkGoalLog(1)
    // Act: donderdag 2 juli
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'))
    const resultaat = verwerkGoalLog(2)
    // Assert
    expect(resultaat.xpGewonnen).toBe(15)
  })

  test('registreert vlak na middernacht onder de lokale kalenderdag', () => {
    // Arrange: 30 jun 22:30 UTC = 1 jul 00:30 NL (zie toelichting hierboven)
    vi.setSystemTime(new Date('2026-06-30T22:30:00Z'))
    const verwachteDag = ymdLokaal(new Date())
    // Act
    const resultaat = verwerkGoalLog(1)
    // Assert
    expect(resultaat.xpData.lastGoalLogDatum).toBe(verwachteDag)
    expect(laadXPData().history[0].datum).toBe(verwachteDag)
  })
})
