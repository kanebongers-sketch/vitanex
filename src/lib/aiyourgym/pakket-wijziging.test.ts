import { describe, expect, it } from 'vitest'
import { aantalVanRegels, leesAbonnementRegels, leesPakketVerzoek, naWijziging, pakketWeg, pakkettenVanPrijzen, regelWissel, wisselLeeg, type AbonnementRegel, type WegInvoer } from './pakket-wijziging'
import { eigenPrijzen, stripeRegels } from './config'
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
  it('opzeggen is altijd een aanvraag volgens het jaarcontract, ook vanuit de bundel; erbij naar de bundel via Stripe', () => {
    const basis: WegInvoer = { actie: 'opzeggen', platformEigenaar: false, stripeAbonnement: true, afsluitbaar: true, testbetalen: false }
    expect(pakketWeg(basis)).toBe('aanvraag')
    expect(pakketWeg({ ...basis, afsluitbaar: false })).toBe('aanvraag')
    expect(pakketWeg({ ...basis, actie: 'erbij' })).toBe('stripe')
    expect(pakketWeg({ ...basis, platformEigenaar: true })).toBe('direct')
    expect(pakketWeg({ ...basis, stripeAbonnement: false, testbetalen: true })).toBe('test')
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

describe('bundel op een lopend Stripe-abonnement (besluit Kane 30-10-2026)', () => {
  const LOS = Object.fromEntries(PAKKET_SLEUTELS.map((p) => [`AIYOURGYM_STRIPE_PRIJS_${p.toUpperCase()}`, `price_${p}0001`]))
  const env = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_123', ...LOS, AIYOURGYM_STRIPE_PRIJS_ALLES: 'price_alles0001' }
  const eigen = eigenPrijzen(env)
  const regel = (p: string, n = 2): AbonnementRegel => ({ id: `si_${p}`, prijsId: `price_${p}0001`, aantal: n })
  const doel = (lijst: Parameters<typeof stripeRegels>[0]) => stripeRegels(lijst, env)!.map((r) => r.prijsId)
  const vijf = PAKKET_SLEUTELS.filter((p) => p !== 'groei')

  it('de bundelprijs betekent alle zes pakketten, ook met losse regels ernaast', () => {
    expect(pakkettenVanPrijzen(['price_alles0001'], env)).toEqual([...PAKKET_SLEUTELS])
    expect(pakkettenVanPrijzen(['price_alles0001', 'price_lessen0001'], env)).toEqual([...PAKKET_SLEUTELS])
    // Een onbekende prijs ernaast: niets veranderen.
    expect(pakkettenVanPrijzen(['price_alles0001', 'price_vreemd0001'], env)).toBeNull()
    // Zonder bundelprijs in env is hij onbekend.
    expect(pakkettenVanPrijzen(['price_alles0001'], LOS)).toBeNull()
  })
  it('de vijf losse regels plus het zesde pakket worden een bundelregel', () => {
    const nu = vijf.map((p) => regel(p))
    const w = regelWissel(nu, doel([...PAKKET_SLEUTELS]), eigen)
    expect(w.weg).toEqual(vijf.map((p) => `si_${p}`))
    expect(w.erbij).toEqual(['price_alles0001'])
  })
  it('de wissel werkt ook andersom: van de bundel naar vijf losse regels (zoals Kane een opzegging verwerkt)', () => {
    const nu: AbonnementRegel[] = [{ id: 'si_alles', prijsId: 'price_alles0001', aantal: 3 }]
    const w = regelWissel(nu, doel(vijf), eigen)
    expect(w.weg).toEqual(['si_alles'])
    expect(w.erbij).toEqual(vijf.map((p) => `price_${p}0001`))
    expect(aantalVanRegels(nu, eigen, 1)).toBe(3)
  })
  it('een gewoon pakket erbij (minder dan zes): alleen die regel erbij', () => {
    const w = regelWissel([regel('lessen')], doel(['lessen', 'groei']), eigen)
    expect(w).toEqual({ weg: [], erbij: ['price_groei0001'] })
  })
  it('idempotent: staat het al zo, dan hoeft er niets', () => {
    const nu: AbonnementRegel[] = [{ id: 'si_alles', prijsId: 'price_alles0001', aantal: 1 }]
    expect(wisselLeeg(regelWissel(nu, doel([...PAKKET_SLEUTELS]), eigen))).toBe(true)
    expect(wisselLeeg(regelWissel(vijf.map((p) => regel(p)), doel(vijf), eigen))).toBe(true)
  })
  it('een regel die niet van ons is blijft altijd staan', () => {
    const nu = [...vijf.map((p) => regel(p)), { id: 'si_extra', prijsId: 'price_extra0001', aantal: 1 }]
    expect(regelWissel(nu, doel([...PAKKET_SLEUTELS]), eigen).weg).not.toContain('si_extra')
  })
  it('het aantal vestigingen: van een eigen regel, anders wat we zelf weten', () => {
    expect(aantalVanRegels([{ id: 'si_extra', prijsId: 'price_extra0001', aantal: 9 }], eigen, 2)).toBe(2)
    expect(aantalVanRegels([regel('lessen', 4)], eigen, 2)).toBe(4)
  })
  it('de regels van een Stripe-abonnement lezen (prijs als object of id), onzin weg', () => {
    const json = { id: 'sub_1', items: { data: [{ id: 'si_1', price: { id: 'price_lessen0001' }, quantity: 2 }, { id: 'si_2', price: 'price_groei0001', quantity: 0 }, { id: 'x', price: 'price_a' }, { id: 'si_3', price: { id: 'prod_1' } }] } }
    expect(leesAbonnementRegels(json)).toEqual([
      { id: 'si_1', prijsId: 'price_lessen0001', aantal: 2 },
      { id: 'si_2', prijsId: 'price_groei0001', aantal: null },
    ])
    expect(leesAbonnementRegels({ items: { data: [] } })).toBeNull()
    expect(leesAbonnementRegels(null)).toBeNull()
  })
})
