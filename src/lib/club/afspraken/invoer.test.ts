import { describe, expect, it } from 'vitest'
import { leesAfspraakPatch, leesAppBoeking, leesNieuweAfspraak, leesSlotVraag, leesType } from './invoer'

const ID = '11111111-2222-4333-8444-555555555555'
const ID2 = '66666666-7777-4888-9999-aaaaaaaaaaaa'

const nieuw = { vestiging: 'budel', typeId: ID, medewerkerId: ID, lidId: ID2, datum: '2026-10-20', tijd: '09:15' }

describe('leesNieuweAfspraak', () => {
  it('leest een volledige afspraak', () => {
    // Act
    const uit = leesNieuweAfspraak({ ...nieuw, notitie: '  eerste keer  ', geboektDoor: 'trainer' })
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { ...nieuw, leadId: null, notitie: 'eerste keer', geboektDoor: 'trainer' } })
  })

  it('maakt van een onbekende boeker de balie', () => {
    const uit = leesNieuweAfspraak({ ...nieuw, geboektDoor: 'app' })
    expect(uit.ok && uit.waarde.geboektDoor).toBe('balie')
  })

  it('normaliseert een tijd met seconden', () => {
    const uit = leesNieuweAfspraak({ ...nieuw, tijd: '09:15:00' })
    expect(uit.ok && uit.waarde.tijd).toBe('09:15')
  })

  it.each([
    [{ ...nieuw, lidId: undefined }, 'Kies een lid.'],
    [{ ...nieuw, medewerkerId: 'x' }, 'Kies een trainer.'],
    [{ ...nieuw, typeId: null }, 'Kies een soort afspraak.'],
    [{ ...nieuw, vestiging: 'Budel!' }, 'Onbekende vestiging.'],
    [{ ...nieuw, datum: '2026-02-30' }, 'Kies een geldige datum.'],
    [{ ...nieuw, tijd: '09:17' }, 'Kies een geldige begintijd (per 5 minuten).'],
    [{ ...nieuw, leadId: 'geen-uuid' }, 'Onbekende lead.'],
    [{ ...nieuw, notitie: 'x'.repeat(1001) }, 'De notitie is te lang (hooguit 1000 tekens).'],
  ])('weigert foute invoer met een nette melding', (body, melding) => {
    expect(leesNieuweAfspraak(body)).toEqual({ ok: false, fout: melding })
  })

  it('weigert iets dat geen object is', () => {
    expect(leesNieuweAfspraak([1]).ok).toBe(false)
  })
})

describe('leesAfspraakPatch', () => {
  it('leest een status', () => {
    expect(leesAfspraakPatch({ status: 'geweest' })).toEqual({ ok: true, waarde: { soort: 'status', status: 'geweest' } })
  })

  it('weigert een onbekende status', () => {
    expect(leesAfspraakPatch({ status: 'weg' }).ok).toBe(false)
  })

  it('leest verplaatsen met trainer', () => {
    const uit = leesAfspraakPatch({ datum: '2026-10-21', tijd: '18:00', medewerkerId: ID })
    expect(uit).toEqual({ ok: true, waarde: { soort: 'verplaats', datum: '2026-10-21', tijd: '18:00', medewerkerId: ID } })
  })

  it('wil bij verplaatsen een trainer', () => {
    expect(leesAfspraakPatch({ datum: '2026-10-21', tijd: '18:00' })).toEqual({ ok: false, fout: 'Kies een trainer.' })
  })

  it('maakt van een lege notitie null', () => {
    expect(leesAfspraakPatch({ notitie: '   ' })).toEqual({ ok: true, waarde: { soort: 'notitie', notitie: null } })
  })

  it('weigert een lege wijziging', () => {
    expect(leesAfspraakPatch({})).toEqual({ ok: false, fout: 'Er is niets om te wijzigen.' })
  })
})

describe('leesType', () => {
  const type = { naam: 'Intake', duurMin: 45, bufferMin: 15, kleur: 'amber', medewerkerIds: [ID, ID], appBoekbaar: true, boekenUrenVooraf: 24, annulerenUrenVooraf: '12', actief: true }

  it('leest een type en haalt dubbele medewerkers weg', () => {
    const uit = leesType(type)
    expect(uit).toEqual({ ok: true, waarde: { ...type, medewerkerIds: [ID], annulerenUrenVooraf: 12 } })
  })

  it.each([
    [{ ...type, naam: '' }, 'Geef het type een naam (hooguit 80 tekens).'],
    [{ ...type, duurMin: 3 }, 'De duur moet tussen 5 en 480 minuten liggen.'],
    [{ ...type, duurMin: 30.5 }, 'De duur moet tussen 5 en 480 minuten liggen.'],
    [{ ...type, bufferMin: 200 }, 'De buffer moet tussen 0 en 120 minuten liggen.'],
    [{ ...type, kleur: 'paars' }, 'Kies een kleur uit de lijst.'],
    [{ ...type, medewerkerIds: ['x'] }, 'Onbekende medewerker in de lijst.'],
    [{ ...type, boekenUrenVooraf: 400 }, 'Uren van tevoren moet tussen 0 en 336 liggen.'],
  ])('weigert een fout type', (body, melding) => {
    expect(leesType(body)).toEqual({ ok: false, fout: melding })
  })

  it('vult ontbrekende buffer en uren met 0', () => {
    const uit = leesType({ naam: 'Meting', duurMin: 30, kleur: 'groen' })
    expect(uit.ok && [uit.waarde.bufferMin, uit.waarde.boekenUrenVooraf, uit.waarde.medewerkerIds]).toEqual([0, 0, []])
  })
})

describe('leesSlotVraag', () => {
  it('leest de parameters, leeg medewerker is maakt niet uit', () => {
    const uit = leesSlotVraag(new URLSearchParams({ v: 'budel', type: ID, datum: '2026-10-20', medewerker: '' }))
    expect(uit).toEqual({ ok: true, waarde: { vestiging: 'budel', typeId: ID, datum: '2026-10-20', medewerkerId: null } })
  })

  it('weigert een ongeldige datum', () => {
    expect(leesSlotVraag(new URLSearchParams({ v: 'budel', type: ID, datum: 'morgen' })).ok).toBe(false)
  })
})

describe('leesAppBoeking', () => {
  it('leest een boeking zonder trainer', () => {
    const uit = leesAppBoeking({ lidId: ID2, typeId: ID, medewerkerId: null, datum: '2026-10-20', tijd: '10:00' })
    expect(uit).toEqual({ ok: true, waarde: { lidId: ID2, typeId: ID, medewerkerId: null, datum: '2026-10-20', tijd: '10:00' } })
  })

  it('weigert een onbekend lid', () => {
    expect(leesAppBoeking({ lidId: 'x', typeId: ID, datum: '2026-10-20', tijd: '10:00' })).toEqual({ ok: false, fout: 'Onbekend lid.' })
  })
})
