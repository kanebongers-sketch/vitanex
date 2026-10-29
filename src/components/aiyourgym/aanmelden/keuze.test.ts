import { describe, expect, it } from 'vitest'
import { gekozenVan, wisselPakket } from './keuze'
import type { PakketKeuze } from './types'

const p = (sleutel: PakketKeuze['sleutel'], stripe: boolean): PakketKeuze => ({ sleutel, naam: sleutel, voorWie: '', inbegrepen: [], stripe })
const LIJST = [p('lessen', true), p('groei', false), p('training', true)]

describe('keuze van losse pakketten bij het aanmelden', () => {
  it('niets gekozen: nog niets', () => {
    expect(gekozenVan(LIJST, [], true, 'nl')).toBeNull()
  })
  it('alle gekozen pakketten met een Stripe-prijs: betalen via Stripe', () => {
    expect(gekozenVan(LIJST, ['lessen', 'training'], true, 'nl')).toEqual({ naam: 'Groepslessen en Training en coaching', open: true, test: false })
  })
  it('een pakket zonder prijs erbij: testbetaling, of een aanvraag als die uit staat', () => {
    expect(gekozenVan(LIJST, ['lessen', 'groei'], true, 'nl')).toMatchObject({ open: true, test: true })
    expect(gekozenVan(LIJST, ['lessen', 'groei'], false, 'nl')).toMatchObject({ open: false, test: false })
  })
  it('aan- en uitvinken houdt de vaste volgorde en wijzigt nooit in place', () => {
    const begin = ['groei'] as const
    expect(wisselPakket(begin, 'lessen')).toEqual(['lessen', 'groei'])
    expect(wisselPakket(['lessen', 'groei'], 'lessen')).toEqual(['groei'])
    expect(begin).toEqual(['groei'])
  })
})
