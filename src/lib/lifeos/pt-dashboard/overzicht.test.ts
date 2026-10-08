import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import { belbaarNummer, clubMatrix, leadCijfers, ptOverzicht } from './overzicht'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})

describe('leadCijfers', () => {
  test('week (vanaf maandag), maand, open, conversie', () => {
    const c = leadCijfers(
      [
        lead({ id: 'a', gesprokenOp: '2026-10-05', status: 'klant' }), // maandag
        lead({ id: 'b', gesprokenOp: '2026-10-04', status: 'geen_interesse' }), // zondag vorige week
        lead({ id: 'c', gesprokenOp: '2026-09-30', status: 'opvolgen' }),
        lead({ id: 'd', gesprokenOp: '2026-10-08' }),
      ],
      '2026-10-08',
    )
    expect(c).toMatchObject({ totaal: 4, dezeWeek: 2, dezeMaand: 3, open: 2, klant: 1, geenInteresse: 1, conversie: 25 })
    expect(leadCijfers([], '2026-10-08').conversie).toBe(null)
  })
})

describe('ptOverzicht', () => {
  test('vandaag, te laat (oudste eerst) en zonder plan', () => {
    const o = ptOverzicht(
      [
        lead({ id: 'v', status: 'opvolgen', opvolgdatum: '2026-10-08' }),
        lead({ id: 'l2', status: 'opvolgen', opvolgdatum: '2026-10-06' }),
        lead({ id: 'l1', status: 'later', opvolgdatum: '2026-10-01' }),
        lead({ id: 'z', status: 'nieuw' }),
        lead({ id: 'k', status: 'klant', opvolgdatum: '2026-10-01' }),
        lead({ id: 'p', status: 'nieuw', volgendeStap: 'bellen' }),
      ],
      [],
      '2026-10-08',
    )
    expect(o.vandaag.map((l) => l.id)).toEqual(['v'])
    expect(o.teLaat.map((l) => l.id)).toEqual(['l1', 'l2'])
    expect(o.zonderPlan.map((l) => l.id)).toEqual(['z'])
  })
})

describe('clubMatrix', () => {
  test('clubs in vaste volgorde, onbekend achteraan', () => {
    const m = clubMatrix([lead({ club: 'eersel', status: 'klant' }), lead({ club: 'budel' }), lead({ club: null })])
    expect(m.map((r) => [r.club, r.totaal])).toEqual([['budel', 1], ['eersel', 1], ['onbekend', 1]])
    expect(m[1].perStatus.klant).toBe(1)
  })
})

describe('belbaarNummer', () => {
  test('NL-nummers in allerlei vormen; de rest null', () => {
    expect(belbaarNummer('06 31957620')).toBe('31631957620')
    expect(belbaarNummer('+31 6 1234 5678')).toBe('31612345678')
    expect(belbaarNummer('064574579')).toBe(null) // te kort (zoals in de oude tracker)
    expect(belbaarNummer('@sanne.fit')).toBe(null)
  })
})
