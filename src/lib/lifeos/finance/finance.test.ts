// Tests voor de finance-kern: de invoervalidatie (systeemgrens) en de PURE
// aggregatie `bouwOverzicht`. Geen database — dit is precies wat puur houden
// oplevert. De regels die bewaakt worden: een bedrag ≤ 0 of niet-eindig mag NOOIT
// door de grens; euro-sommen rekenen in centen zodat 0.1 + 0.2 exact 0.30 is; en
// een lege maand geeft ECHTE nullen, geen verzonnen cijfer.

import { describe, expect, it } from 'vitest'
import {
  bouwOverzicht,
  isMaand,
  leesFactuurWijziging,
  leesNieuweFactuur,
  leesNieuweTransactie,
  leesTransactieWijziging,
  maandGrens,
  naarCenten,
  naarEuro,
  type Factuur,
  type Transactie,
} from '@/lib/lifeos/finance/finance'

// ─── Bouwstenen voor de aggregatie-tests ────────────────────────────────────

function transactie(over: Partial<Transactie>): Transactie {
  return {
    id: 'id',
    soort: 'omzet',
    bedrag: 0,
    omschrijving: 'x',
    categorie: null,
    datum: '2026-07-01',
    persoonId: null,
    aangemaaktOp: '2026-07-01T00:00:00Z',
    ...over,
  }
}

function factuur(over: Partial<Factuur>): Factuur {
  return {
    id: 'id',
    klant: 'Klant',
    bedrag: 0,
    status: 'open',
    factuurdatum: '2026-07-01',
    vervaldatum: null,
    persoonId: null,
    aangemaaktOp: '2026-07-01T00:00:00Z',
    ...over,
  }
}

// ─── Cent-rekenen ───────────────────────────────────────────────────────────

describe('cent-rekenen', () => {
  it('rondt euro op de cent en terug', () => {
    expect(naarCenten(12.34)).toBe(1234)
    expect(naarEuro(1234)).toBe(12.34)
    expect(naarCenten(0.1) + naarCenten(0.2)).toBe(30) // niet 30.000...4
  })
})

// ─── leesNieuweTransactie ───────────────────────────────────────────────────

describe('leesNieuweTransactie', () => {
  it('leest een geldige transactie en trimt de tekst', () => {
    const uit = leesNieuweTransactie({
      soort: 'kosten',
      bedrag: 49.99,
      omschrijving: '  Huur  ',
      datum: '2026-07-10',
    })
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde.soort).toBe('kosten')
      expect(uit.waarde.bedrag).toBe(49.99)
      expect(uit.waarde.omschrijving).toBe('Huur')
      expect(uit.waarde.categorie).toBeNull()
      expect(uit.waarde.persoonId).toBeNull()
    }
  })

  it("weigert een soort buiten de allowlist", () => {
    expect(leesNieuweTransactie({ soort: 'winst', bedrag: 10, omschrijving: 'x', datum: '2026-07-01' }).ok).toBe(false)
  })

  it('weigert een bedrag ≤ 0, niet-eindig of geen getal', () => {
    const basis = { soort: 'omzet', omschrijving: 'x', datum: '2026-07-01' }
    expect(leesNieuweTransactie({ ...basis, bedrag: 0 }).ok).toBe(false)
    expect(leesNieuweTransactie({ ...basis, bedrag: -5 }).ok).toBe(false)
    expect(leesNieuweTransactie({ ...basis, bedrag: Infinity }).ok).toBe(false)
    expect(leesNieuweTransactie({ ...basis, bedrag: '10' }).ok).toBe(false)
    // Rondt op 0 cent → invoerfout, geen 0-transactie.
    expect(leesNieuweTransactie({ ...basis, bedrag: 0.004 }).ok).toBe(false)
  })

  it('rondt een bedrag op de cent', () => {
    const uit = leesNieuweTransactie({ soort: 'omzet', bedrag: 10.005, omschrijving: 'x', datum: '2026-07-01' })
    expect(uit.ok && uit.waarde.bedrag).toBe(10.01)
  })

  it('weigert een lege omschrijving en een ongeldige datum', () => {
    expect(leesNieuweTransactie({ soort: 'omzet', bedrag: 10, omschrijving: '   ', datum: '2026-07-01' }).ok).toBe(false)
    expect(leesNieuweTransactie({ soort: 'omzet', bedrag: 10, omschrijving: 'x', datum: '2026/07/01' }).ok).toBe(false)
    expect(leesNieuweTransactie({ soort: 'omzet', bedrag: 10, omschrijving: 'x', datum: '2026-02-31' }).ok).toBe(false)
  })

  it('weigert een persoonId dat geen uuid is, accepteert een geldige', () => {
    const basis = { soort: 'omzet', bedrag: 10, omschrijving: 'x', datum: '2026-07-01' }
    expect(leesNieuweTransactie({ ...basis, persoonId: 'niet-een-uuid' }).ok).toBe(false)
    const goed = leesNieuweTransactie({ ...basis, persoonId: '11111111-2222-3333-4444-555555555555' })
    expect(goed.ok && goed.waarde.persoonId).toBe('11111111-2222-3333-4444-555555555555')
  })
})

// ─── leesTransactieWijziging ────────────────────────────────────────────────

describe('leesTransactieWijziging', () => {
  it('wijzigt alleen de meegestuurde velden', () => {
    const uit = leesTransactieWijziging({ bedrag: 12.5 })
    expect(uit.ok).toBe(true)
    if (uit.ok) expect(uit.waarde).toEqual({ bedrag: 12.5 })
  })

  it('kan de categorie wissen met null', () => {
    const uit = leesTransactieWijziging({ categorie: null })
    expect(uit.ok && uit.waarde.categorie).toBeNull()
  })

  it('weigert een lege wijziging en een fout veld', () => {
    expect(leesTransactieWijziging({}).ok).toBe(false)
    expect(leesTransactieWijziging({ bedrag: -1 }).ok).toBe(false)
  })
})

// ─── leesNieuweFactuur ──────────────────────────────────────────────────────

describe('leesNieuweFactuur', () => {
  it('leest een geldige factuur (vervaldatum optioneel)', () => {
    const uit = leesNieuweFactuur({ klant: '  ACME  ', bedrag: 1000, factuurdatum: '2026-07-01' })
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde.klant).toBe('ACME')
      expect(uit.waarde.vervaldatum).toBeNull()
    }
  })

  it('accepteert een vervaldatum op of na de factuurdatum', () => {
    expect(leesNieuweFactuur({ klant: 'A', bedrag: 10, factuurdatum: '2026-07-01', vervaldatum: '2026-07-01' }).ok).toBe(true)
    expect(leesNieuweFactuur({ klant: 'A', bedrag: 10, factuurdatum: '2026-07-01', vervaldatum: '2026-08-01' }).ok).toBe(true)
  })

  it('weigert een vervaldatum vóór de factuurdatum', () => {
    const uit = leesNieuweFactuur({ klant: 'A', bedrag: 10, factuurdatum: '2026-07-10', vervaldatum: '2026-07-01' })
    expect(uit.ok).toBe(false)
  })

  it('weigert een lege klant en een ontbrekend bedrag', () => {
    expect(leesNieuweFactuur({ klant: '  ', bedrag: 10, factuurdatum: '2026-07-01' }).ok).toBe(false)
    expect(leesNieuweFactuur({ klant: 'A', factuurdatum: '2026-07-01' }).ok).toBe(false)
  })
})

// ─── leesFactuurWijziging ───────────────────────────────────────────────────

describe('leesFactuurWijziging', () => {
  it('zet de status naar betaald', () => {
    const uit = leesFactuurWijziging({ status: 'betaald' })
    expect(uit.ok && uit.waarde.status).toBe('betaald')
  })

  it('weigert een status buiten de allowlist en een lege wijziging', () => {
    expect(leesFactuurWijziging({ status: 'kwijt' }).ok).toBe(false)
    expect(leesFactuurWijziging({}).ok).toBe(false)
  })
})

// ─── maand-helpers ──────────────────────────────────────────────────────────

describe('isMaand & maandGrens', () => {
  it('herkent een geldige maandsleutel', () => {
    expect(isMaand('2026-07')).toBe(true)
    expect(isMaand('2026-13')).toBe(false)
    expect(isMaand('2026-7')).toBe(false)
    expect(isMaand('202607')).toBe(false)
    expect(isMaand(42)).toBe(false)
  })

  it('geeft de half-open dag-grenzen, inclusief december-rollover', () => {
    expect(maandGrens('2026-07')).toEqual({ start: '2026-07-01', eindExclusief: '2026-08-01' })
    expect(maandGrens('2026-12')).toEqual({ start: '2026-12-01', eindExclusief: '2027-01-01' })
  })
})

// ─── bouwOverzicht ──────────────────────────────────────────────────────────

describe('bouwOverzicht', () => {
  const VANDAAG = '2026-07-21'

  it('geeft echte nullen voor een lege maand — geen verzonnen cijfer', () => {
    const o = bouwOverzicht([], [], '2026-07', VANDAAG)
    expect(o).toMatchObject({ maand: '2026-07', omzet: 0, kosten: 0, winst: 0, openstaand: 0, verlopenAantal: 0, aantalTransacties: 0 })
    expect(o.trend).toHaveLength(6)
    expect(o.trend.every((t) => t.omzet === 0 && t.kosten === 0 && t.winst === 0)).toBe(true)
  })

  it('telt omzet/kosten/winst van de maand in centen (exact)', () => {
    const transacties = [
      transactie({ soort: 'omzet', bedrag: 100, datum: '2026-07-05' }),
      transactie({ soort: 'omzet', bedrag: 0.1, datum: '2026-07-06' }),
      transactie({ soort: 'kosten', bedrag: 0.2, datum: '2026-07-07' }),
      transactie({ soort: 'kosten', bedrag: 30, datum: '2026-06-15' }), // vorige maand
    ]
    const o = bouwOverzicht(transacties, [], '2026-07', VANDAAG)
    expect(o.omzet).toBe(100.1)
    expect(o.kosten).toBe(0.2)
    expect(o.winst).toBe(99.9)
    expect(o.aantalTransacties).toBe(3) // alleen juli
  })

  it('bouwt een 6-maands-trend, oplopend en eindigend op de gevraagde maand', () => {
    const transacties = [
      transactie({ soort: 'kosten', bedrag: 30, datum: '2026-06-15' }),
      transactie({ soort: 'omzet', bedrag: 100, datum: '2026-07-05' }),
    ]
    const o = bouwOverzicht(transacties, [], '2026-07', VANDAAG)
    expect(o.trend.map((t) => t.maand)).toEqual(['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'])
    expect(o.trend[4]).toEqual({ maand: '2026-06', omzet: 0, kosten: 30, winst: -30 })
    expect(o.trend[5]).toEqual({ maand: '2026-07', omzet: 100, kosten: 0, winst: 100 })
  })

  it('telt openstaand (niet-betaald) en verlopen (open én vervaldatum < vandaag)', () => {
    const facturen = [
      factuur({ status: 'open', bedrag: 500, vervaldatum: '2026-07-10' }), // verlopen + openstaand
      factuur({ status: 'open', bedrag: 200, vervaldatum: '2026-08-01' }), // toekomst → alleen openstaand
      factuur({ status: 'open', bedrag: 50, vervaldatum: null }), // geen vervaldatum → alleen openstaand
      factuur({ status: 'betaald', bedrag: 999, vervaldatum: '2026-01-01' }), // binnen → telt nergens
      factuur({ status: 'verlopen', bedrag: 300, vervaldatum: '2026-05-01' }), // niet-betaald → openstaand, maar status≠open → geen verlopen-telling
    ]
    const o = bouwOverzicht([], facturen, '2026-07', VANDAAG)
    expect(o.openstaand).toBe(1050) // 500 + 200 + 50 + 300
    expect(o.verlopenAantal).toBe(1) // alleen de open + over de vervaldatum
  })
})
