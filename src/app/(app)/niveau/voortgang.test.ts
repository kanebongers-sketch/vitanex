import { describe, expect, test } from 'vitest'
import {
  berekenWeekOverzicht, dagKey, laatsteWeken, momentumTekst, parseDatum, weekStart,
} from './voortgang'
import type { XPEvent } from '@/lib/xp/xp'

function event(datum: string): XPEvent {
  return { datum, xp: 15, reden: 'Dagelijkse doelregistratie', type: 'goal' }
}

// Woensdag 1 juli 2026 (week loopt ma 29 juni t/m zo 5 juli)
const NU = new Date(2026, 6, 1)

describe('dagKey', () => {
  test('formatteert lokale datum als YYYY-MM-DD met zero-padding', () => {
    expect(dagKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dagKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('parseDatum', () => {
  test('parseert YYYY-MM-DD als lokale datum', () => {
    const d = parseDatum('2026-07-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(1)
  })

  test('ongeldig formaat geeft Invalid Date', () => {
    expect(Number.isNaN(parseDatum('niet-een-datum').getTime())).toBe(true)
    expect(Number.isNaN(parseDatum('2026-07').getTime())).toBe(true)
  })
})

describe('weekStart', () => {
  test('midweek valt terug op maandag', () => {
    expect(dagKey(weekStart(new Date(2026, 6, 1)))).toBe('2026-06-29')
  })

  test('zondag hoort bij de maandag ervoor', () => {
    expect(dagKey(weekStart(new Date(2026, 6, 5)))).toBe('2026-06-29')
  })

  test('maandag blijft maandag', () => {
    expect(dagKey(weekStart(new Date(2026, 5, 29)))).toBe('2026-06-29')
  })
})

describe('berekenWeekOverzicht', () => {
  test('telt unieke actieve dagen in de huidige week', () => {
    const history = [
      event('2026-06-29'), event('2026-06-29'), // dubbel op één dag telt één keer
      event('2026-07-01'),
      event('2026-06-25'), // vorige week — telt hier niet mee
    ]
    const overzicht = berekenWeekOverzicht(history, null, NU)
    expect(overzicht.actieveDagen).toBe(2)
    expect(overzicht.dagen).toHaveLength(7)
    expect(overzicht.dagen[0]).toMatchObject({ label: 'ma', datum: '2026-06-29', actief: true })
    expect(overzicht.dagen[2]).toMatchObject({ label: 'wo', actief: true, isVandaag: true })
  })

  test('markeert dagen na vandaag als toekomst', () => {
    const overzicht = berekenWeekOverzicht([], null, NU)
    expect(overzicht.dagen.filter(d => d.inToekomst).map(d => d.label)).toEqual(['do', 'vr', 'za', 'zo'])
  })

  test('telt actieve dagen van vorige week apart', () => {
    const history = [event('2026-06-22'), event('2026-06-25'), event('2026-06-28')]
    expect(berekenWeekOverzicht(history, null, NU).vorigeWeekActieveDagen).toBe(3)
  })

  test('check-in in dezelfde week telt, vorige week niet', () => {
    expect(berekenWeekOverzicht([], '2026-06-30', NU).checkinDezeWeek).toBe(true)
    expect(berekenWeekOverzicht([], '2026-06-28', NU).checkinDezeWeek).toBe(false)
    expect(berekenWeekOverzicht([], null, NU).checkinDezeWeek).toBe(false)
  })
})

describe('laatsteWeken', () => {
  test('geeft 4 weken oudste-eerst inclusief de huidige', () => {
    const history = [event('2026-06-10'), event('2026-06-11'), event('2026-07-01')]
    const weken = laatsteWeken(history, NU)
    expect(weken).toHaveLength(4)
    expect(weken.map(w => w.start)).toEqual(['2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29'])
    expect(weken.map(w => w.actieveDagen)).toEqual([2, 0, 0, 1])
  })
})

describe('momentumTekst', () => {
  test('lege start blijft uitnodigend', () => {
    expect(momentumTekst(0, 0)).toContain('eerste stap')
  })

  test('groei wordt benoemd zonder overdrijving', () => {
    expect(momentumTekst(4, 2)).toContain('Meer dan vorige week (2 dagen)')
  })

  test('gelijk ritme en enkelvoud kloppen', () => {
    expect(momentumTekst(1, 1)).toContain('(1 dag)')
  })

  test('mindere week krijgt geen schuld-framing', () => {
    const tekst = momentumTekst(1, 5)
    expect(tekst).toContain('elke actieve dag telt')
    expect(tekst.toLowerCase()).not.toContain('helaas')
  })

  test('start na stille week benoemt de nieuwe start', () => {
    expect(momentumTekst(2, 0)).toContain('al begonnen')
  })
})
