import { describe, expect, it } from 'vitest'
import { afspraakUitRij, rijen, telt, typeUitRij } from './model'

const ID = '11111111-2222-4333-8444-555555555555'

describe('typeUitRij', () => {
  it('leest een volledige rij', () => {
    // Arrange
    const rij = { id: ID, naam: 'Intake', duur_min: 45, buffer_min: 15, kleur: 'groen', medewerker_ids: [ID, 3], app_boekbaar: false, boeken_uren_vooraf: 24, annuleren_uren_vooraf: 12, actief: true, volgorde: 2 }
    // Act
    const type = typeUitRij(rij)
    // Assert
    expect(type).toEqual({ id: ID, naam: 'Intake', duurMin: 45, bufferMin: 15, kleur: 'groen', medewerkerIds: [ID], appBoekbaar: false, boekenUrenVooraf: 24, annulerenUrenVooraf: 12, actief: true, volgorde: 2 })
  })

  it('valt terug op veilige standaarden', () => {
    const type = typeUitRij({ id: ID, naam: 'PT', duur_min: '30', kleur: 'neon' })
    expect(type).toMatchObject({ duurMin: 30, bufferMin: 0, kleur: 'amber', medewerkerIds: [], appBoekbaar: true, actief: true })
  })

  it('weigert een rij zonder naam of met een te korte duur', () => {
    expect(typeUitRij({ id: ID, naam: '', duur_min: 30 })).toBeNull()
    expect(typeUitRij({ id: ID, naam: 'X', duur_min: 2 })).toBeNull()
    expect(typeUitRij(null)).toBeNull()
  })
})

describe('afspraakUitRij', () => {
  const rij = {
    id: ID,
    vestiging: 'budel',
    type_id: ID,
    medewerker_id: ID,
    lid_id: ID,
    lead_id: null,
    start_op: '2026-10-20T08:00:00+00:00',
    eind_op: '2026-10-20T08:45:00+00:00',
    bezet_tot: '2026-10-20T09:00:00+00:00',
    status: 'gepland',
    notitie: '',
    geboekt_door: 'app',
    demo: true,
  }

  it('leest een rij met ISO-tijden', () => {
    const a = afspraakUitRij(rij)
    expect(a).toMatchObject({ start: '2026-10-20T08:00:00.000Z', bezetTot: '2026-10-20T09:00:00.000Z', notitie: null, geboektDoor: 'app', demo: true })
  })

  it('maakt van een onbekende status gepland en van een onbekende boeker de balie', () => {
    expect(afspraakUitRij({ ...rij, status: 'x', geboekt_door: 'y' })).toMatchObject({ status: 'gepland', geboektDoor: 'balie' })
  })

  it('gebruikt het eind als bezet_tot ontbreekt', () => {
    expect(afspraakUitRij({ ...rij, bezet_tot: null })?.bezetTot).toBe('2026-10-20T08:45:00.000Z')
  })

  it('weigert een rij zonder geldige tijd of vestiging', () => {
    expect(afspraakUitRij({ ...rij, start_op: 'gisteren' })).toBeNull()
    expect(afspraakUitRij({ ...rij, vestiging: 'Budel Centrum' })).toBeNull()
  })
})

describe('telt en rijen', () => {
  it('telt geannuleerde afspraken niet mee', () => {
    expect(telt({ status: 'geannuleerd' })).toBe(false)
    expect(telt({ status: 'niet_gekomen' })).toBe(true)
  })

  it('laat onbruikbare rijen weg', () => {
    expect(rijen([{ id: ID, naam: 'A', duur_min: 30 }, null], typeUitRij)).toHaveLength(1)
    expect(rijen('geen lijst', typeUitRij)).toEqual([])
  })
})
