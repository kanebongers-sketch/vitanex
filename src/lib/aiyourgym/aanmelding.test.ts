import { describe, expect, it } from 'vitest'
import { isRobot, leesAanmelding, leesEmail, leesTelefoon, maxVestigingenVoor } from './aanmelding'

const goed = {
  pakket: 'club',
  sportschoolNaam: '  Sterk   Gym ',
  aantalVestigingen: 2,
  slug: 'Sterkgym',
  eigenaarNaam: 'Sanne de Vries',
  eigenaarEmail: 'Sanne@Voorbeeld.nl',
  eigenaarTelefoon: '+31 6 12345678',
  wachtwoord: 'Blauwe-kat-rent-7',
  akkoord: true,
}

describe('leesAanmelding', () => {
  it('maakt goede invoer schoon', () => {
    expect(leesAanmelding(goed)).toEqual({
      ok: true,
      waarde: { pakket: 'club', sportschoolNaam: 'Sterk Gym', aantalVestigingen: 2, slug: 'sterkgym', eigenaarNaam: 'Sanne de Vries', eigenaarEmail: 'sanne@voorbeeld.nl', eigenaarTelefoon: '+31 6 12345678', wachtwoord: 'Blauwe-kat-rent-7' },
    })
  })
  it('geeft per veld een fout', () => {
    const uit = leesAanmelding({})
    expect(uit.ok).toBe(false)
    if (uit.ok) return
    expect(Object.keys(uit.fouten).sort()).toEqual(['aantalVestigingen', 'akkoord', 'eigenaarEmail', 'eigenaarNaam', 'eigenaarTelefoon', 'pakket', 'slug', 'sportschoolNaam', 'wachtwoord'])
  })
  it('wachtwoord: sterk genoeg, zonder eigen naam, en de herhaling moet gelijk zijn', () => {
    const fout = (extra: Record<string, unknown>) => {
      const uit = leesAanmelding({ ...goed, ...extra })
      return uit.ok ? null : uit.fouten
    }
    expect(fout({ wachtwoord: 'kort' })?.wachtwoord).toMatch(/minstens/)
    expect(fout({ wachtwoord: 'Sanne-traint-veel-7' })?.wachtwoord).toMatch(/naam of e-mailadres/)
    expect(fout({ wachtwoordHerhaal: 'iets-anders-dan-dit' })?.wachtwoordHerhaal).toMatch(/niet gelijk/)
    expect(fout({ wachtwoordHerhaal: 'Blauwe-kat-rent-7' })).toBeNull()
  })
  it('zonder akkoord geen aanmelding, ook niet met een tekst "true"', () => {
    const uit = leesAanmelding({ ...goed, akkoord: 'true' })
    expect(uit.ok).toBe(false)
  })
  it('houdt het maximum van het pakket aan', () => {
    expect(leesAanmelding({ ...goed, pakket: 'start', aantalVestigingen: 2 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, pakket: 'club', aantalVestigingen: 4 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, pakket: 'keten', aantalVestigingen: 40 }).ok).toBe(true)
    expect(leesAanmelding({ ...goed, pakket: 'keten', aantalVestigingen: 41 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, aantalVestigingen: 1.5 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, aantalVestigingen: '2' }).ok).toBe(true)
  })
  it('weigert onbekende pakketten, gereserveerde adressen en rare tekens', () => {
    expect(leesAanmelding({ ...goed, pakket: 'gratis' }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, slug: 'www' }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, slug: 'a--b' }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, sportschoolNaam: '<script>' }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, eigenaarNaam: 'x'.repeat(61) }).ok).toBe(false)
  })
  it('een lijst of niets is geen aanmelding', () => {
    expect(leesAanmelding([goed]).ok).toBe(false)
    expect(leesAanmelding(null).ok).toBe(false)
  })
})

describe('velden', () => {
  it('telefoon: 8 tot 15 cijfers, alleen gewone tekens', () => {
    expect(leesTelefoon('040 123 45 67')).toBe('040 123 45 67')
    expect(leesTelefoon('1234567')).toBeNull()
    expect(leesTelefoon('06-1234abcd')).toBeNull()
    expect(leesTelefoon('+'.padEnd(21, '1'))).toBeNull()
  })
  it('e-mail: kleine letters en een echte vorm', () => {
    expect(leesEmail(' A@B.NL ')).toBe('a@b.nl')
    expect(leesEmail('a@b')).toBeNull()
    expect(leesEmail(`${'a'.repeat(120)}@b.nl`)).toBeNull()
  })
  it('maximum vestigingen per pakket', () => {
    expect(maxVestigingenVoor('start')).toBe(1)
    expect(maxVestigingenVoor('club')).toBe(3)
    expect(maxVestigingenVoor('keten')).toBe(40)
  })
  it('herkent het robotveld', () => {
    expect(isRobot({ website: 'http://spam' })).toBe(true)
    expect(isRobot({ website: '' })).toBe(false)
    expect(isRobot(null)).toBe(false)
  })
})
