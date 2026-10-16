import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { checkupSinds, checkupStand, leadsDoorlopen, leesAfspraakInvoer, scoreAfspraak, type Afspraak } from './checkup'

const lead = (id: string, over: Partial<Lead> = {}): Lead => ({
  id, naam: `Lead ${id}`, contact: null, club: 'bladel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: 'bellen', opvolgdatum: '2026-10-20',
  opvolgtijd: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null, gesprokenOp: '2026-10-08', aangemaaktOp: '2026-10-08T10:00:00Z', ...over,
})
const klant = (id: string, over: Partial<PtKlant> = {}): PtKlant => ({
  id, naam: `Klant ${id}`, contact: null, duoPartner: null, club: 'bladel', abonnement: '1x', startdatum: '2026-05-01', status: 'actief',
  opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, referralGevraagdOp: null, ...over,
})
const afspraak = (over: Partial<Afspraak> = {}): Afspraak => ({
  id: 'a', gemaaktOp: '2026-10-06', gemaaktDoor: 'Kane', gesprekken: null, nieuweKlanten: null, referrals: null, nietsTeLaat: false, notitie: null, ...over,
})

const VANDAAG = '2026-10-13'

describe('leesAfspraakInvoer', () => {
  test('lege velden en 0 = geen afspraak; minstens één nodig', () => {
    expect(leesAfspraakInvoer({ gesprekken: '', referrals: 0 }).ok).toBe(false)
    const r = leesAfspraakInvoer({ gesprekken: '5', nietsTeLaat: true, notitie: '  focus  op Bladel ' })
    expect(r.ok && r.waarde).toEqual({ gesprekken: 5, nieuweKlanten: null, referrals: null, nietsTeLaat: true, notitie: 'focus op Bladel' })
  })
  test('geen heel getal of te groot → fout', () => {
    expect(leesAfspraakInvoer({ gesprekken: 2.5 }).ok).toBe(false)
    expect(leesAfspraakInvoer({ nieuweKlanten: 51 }).ok).toBe(false)
  })
})

test('checkupSinds: de vorige afspraak, anders twee weken terug', () => {
  expect(checkupSinds(afspraak(), VANDAAG)).toBe('2026-10-06')
  expect(checkupSinds(null, VANDAAG)).toBe('2026-09-29')
})

describe('checkupStand', () => {
  const leads = [
    lead('1', { status: 'klant' }),
    lead('2', { opvolgdatum: '2026-10-10', status: 'opvolgen' }), // te laat
    lead('3', { opvolgdatum: null, volgendeStap: null }), // zonder plan
    lead('4', { status: 'intake', gesprokenOp: '2026-09-01' }), // ingepland, oud
    lead('5', { bron: 'referral' }),
    lead('6', { status: 'geen_klant', geenKlantReden: 'te_duur' }),
  ]
  const klanten = [
    klant('a', { startdatum: '2026-10-07' }), // nieuw sinds
    klant('b', { referralGevraagdOp: '2026-10-09' }), // gevraagd sinds
    klant('c', { referralGevraagdOp: '2026-08-01' }), // ooit gevraagd
    klant('d', { status: 'gestopt', opgezegdOp: '2026-10-10', stopReden: 'tijd' }), // gestopt sinds
    klant('e', { startdatum: '2026-07-20' }), // vaste periode eindigt 19 okt
  ]
  const s = checkupStand(leads, klanten, afspraak(), VANDAAG)

  test('leads en pijplijn', () => {
    expect(s.leads.nieuw.map((l) => l.id)).toEqual(['1', '2', '3', '5', '6'])
    expect(s.leads.teLaat.map((l) => l.id)).toEqual(['2'])
    expect(s.leads.zonderPlan.map((l) => l.id)).toEqual(['3'])
    expect(s.pijplijn.ingepland.map((l) => l.id)).toEqual(['4'])
    expect(s.pijplijn.nieuweKlanten.map((k) => k.id)).toEqual(['a'])
    expect(s.pijplijn.nieuwKlant).toBe(1)
    expect(s.pijplijn.nieuwGeenKlant.map((l) => l.id)).toEqual(['6'])
  })
  test('referrals: kandidaten zijn lopende klanten waarbij nog niet gevraagd', () => {
    expect(s.referrals).toMatchObject({ lopend: 4, ooitGevraagd: 2, gevraagdSinds: 1, binnen: 1 })
    expect(s.referrals.nogNiet.map((k) => k.id)).toEqual(['a', 'e'])
  })
  test('behoud: gestopt sinds + einde vaste periode binnen 30 dagen', () => {
    expect(s.behoud.gestopt.map((k) => k.id)).toEqual(['d'])
    expect(s.behoud.eindeVastePeriode).toEqual([{ klant: klanten[4], einde: '2026-10-19' }])
  })
  test('scoreAfspraak: alleen gemaakte afspraken, gemeten vanaf de checkupdag', () => {
    const a = afspraak({ gesprekken: 5, nieuweKlanten: 1, referrals: 2, nietsTeLaat: true })
    expect(scoreAfspraak(a, s)).toEqual([
      { soort: 'gesprekken', label: 'Nieuwe gesprekken', stand: '5 van 5', gehaald: true },
      { soort: 'nieuweKlanten', label: 'Nieuwe klanten', stand: '1 van 1', gehaald: true },
      { soort: 'referrals', label: 'Referral gevraagd', stand: '1 van 2', gehaald: false },
      { soort: 'nietsTeLaat', label: 'Niets te laat', stand: '1 te laat', gehaald: false },
    ])
    expect(scoreAfspraak(afspraak({ gesprekken: 3 }), s)).toHaveLength(1)
  })
})

test('leadsDoorlopen: te laat, vandaag, zonder plan, rest op datum; afgesloten leads niet', () => {
  const ls = [
    lead('later', { opvolgdatum: '2026-10-20' }),
    lead('plan', { opvolgdatum: null, volgendeStap: null }),
    lead('vandaag', { opvolgdatum: VANDAAG }),
    lead('laat2', { opvolgdatum: '2026-10-12' }),
    lead('laat1', { opvolgdatum: '2026-10-01' }),
    lead('klant', { status: 'klant', opvolgdatum: '2026-10-01' }),
    lead('weg', { status: 'geen_klant' }),
  ]
  expect(leadsDoorlopen(ls, VANDAAG).map((l) => l.id)).toEqual(['laat1', 'laat2', 'vandaag', 'plan', 'later'])
})
