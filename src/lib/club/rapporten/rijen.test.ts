import { describe, expect, it } from 'vitest'
import { afspraakUitRij, checkinUitRij, lidRapportUitRij, namenUitRijen, opvolgUitRij, reserveringRapportUitRij } from './rijen'

describe('rijen (systeemgrens)', () => {
  it('leest een lid zonder geboortedatum of geslacht mee te nemen', () => {
    const l = lidRapportUitRij({ id: 'a', vestiging: 'budel', voornaam: 'Anna', achternaam: 'Jansen', status: 'actief', lid_sinds: '2026-01-02', geboortedatum: '1990-01-01', geslacht: 'vrouw' })
    expect(l).toEqual({ id: 'a', vestiging: 'budel', lidnummer: null, voornaam: 'Anna', achternaam: 'Jansen', email: null, telefoon: null, abonnement: null, status: 'actief', lidSinds: '2026-01-02', einddatum: null })
    expect(Object.keys(l ?? {})).not.toContain('geboortedatum')
  })

  it('weigert rijen met een onbekende status of vestiging', () => {
    expect(lidRapportUitRij({ id: 'a', vestiging: 'budel', status: 'vip' })).toBeNull()
    expect(checkinUitRij({ lid_id: 'a', vestiging: 'X Y', op: '2026-09-01T10:00:00Z' })).toBeNull()
    expect(reserveringRapportUitRij({ les_id: 'l', status: 'misschien' })).toBeNull()
    expect(opvolgUitRij({ vestiging: 'budel', regel: 'welkom', status: 'open', afgehandeld_op: '2026-09-01T10:00:00Z' })).toBeNull()
  })

  it('leest het type van een afspraak uit de ingesloten relatie', () => {
    const a = afspraakUitRij({ vestiging: 'budel', medewerker_id: 'm', lid_id: 'l', start_op: '2026-09-01T10:00:00Z', eind_op: '2026-09-01T11:00:00Z', status: 'geweest', club_afspraak_typen: { naam: 'Intake' } })
    expect(a?.type).toBe('Intake')
  })

  it('namenUitRijen slaat rommel over', () => {
    expect([...namenUitRijen([{ id: 'm1', naam: 'Sanne' }, { id: 'm2' }, null, 'x'])]).toEqual([['m1', 'Sanne']])
  })
})
