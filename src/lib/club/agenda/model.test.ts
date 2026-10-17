import { describe, expect, test } from 'vitest'
import { agendaUitRij, formWaarden, herhalingen, leesAgendaInvoer, leesHerhaal, perDag, tijdLabel, type AgendaItem } from './model'

const basis = { vestiging: 'budel', titel: '  Teamoverleg  ', datum: '2026-10-20', begin: '09:00', eind: '10:30', soort: 'overleg' }

describe('leesAgendaInvoer', () => {
  test('Nederlandse tijd naar UTC (zomertijd en wintertijd)', () => {
    const r = leesAgendaInvoer(basis)
    expect(r.ok && r.waarde).toMatchObject({ titel: 'Teamoverleg', soort: 'overleg', beginOp: '2026-10-20T07:00:00.000Z', eindOp: '2026-10-20T08:30:00.000Z', heleDag: false })
    const winter = leesAgendaInvoer({ ...basis, datum: '2026-12-01' })
    expect(winter.ok && winter.waarde.beginOp).toBe('2026-12-01T08:00:00.000Z')
  })
  test('hele dag: 00:00 tot 23:59, tijden worden genegeerd', () => {
    const r = leesAgendaInvoer({ ...basis, heleDag: true, begin: 'x', eind: 'y' })
    expect(r.ok && formWaarden(r.waarde)).toEqual({ datum: '2026-10-20', begin: '00:00', eind: '23:59' })
  })
  test('fouten: geen titel, geen datum, eind vóór begin, onbekende vestiging; onbekende soort = afspraak', () => {
    expect(leesAgendaInvoer({ ...basis, titel: ' ' }).ok).toBe(false)
    expect(leesAgendaInvoer({ ...basis, datum: 'morgen' }).ok).toBe(false)
    expect(leesAgendaInvoer({ ...basis, begin: '11:00', eind: '10:00' }).ok).toBe(false)
    expect(leesAgendaInvoer({ ...basis, vestiging: 'Mars!' }).ok).toBe(false)
    const r = leesAgendaInvoer({ ...basis, soort: 'feest', medewerkerId: 'geen-uuid' })
    expect(r.ok && [r.waarde.soort, r.waarde.medewerkerId]).toEqual(['afspraak', null])
  })
})

describe('weekweergave', () => {
  const item = (id: string, beginOp: string, eindOp: string, heleDag = false): AgendaItem => ({
    id, vestiging: 'budel', titel: id, soort: 'afspraak', beginOp, eindOp, heleDag, medewerkerId: null, notitie: null, auteur: null,
  })
  test('perDag: zeven dagen, hele dag eerst, dan op tijd; avond in NL valt op de goede dag', () => {
    const items = [
      item('laat', '2026-10-20T15:00:00.000Z', '2026-10-20T16:00:00.000Z'),
      item('vroeg', '2026-10-20T06:00:00.000Z', '2026-10-20T07:00:00.000Z'),
      item('dag', '2026-10-19T22:00:00.000Z', '2026-10-20T21:59:00.000Z', true),
      item('nacht', '2026-10-20T22:30:00.000Z', '2026-10-20T23:00:00.000Z'), // 00:30 op woensdag
    ]
    const week = perDag(items, '2026-10-19')
    expect(week).toHaveLength(7)
    expect(week[1].items.map((a) => a.id)).toEqual(['dag', 'vroeg', 'laat'])
    expect(week[2].items.map((a) => a.id)).toEqual(['nacht'])
  })
  test('tijdLabel en rij inlezen', () => {
    expect(tijdLabel(item('x', '2026-10-20T07:00:00.000Z', '2026-10-20T08:30:00.000Z'))).toBe('09:00 – 10:30')
    expect(tijdLabel(item('x', '2026-10-20T07:00:00.000Z', '2026-10-20T08:30:00.000Z', true))).toBe('Hele dag')
    expect(agendaUitRij({ id: 'a', vestiging: 'budel', titel: 'T', soort: '?', begin_op: '2026-10-20T07:00:00+00:00', eind_op: '2026-10-20T08:00:00+00:00' }))
      .toMatchObject({ soort: 'afspraak', beginOp: '2026-10-20T07:00:00.000Z', heleDag: false })
    expect(agendaUitRij({ id: 'a', vestiging: 'mars' })).toBeNull()
  })
})

describe('herhalen', () => {
  test('leesHerhaal: 0 tot en met 26', () => {
    expect(leesHerhaal({})).toBe(0)
    expect(leesHerhaal({ herhaalWeken: '4' })).toBe(4)
    expect(leesHerhaal({ herhaalWeken: 99 })).toBe(26)
    expect(leesHerhaal({ herhaalWeken: -2 })).toBe(0)
    expect(leesHerhaal({ herhaalWeken: 1.5 })).toBe(0)
  })
  test('elke week dezelfde kloktijd, ook over de wintertijd heen', () => {
    const r = leesAgendaInvoer(basis)
    if (!r.ok) throw new Error(r.fout)
    const reeks = herhalingen(r.waarde, 2)
    expect(reeks.map((a) => a.beginOp)).toEqual(['2026-10-20T07:00:00.000Z', '2026-10-27T08:00:00.000Z', '2026-11-03T08:00:00.000Z'])
    expect(reeks.map((a) => formWaarden(a).begin)).toEqual(['09:00', '09:00', '09:00'])
  })
})
