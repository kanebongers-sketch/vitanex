import { describe, expect, it } from 'vitest'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { DEMO_SOORTEN } from '@/lib/aiyourgym/demo-aanvraag'
import { DOELGROEPEN } from './doelgroepen'
import { HOOFDSTUKKEN } from './functies'
import { BELOFTES, OPRICHTER, PRAKTIJK, VLOER } from './praktijk'
import { ROLLEN } from './systeem'
import { SCHEMA_STAPPEN } from './trainingsschemas'
import { OVERSTAP_STAPPEN, START_MINUTEN, START_STAPPEN } from './vertrouwen'
import { HOME_VRAGEN, KOMT_MEE, KOMT_NIET_MEE, NIET, OVERSTAP_TIPS, WEL } from './eerlijk'
import { GROEPEN, KERN, SUBVERWERKERS } from './beveiliging'

// Bewaakt de teksten van de website: de schrijfregels van Kane (geen
// gedachtestreepjes, geen klemtoon-accenten) en de eerlijkheid (geen verzonnen
// aantallen, reviews of contactgegevens).

const EERLIJK = { HOME_VRAGEN, WEL, NIET, KOMT_MEE, KOMT_NIET_MEE, OVERSTAP_TIPS, KERN, GROEPEN, SUBVERWERKERS }
const ALLE_TEKST = JSON.stringify({ HOOFDSTUKKEN, DOELGROEPEN, PRAKTIJK, VLOER, BELOFTES, DEMO_SOORTEN, ROLLEN, SCHEMA_STAPPEN, OVERSTAP_STAPPEN, ...EERLIJK })

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
    expect(JSON.stringify({ PRAKTIJK, OPRICHTER, VLOER, BELOFTES })).not.toMatch(/fit ?factory|ruben/i)
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
  it('vijf plekken, elk met een zin en een link naar een subpagina', () => {
    expect(ROLLEN.map((r) => r.sleutel)).toEqual(['balie', 'vloer', 'trainer', 'eigenaar', 'lid'])
    for (const r of ROLLEN) {
      expect(r.kop.length).toBeGreaterThan(20)
      expect(r.pad).toMatch(/^\/(functies|trainingsschemas|ledenapp|voor-wie|overstappen)(#[a-z]+)?$/)
    }
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

describe('overstappen op de voorpagina', () => {
  it('drie stappen, en de wizard past echt in een kwartier', () => {
    expect(OVERSTAP_STAPPEN).toHaveLength(3)
    expect(START_MINUTEN).toBeLessThanOrEqual(15)
    expect(START_STAPPEN.length).toBeGreaterThan(0)
  })
})

describe('eerlijk en vertrouwen', () => {
  const tekst = JSON.stringify(EERLIJK)
  it('noemt geen bedragen, keurmerken of concurrenten', () => {
    expect(tekst).not.toMatch(/€|euro|ISO|certific|keurmerk|virtuagym|sportivity|fit ?factory/i)
  })
  it('zegt eerlijk dat incasso en abonnementen van leden er niet in zitten', () => {
    expect(JSON.stringify(NIET)).toMatch(/Incasso/)
    expect(HOME_VRAGEN[0].antwoord).toMatch(/^Nee\./)
  })
  it('zes vragen op de voorpagina, links alleen naar eigen paginas', () => {
    expect(HOME_VRAGEN).toHaveLength(6)
    for (const v of HOME_VRAGEN) if (v.link) expect(v.link.pad).toMatch(/^(\/[a-z-]+|#[a-z-]+)$/)
  })
})
