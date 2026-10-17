import { describe, expect, it } from 'vitest'
import { standaardRegel } from './regels'
import { groepeerPerRegel, taakUitRij, type Taak } from './taken'
import { naarGroepen, naarItem, type Context } from './weergave'

const MW = '11111111-2222-4333-8444-555555555555'

function taak(over: Record<string, unknown> = {}): Taak {
  return taakUitRij({
    id: 't1',
    lid_id: 'l1',
    vestiging: 'budel',
    regel: 'niet_gezien',
    periode: '2026-10-01',
    waarde: 16,
    reden: 'Al 16 dagen niet geweest',
    status: 'open',
    rol: null,
    medewerker_id: MW,
    aangemaakt_op: '2026-10-17T08:00:00Z',
    club_leden: { voornaam: 'Sanne', achternaam: 'de Vries', telefoon: null, email: null },
    ...over,
  }) as Taak
}

const CTX: Context = {
  vestigingNaam: 'Budel',
  regels: [{ ...standaardRegel('niet_gezien'), sjabloon: 'Hoi {voornaam}, {dagen} dagen weg uit {vestiging}.' }],
  medewerkers: new Map([[MW, 'Joris']]),
}

describe('naarItem', () => {
  it('vult de voorbeeldtekst met de ingestelde tekst van de regel', () => {
    // Arrange
    const t = taak()
    // Act
    const item = naarItem(t, CTX)
    // Assert
    expect(item).toMatchObject({ naam: 'Sanne de Vries', initialen: 'SV', wie: 'Joris', tekst: 'Hoi Sanne, 16 dagen weg uit Budel.', sinds: '2026-10-17', regelTitel: 'Lang niet gezien' })
  })

  it('valt terug op de standaardtekst als de regel ontbreekt', () => {
    const item = naarItem(taak({ regel: 'verjaardag', waarde: 30 }), CTX)
    expect(item.tekst).toBe('Gefeliciteerd met je verjaardag, Sanne! Een hele fijne dag gewenst namens iedereen van Budel.')
  })

  it('toont iets bruikbaars zonder lid', () => {
    const item = naarItem(taak({ club_leden: null }), CTX)
    expect(item.naam).toBe('Onbekend lid')
  })
})

describe('naarGroepen', () => {
  it('geeft titel en uitleg per groep', () => {
    const groepen = naarGroepen(groepeerPerRegel([taak()]), CTX)
    expect(groepen).toHaveLength(1)
    expect(groepen[0]).toMatchObject({ regel: 'niet_gezien', titel: 'Lang niet gezien' })
    expect(groepen[0].items[0].id).toBe('t1')
  })
})
