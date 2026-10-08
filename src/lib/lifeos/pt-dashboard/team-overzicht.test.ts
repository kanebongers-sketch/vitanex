import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { bouwTeamOverzicht, leesEigenaren } from './team-overzicht'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})
const klant: PtKlant = {
  id: 'k', naam: 'Y', contact: null, duoPartner: null, club: 'eersel', abonnement: '2x', startdatum: '2026-09-01',
  status: 'actief', opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null,
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
  })
})

describe('leesEigenaren', () => {
  test('leest geldige eigenaren en laat kapotte rijen weg', () => {
    const ruw = {
      eigenaren: [
        { id: 'e1', naam: 'Ruben', code: 'ruben', pinStatus: 'wacht', pinAangevraagdOp: '2026-10-08T10:00:00Z' },
        { id: 'e2', naam: 'Zonder code', pinStatus: 'actief' },
        { id: 'e3', naam: 'Rare pin', code: 'x', pinStatus: 'kapot' },
      ],
    }
    expect(leesEigenaren(ruw)).toEqual([
      { id: 'e1', naam: 'Ruben', code: 'ruben', pinStatus: 'wacht', pinAangevraagdOp: '2026-10-08T10:00:00Z' },
    ])
  })

  test('geeft een lege lijst als het veld ontbreekt (oudere server)', () => {
    expect(leesEigenaren({ vandaag: '2026-10-08', rijen: [], clubs: [] })).toEqual([])
    expect(leesEigenaren(null)).toEqual([])
  })
})
