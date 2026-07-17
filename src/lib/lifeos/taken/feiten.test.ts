// Tests voor de woorden bij de vier feiten. Klein bestand, maar één zin hier is
// wat de gebruiker leest in plaats van een verzonnen positie in de lijst — dus
// die zin moet kloppen, en hij moet Nederlands zijn.

import { describe, expect, it } from 'vitest'
import type { TaakFeit } from '@/lib/lifeos/taken/prioriteit'
import { ENERGIE_LABEL, ENERGIE_UITLEG, FEIT_LABEL, geenOordeelZin, IMPACT_SCHAAL } from './feiten'

describe('geenOordeelZin', () => {
  // De kern: dit is de tekst die in de plaats komt van een score. Hij moet
  // zeggen wat er ontbreekt, niet dat de taak onbelangrijk is.
  it('noemt beide ontbrekende feiten en zegt dat één genoeg is', () => {
    const zin = geenOordeelZin(['impact', 'deadline'])

    expect(zin).toContain('impact en deadline')
    expect(zin).toContain('Eén ervan is genoeg')
  })

  it('noemt alleen het feit dat een score in de weg staat', () => {
    // 'inspanning' en 'energie' ontbreken ook, maar die wegen niet mee in de
    // score — ze noemen zou de gebruiker naar het verkeerde veld sturen.
    const zin = geenOordeelZin(['impact', 'inspanning', 'energie'])

    expect(zin).toContain('impact')
    expect(zin).not.toContain('tijdsinschatting')
    expect(zin).not.toContain('energie')
  })

  it('somt netjes op met "en" in plaats van een komma aan het eind', () => {
    expect(geenOordeelZin(['deadline'])).toContain('deadline onbekend')
    expect(geenOordeelZin(['impact', 'deadline'])).not.toContain('impact, deadline')
  })

  it('valt terug op een korte zin als er niets bruikbaars ontbreekt', () => {
    expect(geenOordeelZin([])).toBe('Nog geen oordeel.')
    expect(geenOordeelZin(['energie'])).toBe('Nog geen oordeel.')
  })
})

describe('de woordenlijst', () => {
  it('heeft een label voor elk feit', () => {
    const feiten: TaakFeit[] = ['impact', 'deadline', 'inspanning', 'energie']

    for (const feit of feiten) {
      expect(FEIT_LABEL[feit].length).toBeGreaterThan(0)
    }
  })

  // 'inspanning' heet in de UI 'tijdsinschatting': dat is wat je invult
  // (minuten), niet hoe zwaar het voelt — dat is 'energie'.
  it('noemt inspanning een tijdsinschatting, niet een inspanning', () => {
    expect(FEIT_LABEL.inspanning).toBe('tijdsinschatting')
  })

  it('dekt de hele impact-schaal 1 tot en met 5', () => {
    expect(IMPACT_SCHAAL.map((s) => s.waarde)).toEqual([1, 2, 3, 4, 5])
    expect(IMPACT_SCHAAL.every((s) => s.label.length > 0)).toBe(true)
  })

  // De uiteinden komen uit migratie 100 en horen niet stilletjes te verschuiven:
  // 1 = ruis, 5 = dit verandert iets.
  it('houdt de uiteinden van de schaal zoals migratie 100 ze beschrijft', () => {
    expect(IMPACT_SCHAAL[0]?.label).toBe('Ruis')
    expect(IMPACT_SCHAAL[4]?.label).toBe('Verandert iets')
  })

  it('heeft een label en een uitleg voor elk energieniveau', () => {
    expect(ENERGIE_LABEL.laag).toBe('Laag')
    expect(ENERGIE_LABEL.hoog).toBe('Hoog')
    expect(ENERGIE_UITLEG.hoog).toContain('diep werk')
  })
})
