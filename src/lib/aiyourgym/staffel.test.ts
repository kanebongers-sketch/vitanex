import { describe, expect, it } from 'vitest'
import { MAX_AUTOMATISCH, STAFFEL_GRENZEN, leesLedenSchatting, staffelVoor, stripeHoeveelheid, zelfdeStaffel } from './staffel'
import { staffelNaam } from './staffel-weergave'

describe('staffel kiezen per vestiging (besluit Kane 31-10-2026)', () => {
  it('de grenzen zijn vast en oplopend', () => {
    expect([...STAFFEL_GRENZEN]).toEqual([25, 50, 100, 200, 500, 1000, 5000])
    expect(MAX_AUTOMATISCH).toBe(5000)
  })
  it('een grens telt in zijn eigen staffel: 25 is tot 25, 26 is tot 50', () => {
    expect(staffelVoor(25)).toEqual({ soort: 'staffel', grens: 25, nummer: 1 })
    expect(staffelVoor(26)).toEqual({ soort: 'staffel', grens: 50, nummer: 2 })
    expect(staffelVoor(50)).toMatchObject({ grens: 50 })
    expect(staffelVoor(51)).toMatchObject({ grens: 100 })
    expect(staffelVoor(100)).toMatchObject({ grens: 100 })
    expect(staffelVoor(101)).toMatchObject({ grens: 200 })
    expect(staffelVoor(500)).toMatchObject({ grens: 500 })
    expect(staffelVoor(1000)).toMatchObject({ grens: 1000 })
    expect(staffelVoor(1001)).toMatchObject({ grens: 5000 })
    expect(staffelVoor(5000)).toMatchObject({ grens: 5000, nummer: 7 })
  })
  it('boven 5000 is prijs op maat; 0 telt als de eerste staffel; geen geheel getal is niets', () => {
    expect(staffelVoor(5001)).toEqual({ soort: 'op_maat' })
    expect(staffelVoor(0)).toMatchObject({ grens: 25 })
    expect(staffelVoor(-3)).toMatchObject({ grens: 25 })
    expect(staffelVoor(2.5)).toBeNull()
  })
  it('de hoeveelheid voor Stripe: het aantal, minimaal 1, boven 5000 niets automatisch', () => {
    expect(stripeHoeveelheid(0)).toBe(1)
    expect(stripeHoeveelheid(84)).toBe(84)
    expect(stripeHoeveelheid(5000)).toBe(5000)
    expect(stripeHoeveelheid(5001)).toBeNull()
    expect(stripeHoeveelheid(Number.NaN)).toBeNull()
  })
  it('zelfde staffel betekent zelfde bedrag', () => {
    expect(zelfdeStaffel(26, 50)).toBe(true)
    expect(zelfdeStaffel(25, 26)).toBe(false)
    expect(zelfdeStaffel(6000, 7000)).toBe(true)
    expect(zelfdeStaffel(5000, 6000)).toBe(false)
  })
  it('de schatting bij het aanmelden: alleen een grens of op maat', () => {
    expect(leesLedenSchatting('100')).toBe(100)
    expect(leesLedenSchatting(25)).toBe(25)
    expect(leesLedenSchatting('op_maat')).toBe('op_maat')
    expect(leesLedenSchatting(99)).toBeNull()
    expect(leesLedenSchatting('100 ')).toBe(100)
    expect(leesLedenSchatting('1e2')).toBeNull()
  })
  it('in woorden, NL en EN, zonder bedrag', () => {
    expect(staffelNaam(84, 'nl')).toBe('Tot 100 leden')
    expect(staffelNaam(1200, 'nl')).toBe('Tot 5.000 leden')
    expect(staffelNaam(1200, 'en')).toBe('Up to 5,000 members')
    expect(staffelNaam(6000, 'nl')).toMatch(/prijs op maat/)
    expect(staffelNaam(10, 'nl')).not.toMatch(/€|euro/i)
  })
})
