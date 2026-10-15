import { describe, expect, it } from 'vitest'
import { bezettingPerLestype, bezettingPerTijdslot, geweestVoor, telPerLes, wachtlijstdruk, type LesBasis } from './lessen'
import { lesDagen, lesSomIn } from './lesdagen'

const les = (id: string, lestype: string, start: string, capaciteit = 10, geannuleerd = false): LesBasis => ({
  id,
  vestiging: 'budel',
  lestype,
  start: new Date(start),
  capaciteit,
  geannuleerd,
})

describe('lescijfers', () => {
  const lessen = telPerLes(
    [les('a', 'Spinning', '2026-10-12T05:00:00Z', 4), les('b', 'Yoga', '2026-10-12T17:00:00Z', 10), les('c', 'Spinning', '2026-10-20T05:00:00Z', 2), les('d', 'Yoga', '2026-10-11T17:00:00Z', 10, true)],
    [
      { lesId: 'a', status: 'aanwezig' },
      { lesId: 'a', status: 'aanwezig' },
      { lesId: 'a', status: 'no_show' },
      { lesId: 'a', status: 'geannuleerd' },
      { lesId: 'b', status: 'aanwezig' },
      { lesId: 'c', status: 'geboekt' },
      { lesId: 'c', status: 'geboekt' },
      { lesId: 'c', status: 'wachtlijst' },
      { lesId: 'x', status: 'geboekt' },
    ],
  )
  const nu = new Date('2026-10-14T10:00:00Z')

  it('telt reserveringen per les op status', () => {
    expect(lessen.find((l) => l.id === 'a')).toMatchObject({ bezet: 3, aanwezig: 2, noShow: 1, wachtlijst: 0 })
  })

  it('rekent bezetting en no-show over lessen die geweest zijn', () => {
    const geweest = geweestVoor(lessen, nu)
    expect(geweest.map((l) => l.id)).toEqual(['a', 'b'])
    const t = lesSomIn(lesDagen(geweest, nu), { van: '2026-10-01', tot: '2026-10-31' }, null)
    expect(t.bezetting).toBeCloseTo(4 / 14)
    expect(t.noShowAandeel).toBeCloseTo(1 / 4)
    expect(bezettingPerLestype(geweest)[0]).toMatchObject({ label: 'Spinning', bezetting: 0.75 })
    expect(bezettingPerTijdslot(geweest).map((g) => g.label)).toEqual(['07:00', '19:00'])
  })

  it('meet wachtlijstdruk op komende lessen', () => {
    const komend = lessen.filter((l) => l.start > nu)
    expect(wachtlijstdruk(komend)).toMatchObject({ lessen: 1, vol: 1, metWachtlijst: 1, wachtenden: 1 })
  })

  it('geeft geen no-show percentage zonder afgeronde reserveringen', () => {
    expect(lesSomIn([], { van: '2026-10-01', tot: '2026-10-31' }, null).noShowAandeel).toBeNull()
  })
})

describe('lessen per dag', () => {
  it('telt alleen gehouden lessen en kapt geboekt af op de capaciteit', () => {
    const lessen = telPerLes(
      [les('a', 'Spinning', '2026-10-12T05:00:00Z', 2), les('b', 'Yoga', '2026-10-12T17:00:00Z', 10), les('c', 'Yoga', '2026-10-13T17:00:00Z', 10, true), les('d', 'Yoga', '2026-10-20T17:00:00Z')],
      [
        { lesId: 'a', status: 'aanwezig' },
        { lesId: 'a', status: 'aanwezig' },
        { lesId: 'a', status: 'no_show' },
        { lesId: 'b', status: 'aanwezig' },
      ],
    )
    const dagen = lesDagen(lessen, new Date('2026-10-14T10:00:00Z'))
    expect(dagen).toEqual([{ vestiging: 'budel', dag: '2026-10-12', lessen: 2, capaciteit: 12, bezet: 3, aanwezig: 3, noShow: 1 }])
    const som = lesSomIn(dagen, { van: '2026-10-01', tot: '2026-10-31' }, null)
    expect(som.bezetting).toBeCloseTo(3 / 12)
    expect(som.noShowAandeel).toBeCloseTo(1 / 4)
    expect(lesSomIn(dagen, { van: '2026-09-01', tot: '2026-09-30' }, null)).toMatchObject({ lessen: 0, bezetting: null, noShowAandeel: null })
    expect(lesSomIn(dagen, { van: '2026-10-01', tot: '2026-10-31' }, new Set(['eersel'] as const)).lessen).toBe(0)
  })
})
