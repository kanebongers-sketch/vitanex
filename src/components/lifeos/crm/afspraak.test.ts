import { describe, expect, it } from 'vitest'
import {
  bouwAfspraak,
  bouwHerinnering,
  HERINNERING_DUUR_MIN,
  momentOverDagen,
  momentVanInvoer,
  STANDAARD_DUUR_MIN,
} from './afspraak'

describe('bouwAfspraak', () => {
  it('maakt "Gesprek met [naam]" met de standaardduur', () => {
    const start = new Date('2026-07-20T09:00:00.000Z')
    const a = bouwAfspraak('Kane Bongers', start)
    expect(a.titel).toBe('Gesprek met Kane Bongers')
    expect(a.startOp).toBe('2026-07-20T09:00:00.000Z')
    expect(new Date(a.eindOp).getTime() - new Date(a.startOp).getTime()).toBe(STANDAARD_DUUR_MIN * 60_000)
  })

  it('respecteert een eigen duur en trimt de naam', () => {
    const a = bouwAfspraak('  Lisa  ', new Date('2026-07-20T09:00:00.000Z'), 60)
    expect(a.titel).toBe('Gesprek met Lisa')
    expect(new Date(a.eindOp).getTime() - new Date(a.startOp).getTime()).toBe(60 * 60_000)
  })
})

describe('bouwHerinnering', () => {
  it('maakt "Bel [naam]" met een kort blok', () => {
    const h = bouwHerinnering('Nico', new Date('2026-07-20T09:00:00.000Z'))
    expect(h.titel).toBe('Bel Nico')
    expect(new Date(h.eindOp).getTime() - new Date(h.startOp).getTime()).toBe(HERINNERING_DUUR_MIN * 60_000)
  })
})

describe('momentOverDagen', () => {
  it('telt dagen op vanaf vandaag, op het gevraagde uur (lokaal)', () => {
    const vandaag = new Date(2026, 6, 20, 15, 30)
    const m = momentOverDagen(vandaag, 7, 9)
    expect(m.getFullYear()).toBe(2026)
    expect(m.getMonth()).toBe(6)
    expect(m.getDate()).toBe(27)
    expect(m.getHours()).toBe(9)
    expect(m.getMinutes()).toBe(0)
  })
})

describe('momentVanInvoer', () => {
  it('combineert een geldige dag + tijd tot een lokaal moment', () => {
    const m = momentVanInvoer('2026-07-27', '14:30')
    expect(m).not.toBeNull()
    expect(m!.getDate()).toBe(27)
    expect(m!.getHours()).toBe(14)
    expect(m!.getMinutes()).toBe(30)
  })

  it('weigert onzin (fout formaat of ongeldige tijd)', () => {
    expect(momentVanInvoer('27-07-2026', '14:30')).toBeNull()
    expect(momentVanInvoer('2026-07-27', '9:5')).toBeNull()
    expect(momentVanInvoer('2026-07-27', '25:00')).toBeNull()
    expect(momentVanInvoer('', '')).toBeNull()
  })
})
