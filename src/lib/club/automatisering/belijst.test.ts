import { describe, expect, it } from 'vitest'
import { BEL_MAX, belTeller, isVerlopen, ledenOpVolgorde, maakBelijst, verloopGrens, type BelLead } from './belijst'
import type { RegelSleutel } from './regels'
import type { Taak } from './taken'

const VANDAAG = '2026-11-03'

function taak(id: string, lidId: string, regel: RegelSleutel, aangemaaktOp = '2026-11-01T08:00:00Z', waarde: number | null = null): Taak {
  return { id, lidId, vestiging: 'budel', regel, periode: 'p', waarde, reden: '', status: 'open', wie: { soort: 'iedereen' }, notitie: null, uitkomst: null, afgehandeldDoor: null, afgehandeldOp: null, aangemaaktOp, lid: null }
}

function lead(id: string, opvolgenOp: string, extra: Partial<BelLead> = {}): BelLead {
  return { id, status: 'contact', opvolgenOp, proeflesOp: null, ...extra }
}

const id = (i: { soort: 'lead'; lead: BelLead } | { soort: 'lid'; taak: Taak }) => (i.soort === 'lead' ? i.lead.id : i.taak.id)

describe('verloopGrens en isVerlopen', () => {
  it('veertien dagen terug', () => {
    expect(verloopGrens(VANDAAG)).toBe('2026-10-20')
  })
  it('een taak van 15 dagen geleden is verlopen, van 14 dagen niet', () => {
    expect(isVerlopen({ status: 'open', aangemaaktOp: '2026-10-19T10:00:00Z' }, VANDAAG)).toBe(true)
    expect(isVerlopen({ status: 'open', aangemaaktOp: '2026-10-20T10:00:00Z' }, VANDAAG)).toBe(false)
  })
  it('alleen open taken met een datum', () => {
    expect(isVerlopen({ status: 'gedaan', aangemaaktOp: '2026-01-01T10:00:00Z' }, VANDAAG)).toBe(false)
    expect(isVerlopen({ status: 'open', aangemaaktOp: '' }, VANDAAG)).toBe(false)
    expect(isVerlopen({}, VANDAAG)).toBe(false)
  })
})

describe('ledenOpVolgorde', () => {
  it('per lid alleen het belangrijkste gesprek, verlopen taken vallen weg', () => {
    const uit = ledenOpVolgorde(
      [taak('t1', 'a', 'verjaardag'), taak('t2', 'a', 'risico', undefined, 30), taak('t3', 'b', 'welkom', '2026-10-01T08:00:00Z'), taak('t4', 'c', 'mijlpaal')],
      VANDAAG,
    )
    expect(uit.map((t) => t.id)).toEqual(['t2', 't4'])
  })
  it('regel eerst, bij risico de laagste score eerst, dan de oudste', () => {
    const uit = ledenOpVolgorde(
      [
        taak('w', 'w', 'welkom', '2026-10-25T08:00:00Z'),
        taak('r40', 'r1', 'risico', '2026-10-30T08:00:00Z', 40),
        taak('r20', 'r2', 'risico', '2026-11-02T08:00:00Z', 20),
        taak('p', 'p', 'proefles_opvolgen', '2026-11-02T08:00:00Z'),
        taak('n2', 'n2', 'niet_gezien', '2026-11-01T08:00:00Z'),
        taak('n1', 'n1', 'niet_gezien', '2026-10-28T08:00:00Z'),
      ],
      VANDAAG,
    )
    expect(uit.map((t) => t.id)).toEqual(['p', 'r20', 'r40', 'n1', 'n2', 'w'])
  })
})

describe('maakBelijst', () => {
  it('hoogstens vijf, met het echte totaal voor "Alle n bekijken"', () => {
    const leden = Array.from({ length: 60 }, (_, i) => taak(`t${i}`, `l${i}`, 'niet_gezien'))
    const leads = Array.from({ length: 10 }, (_, i) => lead(`k${i}`, '2026-11-01'))
    const lijst = maakBelijst(leden, leads, VANDAAG, 16)
    expect(lijst.items).toHaveLength(BEL_MAX)
    expect(lijst.totaal).toBe(76)
  })
  it('leads met een proefles eerst, dan leden, dan de andere leads (oudste eerst)', () => {
    const lijst = maakBelijst(
      [taak('lid1', 'a', 'welkom'), taak('lid2', 'b', 'proefles_opvolgen')],
      [lead('gewoon', '2026-10-01'), lead('proef', '2026-11-03', { proeflesOp: new Date('2026-11-03T17:00:00Z') }), lead('na', '2026-11-02', { status: 'proefles_geweest' })],
      VANDAAG,
    )
    expect(lijst.items.map(id)).toEqual(['na', 'proef', 'lid2', 'lid1', 'gewoon'])
  })
  it('zonder iets op de lijst: leeg en totaal 0', () => {
    expect(maakBelijst([], [], VANDAAG)).toEqual({ items: [], totaal: 0 })
  })
})

describe('belTeller', () => {
  it('nooit meer dan de belijst, nooit 99+', () => {
    expect(belTeller(76)).toBe(5)
    expect(belTeller(3)).toBe(3)
    expect(belTeller(0)).toBe(0)
    expect(belTeller(Number.NaN)).toBe(0)
    expect(belTeller(-2)).toBe(0)
  })
})
