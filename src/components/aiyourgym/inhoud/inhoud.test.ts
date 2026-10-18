import { describe, expect, it } from 'vitest'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { DEMO_SOORTEN } from '@/lib/aiyourgym/demo-aanvraag'
import { DOELGROEPEN } from './doelgroepen'
import { HOOFDSTUKKEN } from './functies'
import { BELOFTES, OPRICHTER, PRAKTIJK } from './praktijk'
import { GEDEELD, MOMENT, ROLLEN } from './systeem'
import { SCHEMA_STAPPEN } from './trainingsschemas'

// Bewaakt de teksten van de website: de schrijfregels van Kane (geen
// gedachtestreepjes, geen klemtoon-accenten) en de eerlijkheid (geen verzonnen
// aantallen, reviews of contactgegevens).

const ALLE_TEKST = JSON.stringify({ HOOFDSTUKKEN, DOELGROEPEN, PRAKTIJK, BELOFTES, DEMO_SOORTEN, ROLLEN, GEDEELD, MOMENT, SCHEMA_STAPPEN })

describe('teksten van de website', () => {
  it('geen gedachtestreepjes', () => {
    expect(ALLE_TEKST).not.toMatch(/[–—]| - /)
  })
  it('geen klemtoon-accenten', () => {
    expect(ALLE_TEKST).not.toMatch(/[éèëêáàóòúùíì]/i)
  })
  it('geen sterren, reviews of aantallen klanten', () => {
    expect(ALLE_TEKST).not.toMatch(/★|review|klanten|sportscholen gebruiken|\d+\+/i)
  })
  it('noemt geen werkgever', () => {
    expect(JSON.stringify({ PRAKTIJK, OPRICHTER })).not.toMatch(/fit ?factory|ruben/i)
  })
})

describe('hoofdstukken en doelgroepen', () => {
  it('vijf hoofdstukken in de vaste volgorde', () => {
    expect(HOOFDSTUKKEN.map((h) => h.sleutel)).toEqual(['beheer', 'coaching', 'planning', 'groei', 'betrokkenheid'])
  })
  it('elke doelgroep heeft een kort woord voor de kop en 3 tot 5 punten', () => {
    for (const d of DOELGROEPEN) {
      expect(d.kort.length).toBeGreaterThan(1)
      expect(d.punten.length).toBeGreaterThanOrEqual(3)
      expect(d.punten.length).toBeLessThanOrEqual(5)
    }
  })
  it('elke doelgroep kan als soort in een demo-aanvraag', () => {
    const soorten = DEMO_SOORTEN.map((s) => s.sleutel as string)
    for (const d of DOELGROEPEN) expect(soorten).toContain(d.sleutel)
  })
})

describe('contact', () => {
  it('verzint niets: zonder ingevulde waarden is er geen contact', () => {
    expect(heeftContact({ telefoon: null, email: null })).toBe(false)
    expect(heeftContact({ telefoon: '  ', email: null })).toBe(false)
    expect(heeftContact({ telefoon: null, email: 'info@voorbeeld.nl' })).toBe(true)
    expect(AYG_CONTACT.telefoon === null || AYG_CONTACT.telefoon.length > 0).toBe(true)
  })
  it('maakt een tel-link met alleen cijfers en een plus', () => {
    expect(telLink('+31 (0)40 123 45 67')).toBe('tel:+310401234567')
  })
})

describe('alles in een systeem', () => {
  it('vijf plekken, elk met 3 tot 4 punten', () => {
    expect(ROLLEN.map((r) => r.sleutel)).toEqual(['balie', 'vloer', 'trainer', 'eigenaar', 'lid'])
    for (const r of ROLLEN) {
      expect(r.punten.length).toBeGreaterThanOrEqual(3)
      expect(r.punten.length).toBeLessThanOrEqual(4)
    }
  })
  it('het voorbeeldmoment raakt elke plek een keer, in de tijd oplopend', () => {
    expect(new Set(MOMENT.map((m) => m.rol)).size).toBe(ROLLEN.length)
    const tijden = MOMENT.map((m) => m.tijd)
    expect([...tijden].sort()).toEqual(tijden)
  })
})

describe('pagina trainingsschemas', () => {
  it('zeven stappen met unieke ankers en 3 tot 4 punten', () => {
    expect(SCHEMA_STAPPEN).toHaveLength(7)
    expect(new Set(SCHEMA_STAPPEN.map((s) => s.sleutel)).size).toBe(7)
    for (const s of SCHEMA_STAPPEN) expect(s.punten.length).toBeGreaterThanOrEqual(3)
  })
  it('belooft geen AI voor het voorstel', () => {
    expect(JSON.stringify(SCHEMA_STAPPEN)).not.toMatch(/AI(?! Your Gym)/)
  })
})
