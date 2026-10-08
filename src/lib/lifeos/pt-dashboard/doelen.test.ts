import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { doelenWeergave, heeftDoelen, leesDoelen, leesDoelenInvoer, statusLabel, voortgang, type PtDoelen } from './doelen'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'X', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})
const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'k', naam: 'Y', contact: null, duoPartner: null, club: 'eersel', abonnement: '2x', startdatum: '2026-09-01',
  status: 'actief', opgezegdOp: null, notitie: null, leadId: null, ...over,
})
const geen: PtDoelen = { leadsPerWeek: null, klantenPerMaand: null, abonnementen: null, notitie: null }
// 2026-10-08 is een donderdag: dag 4 van de week (ma 5 okt), dag 8 van 31.
const DO = '2026-10-08'

describe('voortgang — leads per week', () => {
  const doelen = { ...geen, leadsPerWeek: 5 }
  test('telt alleen maandag t/m vandaag; op koers vanaf ⌊5 × 4/7⌋ = 2', () => {
    const leads = [lead({ gesprokenOp: '2026-10-04' }), lead({ gesprokenOp: '2026-10-05' }), lead({ gesprokenOp: '2026-10-08' }), lead({ gesprokenOp: '2026-10-09' })]
    const [v] = voortgang(doelen, leads, [], DO)
    expect(v).toMatchObject({ soort: 'leadsPerWeek', doel: 5, stand: 2, verwacht: 2, procent: 40, status: 'op_koers' })
    expect(v.uitleg).toBe('dag 4 van 7 — op koers bij 2 of meer')
  })
  test('onder de pro-rata = achter; doel bereikt = gehaald (procent begrensd op 100)', () => {
    const achter = voortgang(doelen, [lead({ gesprokenOp: '2026-10-06' })], [], DO)[0]
    expect(achter.status).toBe('achter')
    expect(statusLabel(achter)).toBe('Achter')
    const veel = Array.from({ length: 7 }, (_, i) => lead({ id: String(i), gesprokenOp: '2026-10-06' }))
    expect(voortgang(doelen, veel, [], DO)[0]).toMatchObject({ status: 'gehaald', procent: 100, stand: 7 })
  })
  test('maandag met 0 leads is niet al achter', () => {
    const [v] = voortgang(doelen, [], [], '2026-10-05')
    expect(v).toMatchObject({ verwacht: 0, status: 'op_koers', uitleg: 'dag 1 van 7 — net begonnen' })
  })
  test('zondag: het hele doel wordt verwacht', () => {
    expect(voortgang(doelen, [lead({ gesprokenOp: '2026-10-05' })], [], '2026-10-11')[0]).toMatchObject({ verwacht: 5, status: 'achter' })
  })
})

describe('voortgang — klanten per maand en abonnementen', () => {
  test('klanten: status klant met gespreksdatum in deze kalendermaand', () => {
    const leads = [
      lead({ status: 'klant', gesprokenOp: '2026-10-02' }),
      lead({ status: 'klant', gesprokenOp: '2026-09-30' }),
      lead({ status: 'opvolgen', gesprokenOp: '2026-10-03' }),
    ]
    const [v] = voortgang({ ...geen, klantenPerMaand: 4 }, leads, [], DO)
    // ⌊4 × 8/31⌋ = 1
    expect(v).toMatchObject({ soort: 'klantenPerMaand', stand: 1, verwacht: 1, status: 'op_koers', uitleg: 'dag 8 van 31 — op koers bij 1 of meer' })
  })
  test('abonnementen: alleen lopende tellen, stand-doel zonder pro-rata', () => {
    const klanten = [klant(), klant({ id: 'b', status: 'gestopt', opgezegdOp: '2026-09-15' }), klant({ id: 'c', status: 'bevroren' })]
    const [v] = voortgang({ ...geen, abonnementen: 5 }, [], klanten, DO)
    expect(v).toMatchObject({ stand: 2, verwacht: null, status: 'achter', uitleg: 'nog 3 te gaan', procent: 40 })
    expect(statusLabel(v)).toBe('Nog niet')
    expect(voortgang({ ...geen, abonnementen: 2 }, [], klanten, DO)[0].status).toBe('gehaald')
  })
  test('alleen gezette doelen, in vaste volgorde', () => {
    expect(voortgang({ leadsPerWeek: 3, klantenPerMaand: null, abonnementen: 8, notitie: null }, [], [], DO).map((v) => v.soort)).toEqual([
      'leadsPerWeek',
      'abonnementen',
    ])
  })
})

describe('weergave', () => {
  test('niets gezet → null (sectie verbergen)', () => {
    expect(heeftDoelen(null)).toBe(false)
    expect(heeftDoelen(geen)).toBe(false)
    expect(doelenWeergave(null, [], [], DO)).toBeNull()
    expect(doelenWeergave(geen, [], [], DO)).toBeNull()
  })
  test('alleen een notitie mag ook', () => {
    expect(doelenWeergave({ ...geen, notitie: 'Focus op referrals' }, [], [], DO)).toEqual({ items: [], notitie: 'Focus op referrals' })
  })
})

describe('leesDoelenInvoer', () => {
  test('formulierwaarden (strings) worden getallen; leeg en 0 = geen doel', () => {
    expect(leesDoelenInvoer({ leadsPerWeek: '5', klantenPerMaand: '', abonnementen: 0, notitie: '  meer   referrals ' })).toEqual({
      ok: true,
      waarde: { leadsPerWeek: 5, klantenPerMaand: null, abonnementen: null, notitie: 'meer referrals' },
    })
  })
  test('buiten de grens, geen heel getal of geen object → leesbare fout', () => {
    expect(leesDoelenInvoer({ leadsPerWeek: 101 })).toEqual({ ok: false, fout: 'Leads per week: kies een heel getal van 0 tot en met 100.' })
    expect(leesDoelenInvoer({ klantenPerMaand: 2.5 }).ok).toBe(false)
    expect(leesDoelenInvoer({ abonnementen: -1 }).ok).toBe(false)
    expect(leesDoelenInvoer({ abonnementen: 'veel' }).ok).toBe(false)
    expect(leesDoelenInvoer(null).ok).toBe(false)
    expect(leesDoelenInvoer([]).ok).toBe(false)
  })
  test('notitie wordt afgekapt op 300 tekens; rondreis via JSON', () => {
    const r = leesDoelenInvoer({ notitie: 'x'.repeat(400) })
    expect(r.ok && r.waarde.notitie?.length).toBe(300)
    const d: PtDoelen = { leadsPerWeek: 5, klantenPerMaand: 2, abonnementen: 10, notitie: 'Top' }
    expect(leesDoelen(JSON.parse(JSON.stringify(d)))).toEqual(d)
    expect(leesDoelen('kapot')).toBeNull()
  })
})
