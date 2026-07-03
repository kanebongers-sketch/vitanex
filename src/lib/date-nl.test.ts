import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  dagstartUtcNL,
  datumMinusDagenNL,
  huidigUurNL,
  toDateString,
  vandaagNL,
} from './date-nl'

/** Zet de klok op een vast UTC-moment; de functies rekenen zelf om naar NL-tijd. */
function zetKlokOp(isoUtc: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(isoUtc))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('vandaagNL', () => {
  test('geeft de datum als YYYY-MM-DD op een gewone wintermiddag', () => {
    // Arrange: 15 jan 12:00 UTC = 13:00 NL (wintertijd, UTC+1)
    zetKlokOp('2026-01-15T12:00:00Z')
    // Act & Assert
    expect(vandaagNL()).toBe('2026-01-15')
  })

  test('telt vlak na middernacht NL al als de nieuwe dag, terwijl het in UTC nog gisteren is (wintertijd)', () => {
    // Arrange: 23:30 UTC op de 15e = 00:30 NL op de 16e
    zetKlokOp('2026-01-15T23:30:00Z')
    // Act & Assert
    expect(vandaagNL()).toBe('2026-01-16')
  })

  test('telt vlak na middernacht NL al als de nieuwe dag in de zomertijd (UTC+2)', () => {
    // Arrange: 30 jun 22:30 UTC = 1 jul 00:30 NL
    zetKlokOp('2026-06-30T22:30:00Z')
    // Act & Assert
    expect(vandaagNL()).toBe('2026-07-01')
  })

  test('blijft vlak vóór middernacht NL nog de oude dag', () => {
    // Arrange: 22:30 UTC = 23:30 NL, nog 15 jan
    zetKlokOp('2026-01-15T22:30:00Z')
    // Act & Assert
    expect(vandaagNL()).toBe('2026-01-15')
  })
})

describe('datumMinusDagenNL', () => {
  test('0 dagen geleden is gelijk aan vandaagNL', () => {
    // Arrange: 1 jul 22:30 UTC = 2 jul 00:30 NL
    zetKlokOp('2026-07-01T22:30:00Z')
    // Act & Assert
    expect(datumMinusDagenNL(0)).toBe(vandaagNL())
    expect(datumMinusDagenNL(0)).toBe('2026-07-02')
  })

  test('rekent terug over een maandgrens heen in NL-tijd', () => {
    // Arrange: het is 2 jul 00:30 NL
    zetKlokOp('2026-07-01T22:30:00Z')
    // Act & Assert
    expect(datumMinusDagenNL(1)).toBe('2026-07-01')
    expect(datumMinusDagenNL(2)).toBe('2026-06-30')
  })

  test('rekent terug over een jaargrens heen in NL-tijd', () => {
    // Arrange: 31 dec 23:30 UTC = 1 jan 00:30 NL (wintertijd)
    zetKlokOp('2025-12-31T23:30:00Z')
    // Act & Assert
    expect(vandaagNL()).toBe('2026-01-01')
    expect(datumMinusDagenNL(1)).toBe('2025-12-31')
  })
})

describe('dagstartUtcNL', () => {
  test('begin van de dag in wintertijd is 23:00 UTC de dag ervoor', () => {
    // Arrange: 15 jan 13:00 NL (UTC+1)
    zetKlokOp('2026-01-15T12:00:00Z')
    // Act & Assert: 15 jan 00:00 NL = 14 jan 23:00 UTC
    expect(dagstartUtcNL()).toBe('2026-01-14T23:00:00.000Z')
  })

  test('begin van de dag in zomertijd is 22:00 UTC de dag ervoor', () => {
    // Arrange: 1 jul 14:00 NL (UTC+2)
    zetKlokOp('2026-07-01T12:00:00Z')
    // Act & Assert: 1 jul 00:00 NL = 30 jun 22:00 UTC
    expect(dagstartUtcNL()).toBe('2026-06-30T22:00:00.000Z')
  })

  test('vlak na middernacht NL ligt de dagstart maximaal een uur terug', () => {
    // Arrange: 1 jul 00:30 NL — de dagstart was 30 minuten geleden
    zetKlokOp('2026-06-30T22:30:00Z')
    // Act & Assert
    expect(dagstartUtcNL()).toBe('2026-06-30T22:00:00.000Z')
  })
})

describe('huidigUurNL', () => {
  test('geeft het NL-uur in de wintertijd (UTC+1)', () => {
    zetKlokOp('2026-01-15T12:00:00Z')
    expect(huidigUurNL()).toBe(13)
  })

  test('geeft het NL-uur in de zomertijd (UTC+2)', () => {
    zetKlokOp('2026-07-01T12:00:00Z')
    expect(huidigUurNL()).toBe(14)
  })

  test('geeft 0 vlak na middernacht NL, geen 24', () => {
    // Arrange: 23:30 UTC = 00:30 NL
    zetKlokOp('2026-01-15T23:30:00Z')
    expect(huidigUurNL()).toBe(0)
  })

  test('geeft 23 in het laatste uur van de NL-dag', () => {
    // Arrange: 22:30 UTC = 23:30 NL
    zetKlokOp('2026-01-15T22:30:00Z')
    expect(huidigUurNL()).toBe(23)
  })
})

describe('toDateString', () => {
  test('laat een YYYY-MM-DD string ongewijzigd', () => {
    expect(toDateString('2026-07-03')).toBe('2026-07-03')
  })

  test('kapt een ISO-timestamp af tot de datum', () => {
    expect(toDateString('2026-07-03T08:15:30.000Z')).toBe('2026-07-03')
  })
})
