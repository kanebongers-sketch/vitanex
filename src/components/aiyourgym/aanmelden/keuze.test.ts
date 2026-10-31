import { describe, expect, it } from 'vitest'
import { gekozenVan, wisselPakket } from './keuze'
import type { PakketKeuze } from './types'

const p = (sleutel: PakketKeuze['sleutel'], stripe: boolean): PakketKeuze => ({ sleutel, naam: sleutel, voorWie: '', inbegrepen: [], stripe })
const LIJST = [p('administratie', true), p('lessen', true), p('groei', false), p('training', true)]

describe('keuze van losse pakketten bij het aanmelden', () => {
  it('niets gekozen: nog niets', () => {
    expect(gekozenVan(LIJST, [], true, 'nl')).toBeNull()
  })
  it('alle gekozen pakketten met een Stripe-prijs: betalen via Stripe', () => {
    expect(gekozenVan(LIJST, ['administratie', 'lessen', 'training'], true, 'nl')).toEqual({ naam: 'Ledenadministratie, Groepslessen en Training en coaching', open: true, test: false })
    // De basis telt altijd mee, ook als hij in de keuze ontbreekt.
    expect(gekozenVan(LIJST, ['lessen'], true, 'nl')?.naam).toBe('Ledenadministratie en Groepslessen')
    expect(gekozenVan([p('administratie', false), p('lessen', true)], ['lessen'], false, 'nl')).toMatchObject({ open: false })
  })
  it('een pakket zonder prijs erbij: testbetaling, of een aanvraag als die uit staat', () => {
    expect(gekozenVan(LIJST, ['lessen', 'groei'], true, 'nl')).toMatchObject({ open: true, test: true })
    expect(gekozenVan(LIJST, ['lessen', 'groei'], false, 'nl')).toMatchObject({ open: false, test: false })
  })
  it('geen bundel meer (besluit Kane 31-10-2026): alle zes alleen via Stripe als elk pakket een prijs heeft', () => {
    const ZES = [p('administratie', false), p('lessen', true), p('training', true), p('afspraken', false), p('team', false), p('groei', false)]
    expect(gekozenVan(ZES, ZES.map((x) => x.sleutel), true, 'nl')).toMatchObject({ open: true, test: true })
    expect(gekozenVan(ZES, ZES.map((x) => x.sleutel), false, 'nl')).toMatchObject({ open: false, test: false })
  })
  it('aan- en uitvinken houdt de vaste volgorde en wijzigt nooit in place', () => {
    const begin = ['administratie', 'groei'] as const
    expect(wisselPakket(begin, 'lessen')).toEqual(['administratie', 'lessen', 'groei'])
    expect(wisselPakket(['administratie', 'lessen', 'groei'], 'lessen')).toEqual(['administratie', 'groei'])
    expect(begin).toEqual(['administratie', 'groei'])
  })
  it('de basis is niet uit te vinken (besluit Kane 31-10-2026)', () => {
    expect(wisselPakket(['administratie', 'lessen'], 'administratie')).toEqual(['administratie', 'lessen'])
    expect(wisselPakket([], 'administratie')).toEqual(['administratie'])
    expect(wisselPakket(['groei'], 'lessen')).toEqual(['administratie', 'lessen', 'groei'])
  })
})
