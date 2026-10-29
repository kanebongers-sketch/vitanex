import { describe, expect, it } from 'vitest'
import { leesPakketVerzoek, naWijziging, pakketWeg, pakkettenVanPrijzen, type WegInvoer } from './pakket-wijziging'
import { KERN_INBEGREPEN, PAKKETTEN, PAKKET_SLEUTELS, VOORSTEL_PER_SOORT, leesPakketKeuze, voorstelVoor } from './pakketten'
import { PAKKET_NAMEN, pakkettenTekst } from './taal/woorden/algemeen/pakketten'

describe('een pakket erbij nemen of opzeggen', () => {
  it('leest alleen een bekend pakket en een bekende actie', () => {
    expect(leesPakketVerzoek({ pakket: 'lessen', actie: 'erbij' }, ['groei'])).toEqual({ ok: true, waarde: { pakket: 'lessen', actie: 'erbij' } })
    expect(leesPakketVerzoek({ pakket: 'club', actie: 'erbij' }, ['groei'])).toEqual({ ok: false, fout: 'onbekend' })
    expect(leesPakketVerzoek({ pakket: 'lessen', actie: 'weg' }, ['groei'])).toEqual({ ok: false, fout: 'onbekend' })
    expect(leesPakketVerzoek(null, ['groei'])).toEqual({ ok: false, fout: 'onbekend' })
  })
  it('weigert wat niet kan: twee keer erbij, opzeggen wat je niet hebt, het laatste pakket opzeggen', () => {
    expect(leesPakketVerzoek({ pakket: 'groei', actie: 'erbij' }, ['groei'])).toEqual({ ok: false, fout: 'al' })
    expect(leesPakketVerzoek({ pakket: 'lessen', actie: 'opzeggen' }, ['groei'])).toEqual({ ok: false, fout: 'niet' })
    expect(leesPakketVerzoek({ pakket: 'groei', actie: 'opzeggen' }, ['groei'])).toEqual({ ok: false, fout: 'laatste' })
    expect(leesPakketVerzoek({ pakket: 'groei', actie: 'opzeggen' }, ['lessen', 'groei']).ok).toBe(true)
  })
  it('de nieuwe lijst in vaste volgorde, nooit in place', () => {
    const begin = ['groei'] as const
    expect(naWijziging(begin, { pakket: 'lessen', actie: 'erbij' })).toEqual(['lessen', 'groei'])
    expect(naWijziging(['lessen', 'groei'], { pakket: 'lessen', actie: 'opzeggen' })).toEqual(['groei'])
    expect(begin).toEqual(['groei'])
  })
  it('hoe het loopt: Kane direct, Stripe alleen voor erbij met prijs, anders testbetaling of aanvraag', () => {
    const basis: WegInvoer = { actie: 'erbij', platformEigenaar: false, stripeAbonnement: false, afsluitbaar: false, testbetalen: true }
    expect(pakketWeg({ ...basis, platformEigenaar: true })).toBe('direct')
    expect(pakketWeg({ ...basis, stripeAbonnement: true, afsluitbaar: true })).toBe('stripe')
    // Een echt contract zonder prijs voor dit pakket, of opzeggen: Kane verwerkt het volgens het contract.
    expect(pakketWeg({ ...basis, stripeAbonnement: true, afsluitbaar: false })).toBe('aanvraag')
    expect(pakketWeg({ ...basis, actie: 'opzeggen', stripeAbonnement: true, afsluitbaar: true })).toBe('aanvraag')
    // Zonder Stripe: de testbetaling (niets afgeschreven), of een aanvraag als die uit staat.
    expect(pakketWeg(basis)).toBe('test')
    expect(pakketWeg({ ...basis, actie: 'opzeggen' })).toBe('test')
    expect(pakketWeg({ ...basis, testbetalen: false })).toBe('aanvraag')
  })
  it('van de regels van een Stripe-abonnement terug naar de pakketten', () => {
    const env = { AIYOURGYM_STRIPE_PRIJS_LESSEN: 'price_lessen01', AIYOURGYM_STRIPE_PRIJS_TEAM: 'price_team0001' }
    expect(pakkettenVanPrijzen(['price_team0001', 'price_lessen01'], env)).toEqual(['lessen', 'team'])
    expect(pakkettenVanPrijzen(['price_lessen01', 'price_onbekend'], env)).toBeNull()
    expect(pakkettenVanPrijzen([], env)).toBeNull()
  })
})

describe('de losse pakketten', () => {
  it('zes pakketten, elk met naam, voor wie en wat erin zit, in beide talen', () => {
    expect(PAKKET_SLEUTELS).toHaveLength(6)
    expect(PAKKETTEN.map((p) => p.sleutel)).toEqual([...PAKKET_SLEUTELS])
    for (const p of PAKKETTEN) {
      expect(p.inbegrepen.length).toBeGreaterThan(2)
      expect(PAKKET_NAMEN.en.pakketten[p.sleutel].inbegrepen).toHaveLength(p.inbegrepen.length)
    }
    expect(PAKKET_NAMEN.en.kern.inbegrepen).toHaveLength(KERN_INBEGREPEN.length)
  })
  it('geen prijzen in de code (die staan alleen in Stripe)', () => {
    const tekst = JSON.stringify({ PAKKETTEN, KERN_INBEGREPEN, PAKKET_NAMEN })
    expect(tekst).not.toMatch(/€|\beuro\b|\d+,\d{2}/i)
    for (const p of PAKKETTEN) expect(Object.keys(p)).not.toContain('prijsPerVestiging')
  })
  it('geen belofte over betalen of incasso', () => {
    const tekst = JSON.stringify({ PAKKETTEN, KERN_INBEGREPEN, PAKKET_NAMEN }).toLowerCase()
    expect(tekst).not.toMatch(/incasso|direct debit|facturen maken/)
  })
  it('een keuze lezen: een, meer of een tekst; nooit leeg of onbekend', () => {
    expect(leesPakketKeuze('groei,lessen')).toEqual(['lessen', 'groei'])
    expect(leesPakketKeuze(['team'])).toEqual(['team'])
    expect(leesPakketKeuze('')).toBeNull()
    expect(leesPakketKeuze(['team', 'keten'])).toBeNull()
  })
  it('een voorstel per soort sportschool: yoga alleen Groepslessen, een keten alles', () => {
    expect(voorstelVoor('yoga')).toEqual(['lessen'])
    expect(voorstelVoor('keten')).toEqual([...PAKKET_SLEUTELS])
    expect(voorstelVoor('pt')).toEqual(['training', 'afspraken'])
    expect(voorstelVoor('onbekend')).toBeNull()
    for (const v of Object.values(VOORSTEL_PER_SOORT)) expect(v.length).toBeGreaterThan(0)
  })
  it('namen samen in gewone taal', () => {
    expect(pakkettenTekst(['lessen'], 'nl')).toBe('Groepslessen')
    expect(pakkettenTekst(['lessen', 'groei', 'team'], 'nl')).toBe('Groepslessen, Groei en Team en vloer')
    expect(pakkettenTekst(['lessen', 'groei'], 'en')).toBe('Group classes and Growth')
  })
})
