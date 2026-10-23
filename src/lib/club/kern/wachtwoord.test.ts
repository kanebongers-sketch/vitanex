import { describe, expect, it } from 'vitest'
import { hashWachtwoord, normaalEmail, wachtwoordFout, wachtwoordKlopt } from './wachtwoord'

describe('wachtwoordFout', () => {
  it('sterk: lang en gevarieerd, of een lange zin', () => {
    expect(wachtwoordFout('Tr4inen-op-dinsdag')).toBeNull()
    expect(wachtwoordFout('blauwe kat rent naar huis')).toBeNull()
  })
  it('te kort, te lang of leeg', () => {
    expect(wachtwoordFout('Ab1!xyz')).toMatch(/minstens 12/)
    expect(wachtwoordFout('a'.repeat(129))).toMatch(/hooguit/)
    expect(wachtwoordFout('')).toMatch(/Kies/)
    expect(wachtwoordFout(null)).toMatch(/Kies/)
  })
  it('makkelijk te raden', () => {
    expect(wachtwoordFout('Wachtwoord2026!')).toMatch(/te makkelijk/)
    expect(wachtwoordFout('aaaaaaaaaaaaaaaa')).toMatch(/verschillende/)
    expect(wachtwoordFout('Q9!zz123456789x')).toMatch(/te makkelijk/)
  })
  it('naam of e-mail erin: nee', () => {
    expect(wachtwoordFout('Mark-traint-elke-dag7', { naam: 'Mark de Vries' })).toMatch(/naam of e-mailadres/)
    expect(wachtwoordFout('xx-bakkerij7-77!Q', { email: 'bakkerij7@mail.nl' })).toMatch(/naam of e-mailadres/)
  })
  it('kort zonder variatie: nee', () => {
    expect(wachtwoordFout('kortezinnetje')).toMatch(/16 tekens/)
  })
})

describe('hash', () => {
  it('klopt alleen met het juiste wachtwoord, en elke hash is anders', () => {
    const w = 'Tr4inen-op-dinsdag'
    const a = hashWachtwoord(w)
    expect(a).not.toContain(w)
    expect(a).not.toBe(hashWachtwoord(w))
    expect(wachtwoordKlopt(w, a)).toBe(true)
    expect(wachtwoordKlopt('Tr4inen-op-woensdag', a)).toBe(false)
    expect(wachtwoordKlopt(w, null)).toBe(false)
    expect(wachtwoordKlopt(w, 'kapot')).toBe(false)
    expect(wachtwoordKlopt(w, 's2:999999999:8:1:aa:bb')).toBe(false)
  })
})

describe('normaalEmail', () => {
  it('kleine letters zonder spaties, alleen geldige adressen', () => {
    expect(normaalEmail('  Mark@VoorbeeldGym.nl ')).toBe('mark@voorbeeldgym.nl')
    expect(normaalEmail('geen-adres')).toBeNull()
    expect(normaalEmail(5)).toBeNull()
  })
})
