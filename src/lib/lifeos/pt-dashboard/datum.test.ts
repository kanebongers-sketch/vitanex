import { describe, expect, test } from 'vitest'
import { geleden, relatief } from './datum'

describe('datum', () => {
  test('relatief (voor opvolgdatums): te laat, vandaag, morgen, later', () => {
    expect(relatief('2026-10-05', '2026-10-08')).toBe('3 dagen te laat')
    expect(relatief('2026-10-08', '2026-10-08')).toBe('vandaag')
    expect(relatief('2026-10-09', '2026-10-08')).toBe('morgen')
    expect(relatief('2026-10-20', '2026-10-08')).toBe('di 20 okt')
  })
  test('geleden (voor gesprekdatums): nooit "te laat"', () => {
    expect(geleden('2026-10-08', '2026-10-08')).toBe('vandaag')
    expect(geleden('2026-10-07', '2026-10-08')).toBe('gisteren')
    expect(geleden('2026-09-30', '2026-10-08')).toBe('wo 30 sep')
  })
})
