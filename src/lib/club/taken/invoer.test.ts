import { describe, expect, it } from 'vitest'
import {
  leesAfsluitInvoer,
  leesAfvinkInvoer,
  leesKopieerInvoer,
  leesLijstWijziging,
  leesNieuweTaak,
  leesNotitieInvoer,
  leesTaakWijziging,
  leesVakInvoer,
  magAfvinkenOp,
  netteTekst,
} from './invoer'

const TAAK = '3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f'
const VANDAAG = '2026-10-14'

describe('netteTekst', () => {
  it('snijdt bij en haalt dubbele spaties weg', () => {
    expect(netteTekst('  Kassa   telling ', 40)).toBe('Kassa telling')
  })
  it('weigert leeg, te lang en geen tekst', () => {
    expect(netteTekst('   ', 10)).toBeNull()
    expect(netteTekst('x'.repeat(11), 10)).toBeNull()
    expect(netteTekst(5, 10)).toBeNull()
  })
})

describe('magAfvinkenOp', () => {
  it('mag vandaag en terug, niet in de toekomst of heel lang geleden', () => {
    expect(magAfvinkenOp(VANDAAG, VANDAAG)).toBe(true)
    expect(magAfvinkenOp('2026-10-01', VANDAAG)).toBe(true)
    expect(magAfvinkenOp('2026-10-15', VANDAAG)).toBe(false)
    expect(magAfvinkenOp('2026-06-01', VANDAAG)).toBe(false)
  })
})

describe('leesAfvinkInvoer', () => {
  it('accepteert initialen zonder medewerker', () => {
    expect(leesAfvinkInvoer({ taakId: TAAK, datum: VANDAAG, wie: ' LM ' }, VANDAAG)).toEqual({
      ok: true,
      waarde: { taakId: TAAK, datum: VANDAAG, medewerkerId: null, wie: 'LM' },
    })
  })
  it('weigert zonder wie, met een vreemde medewerker of op een toekomstige dag', () => {
    expect(leesAfvinkInvoer({ taakId: TAAK, datum: VANDAAG }, VANDAAG).ok).toBe(false)
    expect(leesAfvinkInvoer({ taakId: TAAK, datum: VANDAAG, wie: 'LM', medewerkerId: 'x' }, VANDAAG).ok).toBe(false)
    expect(leesAfvinkInvoer({ taakId: TAAK, datum: '2026-10-15', wie: 'LM' }, VANDAAG).ok).toBe(false)
    expect(leesAfvinkInvoer({ taakId: 'nee', datum: VANDAAG, wie: 'LM' }, VANDAAG).ok).toBe(false)
    expect(leesAfvinkInvoer(null, VANDAAG).ok).toBe(false)
  })
})

describe('leesVakInvoer', () => {
  it('controleert taak en datum uit de zoekparameters', () => {
    expect(leesVakInvoer(TAAK, VANDAAG, VANDAAG).ok).toBe(true)
    expect(leesVakInvoer(TAAK, '2026-02-30', VANDAAG).ok).toBe(false)
    expect(leesVakInvoer(null, VANDAAG, VANDAAG).ok).toBe(false)
  })
})

describe('leesNotitieInvoer en leesAfsluitInvoer', () => {
  it('vraagt een vestiging, tekst en wie', () => {
    const goed = leesNotitieInvoer({ vestiging: 'budel', datum: VANDAAG, tekst: 'Ramen gelapt', wie: 'Lynn' }, VANDAAG)
    expect(goed.ok).toBe(true)
    expect(leesNotitieInvoer({ vestiging: 'Parijs!', datum: VANDAAG, tekst: 'x', wie: 'L' }, VANDAAG).ok).toBe(false)
    expect(leesNotitieInvoer({ vestiging: 'budel', datum: VANDAAG, tekst: ' ', wie: 'L' }, VANDAAG).ok).toBe(false)
    expect(leesAfsluitInvoer({ vestiging: 'budel', wie: 'Lynn' }).ok).toBe(true)
    expect(leesAfsluitInvoer({ vestiging: 'budel' }).ok).toBe(false)
  })
})

describe('taken en lijsten', () => {
  it('leest een nieuwe weektaak met minimum', () => {
    const r = leesNieuweTaak({ lijstId: TAAK, naam: 'Stofzuigen kracht', groep: 'Minimaal 3x per week', frequentie: 'per_week', perWeekMin: 3, moment: 'vrij' })
    expect(r).toEqual({ ok: true, waarde: { lijstId: TAAK, naam: 'Stofzuigen kracht', groep: 'Minimaal 3x per week', frequentie: 'per_week', perWeekMin: 3, moment: 'vrij' } })
  })
  it('vraagt een minimum bij per week en negeert het bij elke dag', () => {
    expect(leesNieuweTaak({ lijstId: TAAK, naam: 'X', frequentie: 'per_week', moment: 'vrij' }).ok).toBe(false)
    expect(leesNieuweTaak({ lijstId: TAAK, naam: 'X', frequentie: 'per_week', perWeekMin: 8, moment: 'vrij' }).ok).toBe(false)
    const r = leesNieuweTaak({ lijstId: TAAK, naam: 'X', frequentie: 'dagelijks', perWeekMin: 3, moment: 'ochtend' })
    expect(r.ok && r.waarde.perWeekMin).toBeNull()
  })
  it('herkent verplaatsen, aan/uit en velden', () => {
    expect(leesTaakWijziging({ verplaats: 'omhoog' })).toEqual({ ok: true, waarde: { soort: 'verplaats', richting: 'omhoog' } })
    expect(leesTaakWijziging({ actief: false })).toEqual({ ok: true, waarde: { soort: 'actief', actief: false } })
    expect(leesTaakWijziging({ naam: 'Y', frequentie: 'extra', moment: 'vrij' }).ok).toBe(true)
    expect(leesTaakWijziging({ naam: 'Y', frequentie: 'soms', moment: 'vrij' }).ok).toBe(false)
    expect(leesLijstWijziging({ naam: ' Poetsrooster ' })).toEqual({ ok: true, waarde: { soort: 'naam', naam: 'Poetsrooster' } })
    expect(leesLijstWijziging({}).ok).toBe(false)
  })
  it('kopieert niet naar dezelfde vestiging', () => {
    expect(leesKopieerInvoer({ van: 'budel', naar: 'budel' }).ok).toBe(false)
    expect(leesKopieerInvoer({ van: 'budel', naar: 'bergeijk' }).ok).toBe(true)
  })
})
