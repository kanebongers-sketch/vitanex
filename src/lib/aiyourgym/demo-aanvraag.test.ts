import { describe, expect, it } from 'vitest'
import { DEMO_SOORTEN, MAX_DEMO_OPMERKING, leesDemoAanvraag, momentLabel, soortLabel } from './demo-aanvraag'
import { DEMO_REM, ipHash, isTeVeel } from './demo-aanvraag-opslag'

const goed = {
  naam: '  Sanne   de Vries ',
  sportschool: 'Sterk Gym',
  email: 'Sanne@Voorbeeld.nl',
  telefoon: '+31 6 12345678',
  vestigingen: '2',
  soort: 'boutique',
  moment: 'avond',
  opmerking: '  Vooral het rooster.\r\nEn de app. ',
  akkoord: true,
}

describe('leesDemoAanvraag', () => {
  it('maakt goede invoer schoon', () => {
    expect(leesDemoAanvraag(goed)).toEqual({
      ok: true,
      waarde: {
        naam: 'Sanne de Vries',
        sportschool: 'Sterk Gym',
        email: 'sanne@voorbeeld.nl',
        telefoon: '+31 6 12345678',
        vestigingen: 2,
        soort: 'boutique',
        moment: 'avond',
        opmerking: 'Vooral het rooster.\nEn de app.',
      },
    })
  })

  it('geeft per verplicht veld een fout', () => {
    const uit = leesDemoAanvraag({})
    expect(uit.ok).toBe(false)
    if (uit.ok) return
    expect(Object.keys(uit.fouten).sort()).toEqual(['akkoord', 'email', 'moment', 'naam', 'soort', 'sportschool', 'telefoon', 'vestigingen'])
  })

  it('een lege opmerking wordt null', () => {
    const uit = leesDemoAanvraag({ ...goed, opmerking: '   ' })
    expect(uit.ok && uit.waarde.opmerking).toBeNull()
  })

  it('weigert te lange of vreemde tekst', () => {
    const lang = leesDemoAanvraag({ ...goed, opmerking: 'a'.repeat(MAX_DEMO_OPMERKING + 1) })
    expect(lang.ok).toBe(false)
    const raar = leesDemoAanvraag({ ...goed, sportschool: '<script>' })
    expect(raar.ok ? null : raar.fouten.sportschool).toMatch(/speciale tekens/)
  })

  it('kent alleen de vaste soorten en momenten', () => {
    expect(leesDemoAanvraag({ ...goed, soort: 'casino' }).ok).toBe(false)
    expect(leesDemoAanvraag({ ...goed, moment: 'nacht' }).ok).toBe(false)
    for (const s of DEMO_SOORTEN) expect(leesDemoAanvraag({ ...goed, soort: s.sleutel }).ok).toBe(true)
  })

  it('vestigingen tussen 1 en 500, ook als getal', () => {
    expect(leesDemoAanvraag({ ...goed, vestigingen: 0 }).ok).toBe(false)
    expect(leesDemoAanvraag({ ...goed, vestigingen: 501 }).ok).toBe(false)
    expect(leesDemoAanvraag({ ...goed, vestigingen: 12 }).ok).toBe(true)
    expect(leesDemoAanvraag({ ...goed, vestigingen: '1.5' }).ok).toBe(false)
  })

  it('zonder akkoord geen aanvraag, ook niet met de tekst "true"', () => {
    expect(leesDemoAanvraag({ ...goed, akkoord: 'true' }).ok).toBe(false)
  })

  it('kan niet met een lijst of null', () => {
    expect(leesDemoAanvraag(null).ok).toBe(false)
    expect(leesDemoAanvraag([goed]).ok).toBe(false)
  })
})

describe('labels', () => {
  it('geeft een leesbaar label en valt terug op de sleutel', () => {
    expect(soortLabel('yoga')).toBe('Yoga, pilates of dans')
    expect(momentLabel('maakt-niet-uit')).toBe('Maakt niet uit')
    expect(soortLabel('onbekend')).toBe('onbekend')
  })
})

describe('rem en IP', () => {
  it('stopt bij de grens per e-mail, per IP of in totaal', () => {
    expect(isTeVeel({ email: 0, ip: 0, totaal: 0 })).toBe(false)
    expect(isTeVeel({ email: DEMO_REM.perEmail, ip: 0, totaal: 0 })).toBe(true)
    expect(isTeVeel({ email: 0, ip: DEMO_REM.perIp, totaal: 0 })).toBe(true)
    expect(isTeVeel({ email: 0, ip: 0, totaal: DEMO_REM.totaal })).toBe(true)
  })

  it('bewaart het IP nooit zelf, alleen een vaste sha256', () => {
    const h = ipHash('203.0.113.7')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).toBe(ipHash(' 203.0.113.7 '))
    expect(h).not.toContain('203')
    expect(ipHash('onbekend')).toBeNull()
    expect(ipHash('')).toBeNull()
  })
})
