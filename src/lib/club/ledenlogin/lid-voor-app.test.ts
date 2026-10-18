import { describe, expect, it } from 'vitest'
import type { Lid } from '@/lib/club/kern/lid'
import { belLink, contactUitRij, lidVoorApp } from './lid-voor-app'

const LID: Lid = {
  id: 'l1', vestiging: 'budel', lidnummer: '42', sportivityId: 'sp-9', voornaam: 'Sam', achternaam: 'Jansen', email: 'sam@voorbeeld.nl', telefoon: '0612345678',
  geboortedatum: '1990-01-01', geslacht: 'man', abonnement: 'Basis', status: 'actief', lidSinds: '2024-03-01', einddatum: null, tags: ['vip'], coachId: 'c1', demo: true,
}

describe('lidVoorApp', () => {
  it('geeft alleen wat de app toont', () => {
    const app = lidVoorApp(LID)
    expect(Object.keys(app).sort()).toEqual(['abonnement', 'achternaam', 'email', 'id', 'lidSinds', 'lidnummer', 'status', 'telefoon', 'vestiging', 'voornaam'])
    expect(app).not.toHaveProperty('geboortedatum')
    expect(app).not.toHaveProperty('tags')
    expect(app).not.toHaveProperty('coachId')
    expect(app).not.toHaveProperty('sportivityId')
  })
})

describe('contactUitRij', () => {
  it('leest telefoon en e-mail', () => {
    expect(contactUitRij({ telefoon: ' 0495 123 456 ', email: 'budel@gym.nl' }, 'Budel')).toEqual({ naam: 'Budel', telefoon: '0495 123 456', email: 'budel@gym.nl' })
  })
  it('lege of foute waarden worden null', () => {
    expect(contactUitRij({ telefoon: '', email: 'geen-mail' }, 'Budel')).toEqual({ naam: 'Budel', telefoon: null, email: null })
    expect(contactUitRij(null, 'Budel')).toEqual({ naam: 'Budel', telefoon: null, email: null })
  })
})

describe('belLink', () => {
  it('maakt een schone tel-link', () => {
    expect(belLink('0495 12 34 56')).toBe('tel:0495123456')
    expect(belLink('+31 (0)6-1234 5678')).toBe('tel:+310612345678')
  })
  it('geen nummer: geen link', () => {
    expect(belLink(null)).toBeNull()
    expect(belLink('bel ons')).toBeNull()
  })
})
