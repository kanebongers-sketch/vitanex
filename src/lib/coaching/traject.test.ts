import { describe, it, expect } from 'vitest'
import {
  huidigeWeekVanTraject,
  berekenHuidigeFaseId,
  alsTrajectStatus,
  type TrajectFase,
} from './traject'

describe('huidigeWeekVanTraject', () => {
  it('geeft week 1 op de startdatum zelf', () => {
    expect(huidigeWeekVanTraject('2026-01-01', new Date('2026-01-01T09:00:00'))).toBe(1)
  })

  it('telt exact 7 dagen als week 2', () => {
    expect(huidigeWeekVanTraject('2026-01-01', new Date('2026-01-08T00:00:00'))).toBe(2)
  })

  it('geeft ≤ 0 vóór de start (nog niet begonnen)', () => {
    expect(huidigeWeekVanTraject('2026-01-10', new Date('2026-01-01T00:00:00'))).toBeLessThanOrEqual(0)
  })

  it('geeft 0 bij een ongeldige datum', () => {
    expect(huidigeWeekVanTraject('geen-datum', new Date('2026-01-01T00:00:00'))).toBe(0)
  })
})

describe('berekenHuidigeFaseId', () => {
  const fases: TrajectFase[] = [
    { id: 'a', traject_id: 't', volgorde: 1, titel: 'F1', pijler: 'body', focus: null, week_van: 1, week_tot: 8 },
    { id: 'b', traject_id: 't', volgorde: 2, titel: 'F2', pijler: 'mind', focus: null, week_van: 9, week_tot: 16 },
    { id: 'c', traject_id: 't', volgorde: 3, titel: 'F3', pijler: 'performance', focus: null, week_van: null, week_tot: null },
  ]

  it('vindt de fase die het weeknummer bevat', () => {
    expect(berekenHuidigeFaseId(fases, 5)).toBe('a')
    expect(berekenHuidigeFaseId(fases, 9)).toBe('b')
  })

  it('geeft null vóór de start (week < 1)', () => {
    expect(berekenHuidigeFaseId(fases, 0)).toBeNull()
  })

  it('geeft null wanneer geen enkele fase het weeknummer dekt', () => {
    expect(berekenHuidigeFaseId(fases, 40)).toBeNull()
  })

  it('slaat fases zonder volledige week-range over', () => {
    // week 20 valt buiten a/b en c heeft geen range → null
    expect(berekenHuidigeFaseId(fases, 20)).toBeNull()
  })
})

describe('alsTrajectStatus', () => {
  it('laat geldige statuswaarden door', () => {
    expect(alsTrajectStatus('actief')).toBe('actief')
    expect(alsTrajectStatus('afgerond')).toBe('afgerond')
  })

  it('valt terug op de standaard bij onbekende invoer', () => {
    expect(alsTrajectStatus('onzin')).toBe('concept')
    expect(alsTrajectStatus(null, 'gepauzeerd')).toBe('gepauzeerd')
  })
})
