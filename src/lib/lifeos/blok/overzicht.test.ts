import { describe, it, expect } from 'vitest'
import { bouwOverzicht, type AfgerondeSessie } from './overzicht'

// Het overzicht voedt zowel de voortgangsbalk als de evaluatie; een telfout hier
// laat Kane denken dat hij meer of minder deed dan waar. Daarom testen we de
// randgevallen: niks gedaan, alles gedaan, en sessies die NIET mogen meetellen.

const start = '2026-08-03' // maandag, week 1 begint hier

function sessie(blokWeek: number | null, sessieCode: string | null, voltooid = true): AfgerondeSessie {
  return { blokWeek, sessieCode, voltooidOp: voltooid ? '2026-08-10T10:00:00Z' : null }
}

describe('bouwOverzicht', () => {
  it('telt 6 loggbare sessies per week, 24 in het blok', () => {
    const o = bouwOverzicht(start, '2026-08-10', [])
    expect(o.weken).toHaveLength(4)
    expect(o.weken[0].totaal).toBe(6)
    expect(o.totaalGepland).toBe(24)
    expect(o.totaalGedaan).toBe(0)
  })

  it('markeert een afgeronde sessie als gedaan in de juiste week', () => {
    const o = bouwOverzicht(start, '2026-08-10', [sessie(2, 'upper_a')])
    const week2 = o.weken.find((w) => w.week === 2)
    expect(week2?.gedaan).toBe(1)
    expect(week2?.sessies.find((s) => s.code === 'upper_a')?.gedaan).toBe(true)
    // Dezelfde code in week 1 telt niet mee.
    expect(o.weken.find((w) => w.week === 1)?.gedaan).toBe(0)
  })

  it('negeert onafgeronde sessies en losse trainingen (code/week null)', () => {
    const o = bouwOverzicht(start, '2026-08-10', [
      sessie(1, 'lower_a', false), // niet afgerond
      sessie(1, null), // losse training
      sessie(null, 'upper_a'), // geen blokweek
    ])
    expect(o.totaalGedaan).toBe(0)
  })

  it('telt een volle week correct op', () => {
    const codes = ['upper_a', 'lower_a', 'zone2', 'upper_b', 'lower_b', 'hyrox']
    const o = bouwOverzicht(start, '2026-08-10', codes.map((c) => sessie(1, c)))
    expect(o.weken.find((w) => w.week === 1)?.gedaan).toBe(6)
    expect(o.totaalGedaan).toBe(6)
  })

  it('geeft de huidige week uit de datum', () => {
    expect(bouwOverzicht(start, '2026-08-10', []).huidigeWeek).toBe(2)
    expect(bouwOverzicht(start, '2026-09-20', []).huidigeWeek).toBeNull() // buiten het blok
  })
})
