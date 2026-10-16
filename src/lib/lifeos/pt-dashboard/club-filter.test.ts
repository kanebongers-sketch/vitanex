import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { voorClub } from './club-filter'

// Een clubmanager mag nooit iets van een andere club zien: dat is de kern.

const lead = (id: string, club: Lead['club']): Lead => ({
  id, naam: id, contact: null, club, bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null, opvolgdatum: null,
  opvolgtijd: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null, gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z',
})
const klant = (id: string, club: PtKlant['club']): PtKlant => ({
  id, naam: id, contact: null, duoPartner: null, club, abonnement: '1x', startdatum: '2026-09-01', status: 'actief', opgezegdOp: null,
  notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, referralGevraagdOp: null,
})

describe('voorClub', () => {
  const alles = {
    team: [{ id: 'amey', naam: 'Amey' }, { id: 'nieck', naam: 'Nieck' }, { id: 'kane', naam: 'Kane' }],
    leads: new Map([['amey', [lead('a1', 'bladel'), lead('a2', 'budel'), lead('a3', null)]], ['nieck', [lead('n1', 'budel')]], ['kane', []]]),
    klanten: new Map([['amey', [klant('k1', 'bladel')]], ['nieck', [klant('k2', 'budel')]], ['kane', [klant('k3', 'budel')]]]),
    beheerderId: 'kane',
    doelen: { ok: true as const, waarde: new Map() },
  }

  test('alleen leads en klanten van de eigen club; leads zonder club vallen weg', () => {
    const b = voorClub(alles, ['bladel'])
    expect(b.team.map((p) => p.id)).toEqual(['amey'])
    expect(b.leads.get('amey')?.map((l) => l.id)).toEqual(['a1'])
    expect(b.klanten.get('amey')?.map((k) => k.id)).toEqual(['k1'])
    expect(b.leads.has('nieck')).toBe(false)
  })

  test('trainers met iets in de club (ook de beheerder als trainer); doelen vallen weg', () => {
    const b = voorClub(alles, ['budel'])
    expect(b.team.map((p) => p.id)).toEqual(['amey', 'nieck', 'kane'])
    expect([...b.leads.values()].flat().every((l) => l.club === 'budel')).toBe(true)
    expect([...b.klanten.values()].flat().every((k) => k.club === 'budel')).toBe(true)
    expect(b.beheerderId).toBe('kane')
    expect(b.doelen).toBeUndefined()
  })

  test('geen afwijkende prijs in de data voor een clubmanager', () => {
    const metPrijs = { ...alles, klanten: new Map([['nieck', [{ ...klant('k2', 'budel'), prijsAfwijkend: 249 }]]]) }
    expect(voorClub(metPrijs, ['budel']).klanten.get('nieck')?.[0]?.prijsAfwijkend).toBeNull()
  })

  test('meerdere clubs (bv. Someren én Boschdijk): beide, en verder niets', () => {
    const b = voorClub(alles, ['bladel', 'budel'])
    expect(b.leads.get('amey')?.map((l) => l.id)).toEqual(['a1', 'a2'])
    expect([...b.klanten.values()].flat().map((k) => k.id).sort()).toEqual(['k1', 'k2', 'k3'])
  })

  test('geen clubs: niets', () => {
    expect(voorClub(alles, []).team).toEqual([])
  })

  test('club zonder activiteit: leeg team', () => {
    expect(voorClub(alles, ['oisterwijk']).team).toEqual([])
  })
})
