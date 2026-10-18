import { describe, expect, it } from 'vitest'
import { fingerprintVan, gebiedVan, maakFoutRegel, maakRem, meldingVan, schoonMelding, schoonRoute, MAX_MELDING } from './fout'

describe('gebiedVan', () => {
  it('herkent Club, ledenapp en AI Your Gym', () => {
    expect(gebiedVan('/clubkane/leden/[id]')).toBe('club')
    expect(gebiedVan('/api/club/leden')).toBe('club')
    expect(gebiedVan('/clubinloggen/[code]')).toBe('club')
    expect(gebiedVan('/api/club/lid/rooster')).toBe('leden')
    expect(gebiedVan('/mijn')).toBe('leden')
    expect(gebiedVan('/aiyourgym/(site)/privacy')).toBe('aiyourgym')
    expect(gebiedVan('/api/aiyourgym/checkout?x=1')).toBe('aiyourgym')
  })

  it('slaat de rest van de app over', () => {
    expect(gebiedVan('/lifeoskane')).toBeNull()
    expect(gebiedVan('/api/pt/klanten')).toBeNull()
    expect(gebiedVan('/clubkaner')).toBeNull()
    expect(gebiedVan('/api/clubs')).toBeNull()
    expect(gebiedVan('')).toBeNull()
    expect(gebiedVan(undefined)).toBeNull()
  })
})

describe('schoonRoute', () => {
  it('haalt query, id’s en codes weg', () => {
    expect(schoonRoute('/clubkane/leden/0d3c5e1a-1111-4abc-8def-123456789abc?tab=intake')).toBe('/clubkane/leden/:id')
    expect(schoonRoute('/clubinloggen/AbCdEf1234567890XyZ_-abc')).toBe('/clubinloggen/:code')
    expect(schoonRoute('/api/club/leden/42')).toBe('/api/club/leden/:n')
    expect(schoonRoute('/mijn/jan@voorbeeld.nl')).toBe('/mijn/:email')
  })

  it('laat een routepatroon staan', () => {
    expect(schoonRoute('/clubkane/leden/[id]')).toBe('/clubkane/leden/[id]')
  })

  it('kort lange routes in', () => {
    expect(schoonRoute(`/clubkane/${'a'.repeat(300)}`).length).toBeLessThanOrEqual(160)
  })
})

describe('schoonMelding', () => {
  it('haalt e-mail, uuid, codes, cijfers en waarden weg', () => {
    const ruw = 'duplicate key value violates unique constraint "club_leden_email" Key (email)=(jan@voorbeeld.nl) lid 0d3c5e1a-1111-4abc-8def-123456789abc token abcDEF1234567890ghij rij 1234'
    const schoon = schoonMelding(ruw)
    expect(schoon).not.toContain('jan@voorbeeld.nl')
    expect(schoon).not.toContain('0d3c5e1a')
    expect(schoon).not.toContain('abcDEF1234567890ghij')
    expect(schoon).not.toContain('1234')
    expect(schoon).not.toContain('club_leden_email')
    expect(schoon).toContain('duplicate key value')
  })

  it('haalt tekst tussen aanhalingstekens weg', () => {
    expect(schoonMelding(`Lid 'Jan Jansen' niet gevonden`)).toBe(`Lid '…' niet gevonden`)
  })

  it('kort in tot 200 tekens', () => {
    const lang = schoonMelding('fout '.repeat(100))
    expect(lang.length).toBe(MAX_MELDING)
    expect(lang.endsWith('…')).toBe(true)
  })

  it('geeft iets terug bij een lege melding', () => {
    expect(schoonMelding('   ')).toBe('Onbekende fout')
  })
})

describe('meldingVan', () => {
  it('neemt de naam van een eigen fouttype mee', () => {
    expect(meldingVan(new TypeError('x is undefined'))).toBe('TypeError: x is undefined')
    expect(meldingVan(new Error('kapot'))).toBe('kapot')
  })

  it('werkt met tekst en vreemde waarden', () => {
    expect(meldingVan('stuk')).toBe('stuk')
    expect(meldingVan({ geheim: 'x' })).toBe('Onbekende fout')
    expect(meldingVan(null)).toBe('Onbekende fout')
  })
})

describe('fingerprintVan', () => {
  it('is gelijk voor dezelfde fout met andere id’s', () => {
    const a = maakFoutRegel({ fout: new Error('lid 11111111-1111-4111-8111-111111111111 weg'), route: '/clubkane/leden/11111111-1111-4111-8111-111111111111', soort: 'render' })
    const b = maakFoutRegel({ fout: new Error('lid 22222222-2222-4222-8222-222222222222 weg'), route: '/clubkane/leden/22222222-2222-4222-8222-222222222222', soort: 'render' })
    expect(a?.fingerprint).toBe(b?.fingerprint)
  })

  it('is 16 hextekens en verschilt per route', () => {
    const a = fingerprintVan('club', '/a', 'x')
    expect(a).toMatch(/^[0-9a-f]{16}$/)
    expect(fingerprintVan('club', '/b', 'x')).not.toBe(a)
  })
})

describe('maakFoutRegel', () => {
  it('geeft null buiten Club en AI Your Gym', () => {
    expect(maakFoutRegel({ fout: new Error('x'), route: '/api/pt/klanten', soort: 'route' })).toBeNull()
  })

  it('controleert methode en sportschool', () => {
    const r = maakFoutRegel({ fout: new Error('x'), route: '/api/club/leden', methode: 'POST', soort: 'route', sportschool: 'TestGym' })
    expect(r).toMatchObject({ gebied: 'club', methode: 'POST', sportschool: 'testgym', soort: 'route' })
    const vreemd = maakFoutRegel({ fout: new Error('x'), route: '/api/club/leden', methode: 'post; drop', soort: 'route', sportschool: 'a b<script>' })
    expect(vreemd).toMatchObject({ methode: null, sportschool: null })
  })

  it('mag een vast gebied krijgen', () => {
    expect(maakFoutRegel({ fout: 'x', route: '/elders', soort: 'handmatig', gebied: 'aiyourgym' })?.gebied).toBe('aiyourgym')
  })
})

describe('maakRem', () => {
  it('laat er hooguit max door per venster', () => {
    const mag = maakRem(2, 1000)
    expect(mag(0)).toBe(true)
    expect(mag(10)).toBe(true)
    expect(mag(20)).toBe(false)
    expect(mag(1500)).toBe(true)
  })
})
