import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { bouwPtTeamWeek, ptWeekCijfers, weekTekst } from './team-week'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})
const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'k', naam: 'Y', contact: null, duoPartner: null, club: 'budel', abonnement: '1x', startdatum: '2026-06-01',
  status: 'actief', opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, ...over,
})

// Maandag 12 oktober 2026: de week = ma 5 t/m zo 11 oktober.
const MAANDAG = '2026-10-12'

describe('ptWeekCijfers', () => {
  test('telt alleen de zeven dagen vóór de verzenddag', () => {
    const c = ptWeekCijfers(
      [
        lead({ gesprokenOp: '2026-10-05' }),
        lead({ gesprokenOp: '2026-10-11' }),
        lead({ gesprokenOp: '2026-10-04' }), // vorige week
        lead({ gesprokenOp: '2026-10-12' }), // vandaag: volgende week
      ],
      [klant({ startdatum: '2026-10-08' }), klant({ startdatum: '2026-10-12' })],
      MAANDAG,
    )
    expect(c.leads).toBe(2)
    expect(c.nieuweKlanten).toBe(1)
  })
  test('te laat = open met opvolgdatum vóór vandaag; afgesloten of vandaag telt niet', () => {
    const c = ptWeekCijfers(
      [
        lead({ status: 'opvolgen', opvolgdatum: '2026-10-09' }),
        lead({ status: 'opvolgen', opvolgdatum: MAANDAG }),
        lead({ status: 'klant', opvolgdatum: '2026-10-01' }),
      ],
      [],
      MAANDAG,
    )
    expect(c.teLaat).toBe(1)
  })
  test('lopend + maandwaarde: bevroren telt als lopend, niet in de waarde; gestopt niet', () => {
    const c = ptWeekCijfers([], [klant(), klant({ status: 'bevroren' }), klant({ status: 'gestopt', opgezegdOp: '2026-08-01' })], MAANDAG)
    expect(c).toMatchObject({ lopend: 2, maandwaarde: 299 })
  })
  test('maandwaarde rekent met de afwijkende prijs als die er is', () => {
    const c = ptWeekCijfers([], [klant({ prijsAfwijkend: 250 }), klant()], MAANDAG)
    expect(c.maandwaarde).toBe(549)
  })
})

describe('weekTekst', () => {
  test('enkelvoud/meervoud en nullen vallen weg', () => {
    expect(weekTekst({ leads: 1, nieuweKlanten: 0, teLaat: 2, lopend: 0, maandwaarde: 0 })).toBe('1 lead · 2 opvolgingen te laat')
    expect(weekTekst({ leads: 0, nieuweKlanten: 1, teLaat: 0, lopend: 1, maandwaarde: 299 })).toMatch(
      /^1 nieuwe klant · 1 lopend abonnement \(€\s?299 p\/m\)$/,
    )
  })
})

describe('bouwPtTeamWeek', () => {
  test('alleen PT\'ers met iets te melden + één totaalregel', () => {
    const w = bouwPtTeamWeek(
      [{ id: 'joey', naam: 'Joey' }, { id: 'luna', naam: 'Luna' }, { id: 'bas', naam: 'Bas' }],
      new Map([['joey', [lead(), lead({ status: 'opvolgen', opvolgdatum: '2026-10-01', gesprokenOp: '2026-09-20' })]]]),
      new Map([['luna', [klant()]]]),
      MAANDAG,
    )
    expect(w?.regels.map((r) => r.naam)).toEqual(['Joey', 'Luna'])
    expect(w?.regels[0].tekst).toBe('1 lead · 1 opvolging te laat')
    expect(w?.totaal).toMatch(/^Team: 1 lead · 1 opvolging te laat · 1 lopend abonnement/)
  })
  test('eerlijk bij niets: geen regels, wel een totaal; zonder team geen sectie', () => {
    const w = bouwPtTeamWeek([{ id: 'joey', naam: 'Joey' }], new Map(), new Map(), MAANDAG)
    expect(w).toEqual({ regels: [], totaal: 'Niemand van het PT-team vulde afgelopen week iets in.' })
    expect(bouwPtTeamWeek([], new Map(), new Map(), MAANDAG)).toBeNull()
  })
  test('geen leads maar wel abonnementen: zegt dat er geen nieuwe leads waren', () => {
    const w = bouwPtTeamWeek([{ id: 'luna', naam: 'Luna' }], new Map(), new Map([['luna', [klant()]]]), MAANDAG)
    expect(w?.totaal).toMatch(/^Team: geen nieuwe leads · 1 lopend abonnement/)
  })
})
