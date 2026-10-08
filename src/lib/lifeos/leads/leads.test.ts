import { describe, expect, test } from 'vitest'
import { leadRegel, leesLeadSamenvatting, leesNieuweLead, linkCodeVoor, slugVoorNaam, vatLeadsSamen, CODE_PATROON, type Lead } from './leads'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l1', naam: 'Sanne', contact: null, bron: 'gym', status: 'gesproken', notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})

describe('lead invoer', () => {
  test('geldig, met standaardstatus en -datum', () => {
    expect(leesNieuweLead({ naam: '  Sanne  de Vries ', bron: 'gym' }, '2026-10-08')).toEqual({
      ok: true, waarde: { naam: 'Sanne de Vries', contact: null, bron: 'gym', status: 'gesproken', notitie: null, gesprokenOp: '2026-10-08' },
    })
  })
  test('fouten: geen naam, onbekende bron, datum in de toekomst', () => {
    expect(leesNieuweLead({ bron: 'gym' }, '2026-10-08').ok).toBe(false)
    expect(leesNieuweLead({ naam: 'X', bron: 'tiktok' }, '2026-10-08').ok).toBe(false)
    expect(leesNieuweLead({ naam: 'X', bron: 'gym', gesprokenOp: '2026-10-09' }, '2026-10-08').ok).toBe(false)
  })
  test('te lange velden worden ingekort', () => {
    const r = leesNieuweLead({ naam: 'a'.repeat(300), bron: 'anders', notitie: 'b'.repeat(900) }, '2026-10-08')
    expect(r.ok && r.waarde.naam.length).toBe(120)
    expect(r.ok && r.waarde.notitie?.length).toBe(500)
  })
})

describe('link-code', () => {
  test('gewoon de naam; bij een dubbele naam een volgnummer', () => {
    expect(slugVoorNaam('Joëy van Dijk')).toBe('joey-van-dijk')
    expect(linkCodeVoor('Joey', new Set())).toBe('joey')
    expect(linkCodeVoor('Joey', new Set(['joey', 'joey-2']))).toBe('joey-3')
    expect(CODE_PATROON.test('joey')).toBe(true)
    expect(CODE_PATROON.test('../x')).toBe(false)
  })
})

describe('samenvatting voor het coachgesprek', () => {
  const sinds = new Date('2026-10-01T00:00:00Z')
  const leads = [
    lead({ id: 'a', status: 'afspraak', aangemaaktOp: '2026-10-02T09:00:00Z' }),
    lead({ id: 'b', status: 'klant', aangemaaktOp: '2026-10-05T09:00:00Z' }),
    lead({ id: 'c', status: 'klant', aangemaaktOp: '2026-09-20T09:00:00Z' }),
  ]
  test('telt alleen nieuw sinds het vorige gesprek, nieuwste eerst', () => {
    const s = vatLeadsSamen(leads, sinds)
    expect(s.nieuw).toBe(2)
    expect(s.perStatus.klant).toBe(1)
    expect(s.klantenTotaal).toBe(2)
    expect(s.lijst.map((l) => l.id)).toEqual(['b', 'a'])
    expect(leadRegel(s)).toBe('2 nieuwe leads · 1 afspraak gepland · 1 klant geworden')
  })
  test('niets nieuw → eerlijke zin', () => {
    expect(leadRegel(vatLeadsSamen([], sinds))).toBe('Geen nieuwe leads ingevuld sinds het vorige gesprek.')
  })
  test('rondreis via JSON', () => {
    const s = vatLeadsSamen(leads, sinds)
    expect(leesLeadSamenvatting(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })
})
