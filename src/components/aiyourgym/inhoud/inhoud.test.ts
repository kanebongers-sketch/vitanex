import { describe, expect, it } from 'vitest'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { DEMO_SOORTEN } from '@/lib/aiyourgym/demo-aanvraag'
import { DOELGROEPEN } from './doelgroepen'
import { HOOFDSTUKKEN } from './functies'
import { SCHEMA_STAPPEN } from './trainingsschemas'
import { START_MINUTEN, START_STAPPEN, VRAAG_CONTRACT, VRAAG_GEGEVENS } from './vertrouwen'
import { KOMT_MEE, KOMT_NIET_MEE, NIET, OVERSTAP_TIPS, WEL } from './eerlijk'
import { GROEPEN, KERN, SUBVERWERKERS } from './beveiliging'

// Bewaakt de teksten van de website: de schrijfregels van Kane (geen
// gedachtestreepjes, geen klemtoon-accenten) en de eerlijkheid (geen verzonnen
// aantallen, reviews of contactgegevens).

const EERLIJK = { WEL, NIET, KOMT_MEE, KOMT_NIET_MEE, OVERSTAP_TIPS, KERN, GROEPEN, SUBVERWERKERS, VRAAG_CONTRACT, VRAAG_GEGEVENS }
const ALLE_TEKST = JSON.stringify({ HOOFDSTUKKEN, DOELGROEPEN, DEMO_SOORTEN, SCHEMA_STAPPEN, ...EERLIJK })

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
    expect(ALLE_TEKST).not.toMatch(/fit ?factory|ruben/i)
  })
})

describe('hoofdstukken en doelgroepen', () => {
  it('vijf hoofdstukken in de vaste volgorde, elk met hooguit drie korte punten', () => {
    expect(HOOFDSTUKKEN.map((h) => h.sleutel)).toEqual(['beheer', 'coaching', 'planning', 'groei', 'betrokkenheid'])
    for (const h of HOOFDSTUKKEN) {
      expect(h.functies.length).toBeLessThanOrEqual(3)
      for (const f of h.functies) expect(f.tekst.length).toBeLessThanOrEqual(90)
    }
  })
  it('elke doelgroep heeft een kort woord voor de kop en drie punten', () => {
    for (const d of DOELGROEPEN) {
      expect(d.kort.length).toBeGreaterThan(1)
      expect(d.punten).toHaveLength(3)
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

describe('pagina trainingsschemas', () => {
  it('zeven stappen met unieke ankers en drie punten', () => {
    expect(SCHEMA_STAPPEN).toHaveLength(7)
    expect(new Set(SCHEMA_STAPPEN.map((s) => s.sleutel)).size).toBe(7)
    for (const s of SCHEMA_STAPPEN) expect(s.punten).toHaveLength(3)
  })
  it('belooft geen AI voor het voorstel', () => {
    expect(JSON.stringify(SCHEMA_STAPPEN)).not.toMatch(/AI(?! Your Gym)/)
  })
})

describe('startwizard', () => {
  it('past echt in een kwartier', () => {
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
    expect(JSON.stringify(NIET)).toMatch(/abonnementen/)
  })
  it('hooguit drie punten per blok', () => {
    for (const lijst of [WEL, NIET, KOMT_MEE, KOMT_NIET_MEE, OVERSTAP_TIPS]) expect(lijst.length).toBeLessThanOrEqual(3)
  })
})
