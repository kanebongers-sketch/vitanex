import { describe, expect, it } from 'vitest'
import { MAX_VESTIGINGEN_ONLINE, isRobot, leesAanmelding, leesEmail, leesTelefoon } from './aanmelding'

const goed = {
  pakketten: ['groei', 'administratie', 'lessen'],
  sportschoolNaam: '  Sterk   Gym ',
  aantalVestigingen: 2,
  ledenSchatting: '100',
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
      waarde: { pakketten: ['administratie', 'lessen', 'groei'], sportschoolNaam: 'Sterk Gym', aantalVestigingen: 2, ledenSchatting: 100, slug: 'sterkgym', eigenaarNaam: 'Sanne de Vries', eigenaarEmail: 'sanne@voorbeeld.nl', eigenaarTelefoon: '+31 6 12345678', wachtwoord: 'Blauwe-kat-rent-7' },
    })
  })
  it('geeft per veld een fout', () => {
    const uit = leesAanmelding({})
    expect(uit.ok).toBe(false)
    if (uit.ok) return
    expect(Object.keys(uit.fouten).sort()).toEqual(['aantalVestigingen', 'akkoord', 'eigenaarEmail', 'eigenaarNaam', 'eigenaarTelefoon', 'ledenSchatting', 'pakketten', 'slug', 'sportschoolNaam', 'wachtwoord'])
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
  it('leden in de eerste vestiging: alleen een staffelgrens of op maat (besluit Kane 31-10-2026)', () => {
    const schatting = (v: unknown) => {
      const uit = leesAanmelding({ ...goed, ledenSchatting: v })
      return uit.ok ? uit.waarde.ledenSchatting : null
    }
    expect(schatting(25)).toBe(25)
    expect(schatting('5000')).toBe(5000)
    expect(schatting('op_maat')).toBe('op_maat')
    expect(schatting(26)).toBeNull()
    expect(schatting(0)).toBeNull()
    expect(schatting('')).toBeNull()
    expect(schatting(undefined)).toBeNull()
  })
  it('zonder akkoord geen aanmelding, ook niet met een tekst "true"', () => {
    const uit = leesAanmelding({ ...goed, akkoord: 'true' })
    expect(uit.ok).toBe(false)
  })
  it('houdt het maximum van online aanmelden aan, voor elke keuze van pakketten', () => {
    expect(leesAanmelding({ ...goed, pakketten: ['administratie', 'lessen'], aantalVestigingen: 40 }).ok).toBe(true)
    expect(leesAanmelding({ ...goed, pakketten: ['administratie', 'lessen'], aantalVestigingen: 41 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, aantalVestigingen: 0 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, aantalVestigingen: 1.5 }).ok).toBe(false)
    expect(leesAanmelding({ ...goed, aantalVestigingen: '2' }).ok).toBe(true)
  })
  it('basis met add-ons: de basis plus nul of meer add-ons; nooit zonder basis, leeg of onbekend', () => {
    const lijst = (p: unknown) => {
      const uit = leesAanmelding({ ...goed, pakketten: p })
      return uit.ok ? uit.waarde.pakketten : null
    }
    expect(lijst(['administratie', 'lessen'])).toEqual(['administratie', 'lessen'])
    expect(lijst(['administratie'])).toEqual(['administratie'])
    expect(lijst(['groei', 'administratie', 'groei'])).toEqual(['administratie', 'groei'])
    expect(lijst(['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei'])).toHaveLength(6)
    expect(lijst('lessen,administratie,training')).toEqual(['administratie', 'lessen', 'training'])
    expect(lijst([])).toBeNull()
    expect(lijst(['lessen', 'start'])).toBeNull()
    expect(lijst(['club'])).toBeNull()
    expect(lijst(undefined)).toBeNull()
  })
  it('een keuze zonder de basis wordt geweigerd met een duidelijke melding (besluit Kane 31-10-2026)', () => {
    for (const p of [['lessen'], ['lessen', 'groei'], 'training', ['lessen', 'training', 'afspraken', 'team', 'groei']]) {
      const uit = leesAanmelding({ ...goed, pakketten: p })
      expect(uit.ok).toBe(false)
      if (!uit.ok) expect(uit.fouten.pakketten).toMatch(/basis/)
    }
  })
  it('een oude link met ?pakket= werkt alleen met de basis erin', () => {
    const uit = leesAanmelding({ ...goed, pakketten: undefined, pakket: 'administratie,training' })
    expect(uit.ok && uit.waarde.pakketten).toEqual(['administratie', 'training'])
    expect(leesAanmelding({ ...goed, pakketten: undefined, pakket: 'training' }).ok).toBe(false)
  })
  it('weigert onbekende pakketten, gereserveerde adressen en rare tekens', () => {
    expect(leesAanmelding({ ...goed, pakketten: ['gratis'] }).ok).toBe(false)
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
  it('online tot 40 vestigingen', () => {
    expect(MAX_VESTIGINGEN_ONLINE).toBe(40)
  })
  it('herkent het robotveld', () => {
    expect(isRobot({ website: 'http://spam' })).toBe(true)
    expect(isRobot({ website: '' })).toBe(false)
    expect(isRobot(null)).toBe(false)
  })
})
