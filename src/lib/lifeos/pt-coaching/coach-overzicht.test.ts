import { describe, expect, test } from 'vitest'
import {
  coachFase, eerstOpTePakken, gesprekGehad, laatsteContactOp, opTePakkenLabel, opTePakkenTekst, sorteerCoachRijen, telCoach, verslagOpen,
  type CoachRij, type OpTePakken,
} from './coach-overzicht'
import type { EvaluatieJson } from './pt-coaching'
import type { Lead } from '@/lib/lifeos/leads/leads'

const NU = new Date('2026-10-09T10:00:00Z')

function verslag(op: string): EvaluatieJson {
  return { id: `v-${op}`, aangemaaktOp: op, scores: { algemeen: 4, energie: 4, voortgang: 4 }, notitie: null, aandachtspunt: null }
}

const LEEG: OpTePakken = { teLaat: [], vandaag: [], zonderPlan: [] }

function rij(over: Partial<CoachRij> & { naam: string }): CoachRij {
  return { id: over.naam.toLowerCase(), volgendeOp: null, laatsteGesprekOp: null, verslagen: [], openPunten: [], checkin: null, opTePakken: LEEG, ...over }
}

function lead(naam: string, over: Partial<Lead> = {}): Lead {
  return {
    id: naam, naam, contact: null, club: null, bron: 'vloer', interesse: null, status: 'opvolgen', volgendeStap: 'bellen',
    opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
    gesprokenOp: '2026-10-01', aangemaaktOp: '2026-10-01T10:00:00Z', ...over,
  }
}

describe('laatste contact & gesprek gehad', () => {
  test('het laatste van agenda-gesprek en verslag telt', () => {
    expect(laatsteContactOp(rij({ naam: 'A' }))).toBeNull()
    expect(laatsteContactOp(rij({ naam: 'A', laatsteGesprekOp: '2026-10-01T09:00:00Z' }))).toBe('2026-10-01T09:00:00Z')
    expect(laatsteContactOp(rij({ naam: 'A', laatsteGesprekOp: '2026-10-01T09:00:00Z', verslagen: [verslag('2026-10-02T09:00:00Z')] }))).toBe('2026-10-02T09:00:00Z')
  })

  test('binnen twee weken = gehad, daarbuiten niet', () => {
    expect(gesprekGehad(rij({ naam: 'A', verslagen: [verslag('2026-09-30T09:00:00Z')] }), NU)).toBe(true)
    expect(gesprekGehad(rij({ naam: 'A', verslagen: [verslag('2026-09-20T09:00:00Z')] }), NU)).toBe(false)
    expect(gesprekGehad(rij({ naam: 'A' }), NU)).toBe(false)
  })
})

describe('verslag open & fase', () => {
  test('gesprek geweest zonder verslag erna → verslag invullen', () => {
    const r = rij({ naam: 'A', laatsteGesprekOp: '2026-10-08T09:00:00Z', verslagen: [verslag('2026-10-01T09:00:00Z')], volgendeOp: '2026-10-15T09:00:00Z' })
    expect(verslagOpen(r, NU)).toBe(true)
    expect(coachFase(r, NU)).toBe('verslag')
  })
  test('verslag ná het gesprek → geen verslag open; zonder volgende afspraak → inplannen', () => {
    const r = rij({ naam: 'A', laatsteGesprekOp: '2026-10-08T09:00:00Z', verslagen: [verslag('2026-10-08T10:00:00Z')] })
    expect(verslagOpen(r, NU)).toBe(false)
    expect(coachFase(r, NU)).toBe('inplannen')
    expect(coachFase({ ...r, volgendeOp: '2026-10-15T09:00:00Z' }, NU)).toBe('geregeld')
  })
  test('een gesprek van meer dan drie weken geleden vraagt geen verslag meer', () => {
    expect(verslagOpen(rij({ naam: 'A', laatsteGesprekOp: '2026-09-01T09:00:00Z' }), NU)).toBe(false)
  })
})

describe('sorteren & tellen', () => {
  const verslagNodig = rij({ naam: 'Verslag', laatsteGesprekOp: '2026-10-08T09:00:00Z', volgendeOp: '2026-10-15T09:00:00Z' })
  const nooit = rij({ naam: 'Nooit' })
  const langGeleden = rij({ naam: 'Lang', verslagen: [verslag('2026-09-01T09:00:00Z')] })
  const laat = rij({ naam: 'Laat', verslagen: [verslag('2026-10-05T09:00:00Z')], volgendeOp: '2026-10-20T09:00:00Z', checkin: { week: '2026-10-05', bijgewerktOp: '2026-10-07T10:00:00Z', energie: 4, gewonnen: null, lastig: null, bespreken: null, focus: null } })
  const vroeg = rij({ naam: 'Vroeg', verslagen: [verslag('2026-10-06T09:00:00Z')], volgendeOp: '2026-10-12T09:00:00Z' })

  test('verslag eerst, dan inplannen (nooit → langst geleden), dan geregeld op datum', () => {
    const uit = sorteerCoachRijen([vroeg, laat, langGeleden, nooit, verslagNodig], NU).map((r) => r.naam)
    expect(uit).toEqual(['Verslag', 'Nooit', 'Lang', 'Vroeg', 'Laat'])
  })

  test('telling', () => {
    expect(telCoach([vroeg, laat, langGeleden, nooit, verslagNodig], NU)).toEqual({ totaal: 5, gehad: 3, ingepland: 3, checkins: 1, teVerslaan: 1 })
  })
})

describe('eerst op te pakken', () => {
  const o: OpTePakken = {
    teLaat: [lead('Anna', { opvolgdatum: '2026-10-03' }), lead('Bo', { opvolgdatum: '2026-10-07', status: 'proefles' })],
    vandaag: [lead('Cas', { opvolgdatum: '2026-10-09' })],
    zonderPlan: [lead('Dirk', { volgendeStap: null, status: 'nieuw' })],
  }

  test('volgorde en maximum', () => {
    expect(eerstOpTePakken(o).map((i) => `${i.lead.naam}:${i.reden}`)).toEqual(['Anna:te_laat', 'Bo:te_laat', 'Cas:vandaag', 'Dirk:zonder_plan'])
    expect(eerstOpTePakken(o, 2).map((i) => i.lead.naam)).toEqual(['Anna', 'Bo'])
  })

  test('labels', () => {
    const [a, , c, d] = eerstOpTePakken(o)
    expect(opTePakkenLabel(a)).toBe('te laat sinds 3 okt')
    expect(opTePakkenLabel(c)).toBe('vandaag opvolgen')
    expect(opTePakkenLabel(d)).toBe('geen opvolgdatum of volgende stap')
  })

  test('tekst voor het verslag, met "en nog …" boven het maximum', () => {
    expect(opTePakkenTekst(LEEG)).toMatch(/^Eerst op te pakken: niets/)
    const t = opTePakkenTekst(o, 3)
    expect(t).toContain('Eerst op te pakken (4):')
    expect(t).toContain('• Anna — Opvolgen, te laat sinds 3 okt')
    expect(t).toContain('• Bo — Proefles ingepland, te laat sinds 7 okt')
    expect(t).toContain('… en nog 1')
    expect(t).not.toContain('Dirk')
  })
})
