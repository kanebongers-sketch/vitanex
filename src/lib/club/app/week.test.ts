import { describe, expect, it } from 'vitest'
import { weekVoortgang } from './week'

describe('trainingen deze week', () => {
  // Woensdag 14 oktober 2026, 12:00 in Nederland.
  const nu = new Date('2026-10-14T10:00:00Z')

  it('telt van maandag tot en met zondag, tegen het aantal schemadagen', () => {
    const logs = [{ op: '2026-10-12T06:00:00Z' }, { op: '2026-10-13T18:00:00Z' }, { op: '2026-10-11T20:00:00Z' }, { op: '2026-10-18T21:30:00Z' }]
    expect(weekVoortgang(logs, 3, nu)).toEqual({ gedaan: 3, doel: 3 })
  })

  it('telt een net afgeronde training mee en houdt het doel tussen 1 en 7', () => {
    expect(weekVoortgang([], 0, nu, 1)).toEqual({ gedaan: 1, doel: 1 })
    expect(weekVoortgang([], 9, nu)).toEqual({ gedaan: 0, doel: 7 })
  })

  it('zondagavond laat in Nederland hoort nog bij deze week', () => {
    expect(weekVoortgang([{ op: '2026-10-18T22:30:00Z' }], 3, nu).gedaan).toBe(0)
  })
})
