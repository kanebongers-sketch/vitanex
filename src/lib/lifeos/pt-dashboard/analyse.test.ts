import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import { analyseer, bronAnalyse, funnel, isoWeek, maandagVan, weekReeks } from './analyse'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})

describe('weken', () => {
  test('maandag en ISO-weeknummer, ook rond de jaarwisseling', () => {
    expect(maandagVan('2026-10-08')).toBe('2026-10-05')
    expect(maandagVan('2026-10-11')).toBe('2026-10-05') // zondag hoort bij de week ervoor
    expect(maandagVan('2026-10-05')).toBe('2026-10-05')
    expect(isoWeek('2026-10-05')).toBe(41)
    expect(isoWeek('2025-12-29')).toBe(1) // valt in week 1 van 2026
    expect(isoWeek('2027-01-03')).toBe(53) // 2026 heeft 53 weken
    expect(isoWeek('2027-01-04')).toBe(1)
  })
})

describe('weekReeks', () => {
  test('8 weken t/m de huidige, oudste eerst; leads op gesprekdatum, klant = daarvan nu klant', () => {
    const r = weekReeks(
      [
        lead({ gesprokenOp: '2026-10-05', status: 'klant' }),
        lead({ gesprokenOp: '2026-10-08' }),
        lead({ gesprokenOp: '2026-10-04', status: 'klant' }), // zondag: vorige week
        lead({ gesprokenOp: '2026-08-16' }), // buiten bereik
        lead({ gesprokenOp: '2026-10-09' }), // toekomst telt niet
      ],
      '2026-10-08',
    )
    expect(r).toHaveLength(8)
    expect(r[0]).toEqual({ start: '2026-08-17', week: 34, leads: 0, klant: 0 })
    expect(r[7]).toEqual({ start: '2026-10-05', week: 41, leads: 2, klant: 1 })
    expect(r[6]).toEqual({ start: '2026-09-28', week: 40, leads: 1, klant: 1 })
    expect(r.reduce((n, p) => n + p.leads, 0)).toBe(3)
  })
  test('ander aantal weken en geen leads', () => {
    expect(weekReeks([], '2026-10-08', 3).map((p) => p.week)).toEqual([39, 40, 41])
    expect(weekReeks([], '2026-10-08', 0)).toEqual([])
  })
})

describe('funnel', () => {
  test('gesproken → proefles/intake/klant → klant, met percentages van alle leads', () => {
    const f = funnel([
      lead({ status: 'nieuw' }), lead({ status: 'proefles' }), lead({ status: 'intake' }),
      lead({ status: 'klant' }), lead({ status: 'geen_interesse' }), lead({ status: 'later' }),
    ])
    expect(f.map((s) => [s.sleutel, s.aantal, s.pct])).toEqual([['gesproken', 6, 100], ['in_gesprek', 3, 50], ['klant', 1, 17]])
  })
  test('zonder leads: nullen, geen verzonnen percentages', () => {
    expect(funnel([]).map((s) => [s.aantal, s.pct])).toEqual([[0, null], [0, null], [0, null]])
  })
})

describe('bronAnalyse', () => {
  test('alleen bronnen met leads, meeste eerst, gelijkspel op klant dan vaste volgorde', () => {
    const b = bronAnalyse([
      lead({ bron: 'social' }), lead({ bron: 'social', status: 'klant' }),
      lead({ bron: 'referral', status: 'klant' }), lead({ bron: 'referral', status: 'klant' }),
      lead({ bron: 'vloer' }), lead({ bron: 'bellen' }),
    ])
    expect(b.map((r) => [r.bron, r.aantal, r.klant, r.conversie])).toEqual([
      ['referral', 2, 2, 100], ['social', 2, 1, 50], ['vloer', 1, 0, 0], ['bellen', 1, 0, 0],
    ])
    expect(bronAnalyse([])).toEqual([])
  })
})

describe('analyseer', () => {
  test('bundelt weken, funnel en bronnen uit dezelfde leads', () => {
    const leads = [lead({ id: 'a', status: 'klant' }), lead({ id: 'b', bron: 'referral' })]
    const a = analyseer(leads, '2026-10-08', 4)
    expect(a.weken).toHaveLength(4)
    expect(a.weken.at(-1)).toMatchObject({ start: '2026-10-05', leads: 2, klant: 1 })
    expect(a.funnel).toEqual(funnel(leads))
    expect(a.bronnen).toEqual(bronAnalyse(leads))
  })
})
