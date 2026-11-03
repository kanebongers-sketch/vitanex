import { describe, expect, it } from 'vitest'
import { leesAllesTonen, leesAllesTonenInvoer, metAllesTonen } from './alles-tonen'

describe('Alles tonen (ontwerp 03-11-2026)', () => {
  it('standaard uit: alleen een echte true telt', () => {
    expect(leesAllesTonen(null)).toBe(false)
    expect(leesAllesTonen({})).toBe(false)
    expect(leesAllesTonen({ menu: { alles_tonen: 'ja' } })).toBe(false)
    expect(leesAllesTonen({ menu: { alles_tonen: true } })).toBe(true)
  })

  it('zetten laat de andere instellingen staan', () => {
    const ruw = { ledenapp: { qr: false }, start: { stap: 3 }, menu: { iets: 1 } }
    const nieuw = metAllesTonen(ruw, true)
    expect(nieuw).toEqual({ ledenapp: { qr: false }, start: { stap: 3 }, menu: { iets: 1, alles_tonen: true } })
    expect(ruw.menu).toEqual({ iets: 1 })
    expect(leesAllesTonen(metAllesTonen(nieuw, false))).toBe(false)
    expect(metAllesTonen('onzin', true)).toEqual({ menu: { alles_tonen: true } })
  })

  it('invoer: alleen { aan: boolean }', () => {
    expect(leesAllesTonenInvoer({ aan: true })).toBe(true)
    expect(leesAllesTonenInvoer({ aan: false })).toBe(false)
    expect(leesAllesTonenInvoer({ aan: 'ja' })).toBeNull()
    expect(leesAllesTonenInvoer(null)).toBeNull()
  })
})
