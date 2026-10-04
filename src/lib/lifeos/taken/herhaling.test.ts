import { describe, expect, test } from 'vitest'
import { isHerhaalRegel, schuifDeadline, volgendeKeer } from './herhaling'

// wo 30 sep 2026
const VANDAAG = '2026-09-30'

describe('volgendeKeer', () => {
  test('wekelijks blijft op dezelfde weekdag', () => {
    expect(volgendeKeer('wekelijks', '2026-09-28', VANDAAG)).toBe('2026-10-05') // ma → ma
  })

  test('loopt achterstand in tot na vandaag, zonder inhaal-reeks', () => {
    expect(volgendeKeer('wekelijks', '2026-09-07', VANDAAG)).toBe('2026-10-05')
    expect(volgendeKeer('dagelijks', '2026-09-01', VANDAAG)).toBe('2026-10-01')
  })

  test('werkdagen slaat het weekend over', () => {
    expect(volgendeKeer('werkdagen', '2026-10-02', '2026-10-02')).toBe('2026-10-05') // vr → ma
  })

  test('maandelijks houdt de dag, of de laatste dag van een kortere maand', () => {
    expect(volgendeKeer('maandelijks', '2026-09-15', VANDAAG)).toBe('2026-10-15')
    expect(volgendeKeer('maandelijks', '2027-01-31', '2027-01-31')).toBe('2027-02-28')
  })

  test('tweewekelijks', () => {
    expect(volgendeKeer('tweewekelijks', '2026-09-30', VANDAAG)).toBe('2026-10-14')
  })

  test('zonder geplande dag rekent hij vanaf vandaag', () => {
    expect(volgendeKeer('dagelijks', null, VANDAAG)).toBe('2026-10-01')
  })
})

describe('schuifDeadline', () => {
  test('schuift evenveel mee als de geplande dag', () => {
    expect(schuifDeadline('2026-10-02', '2026-09-28', '2026-10-05')).toBe('2026-10-09')
  })

  test('geen deadline of geen dag → geen deadline', () => {
    expect(schuifDeadline(null, '2026-09-28', '2026-10-05')).toBeNull()
    expect(schuifDeadline('2026-10-02', null, '2026-10-05')).toBeNull()
  })
})

describe('isHerhaalRegel', () => {
  test('alleen de bekende regels', () => {
    expect(isHerhaalRegel('wekelijks')).toBe(true)
    expect(isHerhaalRegel('jaarlijks')).toBe(false)
    expect(isHerhaalRegel(3)).toBe(false)
  })
})
