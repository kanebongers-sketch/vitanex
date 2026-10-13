import { describe, expect, test } from 'vitest'
import type { PtKlant } from './abonnementen'
import { stopOverzicht } from './stopredenen'

const klant = (id: string, over: Partial<PtKlant> = {}): PtKlant => ({
  id, naam: id, contact: null, duoPartner: null, club: 'budel', abonnement: '1x', startdatum: '2026-05-01', status: 'actief',
  opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, referralGevraagdOp: null, ...over,
})
const gestopt = (id: string, stopReden: PtKlant['stopReden']) => klant(id, { status: 'gestopt', opgezegdOp: '2026-09-01', stopReden })

describe('stopOverzicht', () => {
  const team = [{ id: 'amey', naam: 'Amey' }, { id: 'joey', naam: 'Joey' }, { id: 'luna', naam: 'Luna' }]
  const klanten = new Map([
    ['amey', [gestopt('a1', 'tijd'), gestopt('a2', 'tijd'), gestopt('a3', 'financieel'), klant('a4')]],
    ['joey', [gestopt('j1', null), klant('j2', { status: 'opgezegd', opgezegdOp: '2026-10-01', stopReden: 'blessure' })]],
    ['luna', [klant('l1')]],
  ])

  test('per reden geteld, "zonder reden" apart, percentages over alle stoppers', () => {
    const o = stopOverzicht(team, klanten)
    expect(o.totaal).toBe(5)
    expect(o.redenen).toEqual([
      { reden: 'tijd', aantal: 2, pct: 40 },
      { reden: 'financieel', aantal: 1, pct: 20 },
      { reden: 'blessure', aantal: 1, pct: 20 },
      { reden: 'onbekend', aantal: 1, pct: 20 },
    ])
  })

  test('per trainer: aantal en meest genoemde reden; wie niemand verloor staat er niet in', () => {
    expect(stopOverzicht(team, klanten).perTrainer).toEqual([
      { id: 'amey', naam: 'Amey', gestopt: 3, vaakst: 'tijd' },
      { id: 'joey', naam: 'Joey', gestopt: 2, vaakst: 'blessure' },
    ])
  })

  test('niemand gestopt: leeg overzicht', () => {
    expect(stopOverzicht(team, new Map([['luna', [klant('l1')]]]))).toEqual({ totaal: 0, redenen: [], perTrainer: [] })
  })
})
