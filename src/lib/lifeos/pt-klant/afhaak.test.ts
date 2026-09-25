import { describe, expect, test } from 'vitest'
import { bepaalAfhaak } from './afhaak'
import type { PtKlant, PtEvent } from './pt-klant'
import type { Abonnement } from '../crm/crm'

const NU = new Date('2026-09-15T12:00:00Z')
const DAG = 24 * 60 * 60 * 1000

function klant(naam: string, abonnement: Abonnement | null, vakantieTot: string | null = null): PtKlant {
  return { id: naam.toLowerCase(), naam, email: null, abonnement, duo: false, locatie: null, vakantieTot }
}

/** Een PT-sessie `dagen` dagen vóór NU (negatief = in de toekomst). */
function sessie(naam: string, dagen: number): PtEvent {
  return { titel: `PT ${naam}`, startOp: new Date(NU.getTime() - dagen * DAG).toISOString() }
}

describe('bepaalAfhaak', () => {
  test('weekklant die 25 dagen niet kwam → afgehaakt, 3 weken geleden', () => {
    const uit = bepaalAfhaak([klant('Kevin', 'wekelijks_1')], [sessie('Kevin', 25)], NU)
    expect(uit).toEqual([{ id: 'kevin', naam: 'Kevin', wekenGeleden: 3 }])
  })

  test('weekklant op ritme (10 dagen) → geen signaal', () => {
    expect(bepaalAfhaak([klant('Kevin', 'wekelijks_1')], [sessie('Kevin', 10)], NU)).toEqual([])
  })

  test('2-wekelijkse klant volgt een ruimere drempel (28 dagen)', () => {
    // 25 dagen is voor een 2-wekelijkse klant nog normaal ritme.
    expect(bepaalAfhaak([klant('Iris', 'tweewekelijks_1')], [sessie('Iris', 25)], NU)).toEqual([])
    // 30 dagen is dat niet meer.
    expect(bepaalAfhaak([klant('Iris', 'tweewekelijks_1')], [sessie('Iris', 30)], NU)).toEqual([
      { id: 'iris', naam: 'Iris', wekenGeleden: 4 },
    ])
  })

  test('op vakantie telt niet als afhaken', () => {
    const uit = bepaalAfhaak([klant('Elize', 'wekelijks_1', '2026-09-20')], [sessie('Elize', 40)], NU)
    expect(uit).toEqual([])
  })

  test('net terug van vakantie → stilte telt vanaf de laatste vakantiedag', () => {
    // Laatste sessie 30 dagen terug, maar t/m 10 sep op vakantie (5 dagen geleden).
    expect(bepaalAfhaak([klant('Elize', 'wekelijks_1', '2026-09-10')], [sessie('Elize', 30)], NU)).toEqual([])
    // Vakantie al lang voorbij (t/m 1 aug): dan telt de stilte gewoon.
    expect(bepaalAfhaak([klant('Elize', 'wekelijks_1', '2026-08-01')], [sessie('Elize', 30)], NU)).toEqual([
      { id: 'elize', naam: 'Elize', wekenGeleden: 4 },
    ])
  })

  test('klant zonder énige sessie in het venster → niet flaggen (geen verzonnen zorg)', () => {
    expect(bepaalAfhaak([klant('Nieuw', 'wekelijks_1')], [], NU)).toEqual([])
  })

  test('alleen een toekomstige boeking telt niet als "gezien"', () => {
    // Enkel een sessie 3 dagen ín de toekomst; geen historie → geen signaal.
    expect(bepaalAfhaak([klant('Tom', 'wekelijks_1')], [sessie('Tom', -3)], NU)).toEqual([])
  })

  test('een recente sessie beschermt, ook al staat er ook een oude', () => {
    const uit = bepaalAfhaak([klant('Sanne', 'wekelijks_1')], [sessie('Sanne', 40), sessie('Sanne', 5)], NU)
    expect(uit).toEqual([])
  })

  test('langst-niet-gezien eerst', () => {
    const klanten = [klant('Anna', 'wekelijks_1'), klant('Bram', 'wekelijks_1')]
    const events = [sessie('Anna', 22), sessie('Bram', 40)]
    expect(bepaalAfhaak(klanten, events, NU).map((a) => a.naam)).toEqual(['Bram', 'Anna'])
  })
})
