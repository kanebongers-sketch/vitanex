import { describe, expect, it } from 'vitest'
import { telPerLes } from './raster'
import { reserveringNaam, reserveringUitRij, rijenNaar } from './typen'

const rij = (id: string, lid: string | null, status: string) => ({ id, les_id: 'les1', lid_id: lid, status, wachtpositie: null, geboekt_op: '2026-10-01T08:00:00Z', bron: 'app' })

describe('reserveringUitRij', () => {
  it('houdt een reservering zonder lid (verwijderd na AVG) over', () => {
    expect(reserveringUitRij(rij('r1', null, 'aanwezig'))).toMatchObject({ id: 'r1', lesId: 'les1', lidId: null, status: 'aanwezig' })
  })

  it('laat een rij zonder les of met een onbekende status vallen', () => {
    expect(reserveringUitRij({ ...rij('r1', 'l1', 'aanwezig'), les_id: null })).toBeNull()
    expect(reserveringUitRij(rij('r1', 'l1', 'kwijt'))).toBeNull()
  })

  it('telt geanonimiseerde reserveringen mee in de bezetting van een afgelopen les', () => {
    // Arrange: drie aanwezig, waarvan een lid inmiddels is verwijderd.
    const rijen = rijenNaar([rij('r1', 'l1', 'aanwezig'), rij('r2', null, 'aanwezig'), rij('r3', 'l3', 'no_show')], reserveringUitRij)
    // Act
    const telling = telPerLes(rijen).get('les1')
    // Assert
    expect(telling).toMatchObject({ geboekt: 3, aanwezig: 2, noShow: 1 })
  })
})

describe('reserveringNaam', () => {
  it('toont de naam, "Verwijderd lid" of "Onbekend lid"', () => {
    expect(reserveringNaam({ voornaam: 'Sanne', achternaam: 'de Vries' }, 'l1')).toBe('Sanne de Vries')
    expect(reserveringNaam(null, null)).toBe('Verwijderd lid')
    expect(reserveringNaam(null, 'l1')).toBe('Onbekend lid')
  })
})
