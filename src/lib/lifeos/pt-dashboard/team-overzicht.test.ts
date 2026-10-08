import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { bouwTeamOverzicht, leesPtDetail, leesTeamOverzicht } from './team-overzicht'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})
const klant: PtKlant = {
  id: 'k', naam: 'Y', contact: null, duoPartner: null, club: 'eersel', abonnement: '2x', startdatum: '2026-09-01',
  status: 'actief', opgezegdOp: null, notitie: null, leadId: null,
}

describe('team-overzicht', () => {
  test('bouwt per PT de cijfers en per club de matrix; rondreis via JSON', () => {
    const t = bouwTeamOverzicht(
      [{ id: 'joey', naam: 'Joey', code: 'joey', pinStatus: 'actief' }, { id: 'luna', naam: 'Luna', code: 'luna', pinStatus: 'geen' }],
      new Map([['joey', [lead({ id: 'a', status: 'klant' }), lead({ id: 'b', status: 'opvolgen', opvolgdatum: '2026-10-01', gesprokenOp: '2026-09-28' })]]]),
      new Map([['joey', [klant]]]),
      '2026-10-08',
      new Map([['joey', { leadsPerWeek: 5, klantenPerMaand: null, abonnementen: 8, notitie: 'Referrals vragen' }]]),
    )
    expect(t.rijen[0]).toMatchObject({ naam: 'Joey', teLaat: 1, klantenLopend: 1, maandwaarde: 519, laatsteLead: '2026-10-07' })
    expect(t.rijen[0].doelen).toEqual({ leadsPerWeek: 5, klantenPerMaand: null, abonnementen: 8, notitie: 'Referrals vragen' })
    expect(t.rijen[0].leads.conversie).toBe(50)
    expect(t.rijen[1]).toMatchObject({ naam: 'Luna', klantenLopend: 0, laatsteLead: null, doelen: null })
    expect(t.clubs).toHaveLength(1)
    expect(t.analyse?.funnel.map((s) => s.aantal)).toEqual([2, 1, 1])
    expect(t.analyse?.weken.at(-1)).toMatchObject({ start: '2026-10-05', leads: 1, klant: 1 })
    expect(leesTeamOverzicht(JSON.parse(JSON.stringify(t)))).toEqual(t)
  })
  test('oud antwoord zonder analyse blijft leesbaar', () => {
    expect(leesTeamOverzicht({ vandaag: '2026-10-08', rijen: [], clubs: [] })?.analyse).toBeNull()
  })
  test('detail: kapotte items vallen weg, de rest blijft', () => {
    const d = leesPtDetail({ naam: 'Joey', code: 'joey', vandaag: '2026-10-08', leads: [lead(), { kapot: true }], klanten: [klant] })
    expect(d?.leads).toHaveLength(1)
    expect(d?.klanten).toHaveLength(1)
    expect(d?.doelen).toBeNull()
    expect(leesPtDetail({ naam: 'Joey', code: null, vandaag: '2026-10-08', leads: [], klanten: [], doelen: { leadsPerWeek: 3 } })?.doelen)
      .toEqual({ leadsPerWeek: 3, klantenPerMaand: null, abonnementen: null, notitie: null })
    expect(leesPtDetail({ naam: 'x' })).toBeNull()
  })
})
