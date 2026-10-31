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
  it('klopt alleen met het juiste wachtwoord, en elke hash is anders', async () => {
    const w = 'Tr4inen-op-dinsdag'
    const a = await hashWachtwoord(w)
    expect(a).toMatch(/^s2:32768:8:1:[0-9a-f]{32}:[0-9a-f]{64}$/)
    expect(a).not.toContain(w)
    expect(a).not.toBe(await hashWachtwoord(w))
    expect(await wachtwoordKlopt(w, a)).toBe(true)
    expect(await wachtwoordKlopt('Tr4inen-op-woensdag', a)).toBe(false)
    expect(await wachtwoordKlopt(w, null)).toBe(false)
    expect(await wachtwoordKlopt(w, 'kapot')).toBe(false)
    expect(await wachtwoordKlopt(w, 's2:999999999:8:1:aa:bb')).toBe(false)
  })

  it('een hash van de oude synchrone versie (scryptSync) klopt nog steeds', async () => {
    // Gemaakt met scryptSync, N 2^15, r 8, p 1, vaste salt: zo staan bestaande wachtwoorden in de database.
    const oud = 's2:32768:8:1:00112233445566778899aabbccddeeff:ea681a20b82c213ce624e0fa1ed5599b02b1df0588401a7b3ea9efbd4455794c'
    expect(await wachtwoordKlopt('Tr4inen-op-dinsdag', oud)).toBe(true)
    expect(await wachtwoordKlopt('Tr4inen-op-woensdag', oud)).toBe(false)
  })
})

describe('normaalEmail', () => {
  it('kleine letters zonder spaties, alleen geldige adressen', () => {
    expect(normaalEmail('  Mark@VoorbeeldGym.nl ')).toBe('mark@voorbeeldgym.nl')
    expect(normaalEmail('geen-adres')).toBeNull()
    expect(normaalEmail(5)).toBeNull()
  })
})
