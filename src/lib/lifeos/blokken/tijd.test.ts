import { describe, expect, test } from 'vitest'
import { dagPlus, dagVan, opMoment, uurVan, weekVan, weekdag } from './tijd'

describe('Amsterdamse tijd', () => {
  test('zomertijd: 09:00 Amsterdam = 07:00 UTC', () => {
    expect(opMoment('2026-10-01', 9).toISOString()).toBe('2026-10-01T07:00:00.000Z')
  })
  test('wintertijd: 09:00 Amsterdam = 08:00 UTC', () => {
    expect(opMoment('2026-11-02', 9).toISOString()).toBe('2026-11-02T08:00:00.000Z')
  })
  test('dag en uur van een moment', () => {
    const m = new Date('2026-09-30T22:30:00Z') // 00:30 op 1 okt in Amsterdam
    expect(dagVan(m)).toBe('2026-10-01')
    expect(uurVan(m)).toBe(0.5)
  })
  test('weekrekenen', () => {
    expect(weekdag('2026-10-01')).toBe(4)
    expect(weekVan('2026-10-01')).toBe('2026-09-28')
    expect(weekVan('2026-10-04')).toBe('2026-09-28')
    expect(dagPlus('2026-10-31', 1)).toBe('2026-11-01')
  })
})
