import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { START_PLAN, actiesVoor, clubStanden, groeiCijfers, leesGroeiplan, MAX_ACTIES } from './groeiplan'

const lead = (id: string, over: Partial<Lead> = {}): Lead => ({
  id, naam: `Lead ${id}`, contact: null, club: 'bladel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null, opvolgdatum: null,
  reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null, gesprokenOp: '2026-10-12', aangemaaktOp: '2026-10-12T10:00:00Z', ...over,
})
const klant = (id: string, over: Partial<PtKlant> = {}): PtKlant => ({
  id, naam: `Klant ${id}`, contact: null, duoPartner: null, club: 'bladel', abonnement: '1x', startdatum: '2026-05-01', status: 'actief',
  opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, referralGevraagdOp: null, ...over,
})

const VANDAAG = '2026-10-13'

describe('leesGroeiplan', () => {
  test('het startplan is zelf geldige invoer', () => {
    expect(leesGroeiplan(JSON.parse(JSON.stringify(START_PLAN)))).toEqual({ ok: true, waarde: START_PLAN })
  })
  test('focus verplicht; doelen alleen hele getallen voor bekende clubs; lege doelen vallen weg', () => {
    expect(leesGroeiplan({ focus: ' ', acties: [] }).ok).toBe(false)
    const r = leesGroeiplan({ focus: 'x', doelen: { bladel: '12', mars: 4, budel: '' }, acties: [] })
    expect(r.ok && r.waarde.doelen).toEqual({ bladel: 12 })
    expect(leesGroeiplan({ focus: 'x', doelen: { bladel: 2.5 } }).ok).toBe(false)
    expect(leesGroeiplan({ focus: 'x', doelen: { bladel: -1 } }).ok).toBe(false)
  })
  test('acties: lege rijen vallen weg, titel verplicht, onbekende rol = iedereen, maximum', () => {
    const r = leesGroeiplan({ focus: 'x', acties: [{ titel: '', uitleg: '' }, { titel: 'A', uitleg: 'b', voor: 'baas' }] })
    expect(r.ok && r.waarde.acties).toEqual([{ titel: 'A', uitleg: 'b', voor: 'iedereen' }])
    expect(leesGroeiplan({ focus: 'x', acties: [{ titel: '', uitleg: 'zonder titel' }] }).ok).toBe(false)
    expect(leesGroeiplan({ focus: 'x', acties: Array.from({ length: MAX_ACTIES + 1 }, () => ({ titel: 'a' })) }).ok).toBe(false)
  })
})

test('actiesVoor: een PT\'er ziet zijn acties en die voor iedereen', () => {
  const voor = new Set(actiesVoor(START_PLAN, 'pt').map((a) => a.voor))
  expect(voor).toEqual(new Set(['pt', 'iedereen']))
  expect(actiesVoor(START_PLAN, 'alles')).toHaveLength(START_PLAN.acties.length)
})

describe('cijfers', () => {
  const leads = [
    lead('1', { status: 'klant', bron: 'referral' }),
    lead('2', { gesprokenOp: '2026-10-10' }), // 3 dagen op nieuw → niet opgevolgd
    lead('3', { gesprokenOp: '2026-10-12' }), // gisteren: nog binnen de 2 dagen
    lead('4', { status: 'opvolgen', opvolgdatum: '2026-10-11', referralGevraagd: true, club: 'budel' }),
    lead('5', { gesprokenOp: '2026-09-01', status: 'geen_interesse' }), // buiten de periode
  ]
  const klanten = [klant('a'), klant('b', { startdatum: '2026-10-01' }), klant('c', { status: 'gestopt' }), klant('d', { club: 'budel', status: 'bevroren' })]

  test('groeiCijfers over 30 dagen', () => {
    expect(groeiCijfers(leads, klanten, VANDAAG)).toEqual({
      leads: 4, klantGeworden: 1, nieuweKlanten: 1, nietOpgevolgd: 2, referralGevraagd: 1, viaReferral: 1,
    })
  })
  test('clubStanden: alleen actieve klanten, doel uit het plan, alleen de gevraagde clubs', () => {
    const plan = { ...START_PLAN, doelen: { bladel: 10 } }
    expect(clubStanden(leads, klanten, plan, VANDAAG, ['bladel', 'budel'])).toEqual([
      { club: 'bladel', actief: 2, doel: 10, leads: 3, nieuweKlanten: 1 },
      { club: 'budel', actief: 0, doel: null, leads: 1, nieuweKlanten: 0 },
    ])
  })
})
