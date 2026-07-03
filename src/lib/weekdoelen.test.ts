import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  berekenStreak,
  getMaandag,
  isVandaagGelogd,
  laadWeekSelectie,
  logVandaag,
  scoreKleur,
  scoreLabel,
  slaWeekSelectieOp,
  vandaag,
  type GoalLog,
  type WeekDoel,
  type WeekSelectie,
} from './weekdoelen'

const DATUM_FORMAAT = /^\d{4}-\d{2}-\d{2}$/

/** Formatteert een Date als YYYY-MM-DD in de lokale tijdzone (zelfde kalender als vandaag()). */
function ymdLokaal(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/** Lokale kalenderdatum N dagen vanaf 'nu' (fake time), als YYYY-MM-DD. */
function dagPlus(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return ymdLokaal(d)
}

function maakDoel(logs: GoalLog[]): WeekDoel {
  return {
    vlak: 'slaap',
    doel_titel: 'Voor 23:00 naar bed',
    doel_beschrijving: 'Elke avond op tijd naar bed voor betere slaap.',
    target_waarde: 5,
    eenheid: 'avonden',
    meetType: 'dagelijks',
    logs,
  }
}

beforeEach(() => {
  // Woensdag 1 juli 2026, midden op de dag (UTC) — zodat UTC- en NL-machines
  // dezelfde lokale kalenderdatum zien.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('vandaag', () => {
  test('geeft de lokale datum als YYYY-MM-DD met zero-padding', () => {
    // Arrange: 5 januari dwingt padding van maand én dag af
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'))
    // Act
    const resultaat = vandaag()
    // Assert
    expect(resultaat).toBe('2026-01-05')
    expect(resultaat).toMatch(DATUM_FORMAAT)
  })
})

describe('getMaandag', () => {
  test('geeft een geldige YYYY-MM-DD binnen de afgelopen week', () => {
    // Act
    const maandag = getMaandag()
    // Assert: nooit in de toekomst, nooit ouder dan een week
    expect(maandag).toMatch(DATUM_FORMAAT)
    expect(maandag <= vandaag()).toBe(true)
    expect(maandag >= dagPlus(-7)).toBe(true)
  })

  test('geeft dezelfde weekstart op woensdag en op de zondag van dezelfde week', () => {
    // Arrange & Act: woensdag 1 juli
    const opWoensdag = getMaandag()
    // Zondag 5 juli, zelfde week
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))
    const opZondag = getMaandag()
    // Assert
    expect(opZondag).toBe(opWoensdag)
  })

  test('geeft een nieuwe weekstart zodra de volgende week begint', () => {
    // Arrange & Act
    const dezeWeek = getMaandag()
    // Maandag 6 juli, volgende week
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'))
    const volgendeWeek = getMaandag()
    // Assert
    expect(volgendeWeek > dezeWeek).toBe(true)
  })
})

describe('berekenStreak', () => {
  /** Week ma t/m zo rond vandaag (woensdag = dagPlus(0)); binnen de test berekend zodat de fake timers al actief zijn. */
  function maakWeekDagen(): string[] {
    return [-2, -1, 0, 1, 2, 3, 4].map(dagPlus)
  }

  test('telt opeenvolgende gehaalde dagen tot en met vandaag', () => {
    // Arrange
    const weekDagen = maakWeekDagen()
    const doel = maakDoel([
      { datum: dagPlus(-2), gehaald: true },
      { datum: dagPlus(-1), gehaald: true },
      { datum: dagPlus(0), gehaald: true },
    ])
    // Act & Assert
    expect(berekenStreak(doel, weekDagen)).toBe(3)
  })

  test('een gat in de reeks breekt de streak', () => {
    // Arrange: eergisteren gehaald, gisteren niet gelogd, vandaag gehaald
    const weekDagen = maakWeekDagen()
    const doel = maakDoel([
      { datum: dagPlus(-2), gehaald: true },
      { datum: dagPlus(0), gehaald: true },
    ])
    // Act & Assert: alleen vandaag telt
    expect(berekenStreak(doel, weekDagen)).toBe(1)
  })

  test('vandaag nog niet gelogd geeft streak 0, ook al was gisteren gehaald', () => {
    // Arrange
    const weekDagen = maakWeekDagen()
    const doel = maakDoel([{ datum: dagPlus(-1), gehaald: true }])
    // Act & Assert: huidig gedrag — een ongelogde vandaag breekt de reeks
    expect(berekenStreak(doel, weekDagen)).toBe(0)
  })

  test('vandaag expliciet niet gehaald geeft streak 0', () => {
    // Arrange
    const weekDagen = maakWeekDagen()
    const doel = maakDoel([
      { datum: dagPlus(-1), gehaald: true },
      { datum: dagPlus(0), gehaald: false },
    ])
    // Act & Assert
    expect(berekenStreak(doel, weekDagen)).toBe(0)
  })

  test('dagen in de toekomst tellen niet mee', () => {
    // Arrange: morgen alvast (foutief) gelogd als gehaald
    const weekDagen = maakWeekDagen()
    const doel = maakDoel([
      { datum: dagPlus(-1), gehaald: true },
      { datum: dagPlus(0), gehaald: true },
      { datum: dagPlus(1), gehaald: true },
    ])
    // Act & Assert: alleen gisteren + vandaag
    expect(berekenStreak(doel, weekDagen)).toBe(2)
  })

  test('lege logs geven streak 0', () => {
    expect(berekenStreak(maakDoel([]), maakWeekDagen())).toBe(0)
  })

  test('lege weekDagen geven streak 0', () => {
    const doel = maakDoel([{ datum: dagPlus(0), gehaald: true }])
    expect(berekenStreak(doel, [])).toBe(0)
  })

  test('muteert de meegegeven weekDagen niet', () => {
    // Arrange
    const weekDagen = maakWeekDagen()
    const kopie = [...weekDagen]
    // Act
    berekenStreak(maakDoel([]), weekDagen)
    // Assert
    expect(weekDagen).toEqual(kopie)
  })
})

describe('isVandaagGelogd en logVandaag', () => {
  test('herkent een log van vandaag', () => {
    // Arrange
    const logVanVandaag: GoalLog = { datum: dagPlus(0), gehaald: true, notitie: 'ging goed' }
    const doel = maakDoel([{ datum: dagPlus(-1), gehaald: false }, logVanVandaag])
    // Act & Assert
    expect(isVandaagGelogd(doel)).toBe(true)
    expect(logVandaag(doel)).toEqual(logVanVandaag)
  })

  test('geeft false/undefined zonder log van vandaag', () => {
    // Arrange
    const doel = maakDoel([{ datum: dagPlus(-1), gehaald: true }])
    // Act & Assert
    expect(isVandaagGelogd(doel)).toBe(false)
    expect(logVandaag(doel)).toBeUndefined()
  })
})

describe('scoreKleur en scoreLabel', () => {
  test('scoregrenzen 16 / 12 / 8 bepalen kleur en label', () => {
    expect(scoreKleur(16)).toBe('var(--mf-green)')
    expect(scoreLabel(16)).toBe('Goed')
    expect(scoreKleur(12)).toBe('var(--mf-amber)')
    expect(scoreLabel(12)).toBe('Matig')
    expect(scoreKleur(8)).toBe('var(--mf-amber-dark)')
    expect(scoreLabel(8)).toBe('Aandacht')
    expect(scoreKleur(7)).toBe('var(--mf-red)')
    expect(scoreLabel(7)).toBe('Laag')
  })
})

describe('laadWeekSelectie en slaWeekSelectieOp', () => {
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

  function maakSelectie(weekStart: string): WeekSelectie {
    return {
      weekStart,
      doelen: [maakDoel([])],
      vlak_scores: { slaap: 10, stress: 14 },
    }
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', maakLocalStorageStub())
  })

  test('geeft null bij lege opslag', () => {
    expect(laadWeekSelectie()).toBeNull()
  })

  test('opslaan en laden binnen dezelfde week geeft de selectie terug', () => {
    // Arrange: weekStart 2,5 dagen geleden (nu = 2026-07-01T12:00Z)
    const selectie = maakSelectie('2026-06-29')
    // Act
    slaWeekSelectieOp(selectie)
    // Assert
    expect(laadWeekSelectie()).toEqual(selectie)
  })

  test('een selectie van een vorige week is verlopen en geeft null', () => {
    // Arrange: weekStart ruim 9 dagen geleden
    slaWeekSelectieOp(maakSelectie('2026-06-22'))
    // Act & Assert
    expect(laadWeekSelectie()).toBeNull()
  })

  test('een weekStart in de toekomst geeft null', () => {
    // Arrange
    slaWeekSelectieOp(maakSelectie('2026-07-03'))
    // Act & Assert
    expect(laadWeekSelectie()).toBeNull()
  })

  test('corrupte opslag geeft null in plaats van een exception', () => {
    // Arrange
    localStorage.setItem('mf-week-doelen-v2', 'geen-geldige-json{')
    // Act & Assert
    expect(laadWeekSelectie()).toBeNull()
  })
})
