import { describe, expect, test } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  GERESERVEERD, CODE_PATROON, leadRegel, leesContactmoment, leesLead, leesLeadNotitieTekst, leesTijd, vergelijkLeads, leesLeadSamenvatting, leesNieuweLead, linkCodeVoor, moetOpvolgen, slugVoorNaam,
  vatLeadsSamen, type Lead,
} from './leads'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l1', naam: 'Sanne', contact: null, club: 'eersel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null,
  opvolgdatum: null, opvolgtijd: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null,
  gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})

describe('lead invoer', () => {
  test('geldig, met standaardstatus en -datum', () => {
    const r = leesNieuweLead({ naam: '  Sanne  de Vries ', bron: 'walk_in', club: 'budel', interesse: 'warm' }, '2026-10-08')
    expect(r.ok && r.waarde).toMatchObject({ naam: 'Sanne de Vries', bron: 'walk_in', club: 'budel', interesse: 'warm', status: 'nieuw', gesprokenOp: '2026-10-08' })
  })
  test('fouten: geen naam, onbekende bron, datum in de toekomst', () => {
    expect(leesNieuweLead({ bron: 'vloer' }, '2026-10-08').ok).toBe(false)
    expect(leesNieuweLead({ naam: 'X', bron: 'tiktok' }, '2026-10-08').ok).toBe(false)
    expect(leesNieuweLead({ naam: 'X', bron: 'vloer', gesprokenOp: '2026-10-09' }, '2026-10-08').ok).toBe(false)
  })
  test('te lange velden ingekort', () => {
    const r = leesNieuweLead({ naam: 'a'.repeat(300), bron: 'anders', club: 'eersel', notitie: 'b'.repeat(2000) }, '2026-10-08')
    expect(r.ok && r.waarde.naam.length).toBe(120)
    expect(r.ok && r.waarde.notitie?.length).toBe(1000)
  })
  test('club is verplicht bij invoer (anders ziet de clubmanager de lead niet)', () => {
    expect(leesNieuweLead({ naam: 'X', bron: 'vloer' }, '2026-10-08').ok).toBe(false)
    expect(leesNieuweLead({ naam: 'X', bron: 'vloer', club: 'mars' }, '2026-10-08').ok).toBe(false)
  })
  test('een opgeslagen lead zonder club blijft leesbaar (verdwijnt niet uit lijsten)', () => {
    const oud = { ...lead(), club: null }
    expect(leesLead(JSON.parse(JSON.stringify(oud)))?.club).toBeNull()
  })
  test('geen klant geworden: reden alleen bij die status', () => {
    const r = leesNieuweLead({ naam: 'X', bron: 'vloer', club: 'eersel', status: 'geen_klant', geenKlantReden: 'te_duur' }, '2026-10-08')
    expect(r.ok && r.waarde.geenKlantReden).toBe('te_duur')
    const anders = leesNieuweLead({ naam: 'X', bron: 'vloer', club: 'eersel', status: 'opvolgen', geenKlantReden: 'te_duur' }, '2026-10-08')
    expect(anders.ok && anders.waarde.geenKlantReden).toBeNull()
    const onbekend = leesNieuweLead({ naam: 'X', bron: 'vloer', club: 'eersel', status: 'geen_klant', geenKlantReden: 'maan' }, '2026-10-08')
    expect(onbekend.ok && onbekend.waarde.geenKlantReden).toBeNull()
  })
  test('rondreis via JSON', () => {
    const l = lead({ opvolgdatum: '2026-10-10', opvolgtijd: null, reviewGevraagd: true })
    expect(leesLead(JSON.parse(JSON.stringify(l)))).toEqual(l)
  })
  test('opvolgen: alleen open leads met een datum vandaag of eerder', () => {
    expect(moetOpvolgen(lead({ status: 'opvolgen', opvolgdatum: '2026-10-08' }), '2026-10-08')).toBe(true)
    expect(moetOpvolgen(lead({ status: 'opvolgen', opvolgdatum: '2026-10-09' }), '2026-10-08')).toBe(false)
    expect(moetOpvolgen(lead({ status: 'klant', opvolgdatum: '2026-10-01' }), '2026-10-08')).toBe(false)
  })
})

describe('link-code', () => {
  test('gewoon de naam; bij een dubbele of gereserveerde naam een volgnummer', () => {
    expect(slugVoorNaam('Joëy van Dijk')).toBe('joey-van-dijk')
    expect(linkCodeVoor('Joey', new Set())).toBe('joey')
    expect(linkCodeVoor('Joey', new Set(['joey', 'joey-2']))).toBe('joey-3')
    expect(linkCodeVoor('Login', new Set())).toBe('login-2')
    expect(CODE_PATROON.test('joey')).toBe(true)
    expect(CODE_PATROON.test('../x')).toBe(false)
  })
  test('elke vaste pagina op het hoogste niveau staat in GERESERVEERD', () => {
    const app = join(process.cwd(), 'src/app')
    const mappen = (dir: string) => readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    // Route-groepen tellen niet als segment en kunnen genest zijn: src/app/(hoofd)/(app)/home is /home.
    const top = (dir: string): string[] => mappen(dir).flatMap((m) => (m.startsWith('(') ? top(join(dir, m)) : [m]))
    const vast = top(app).filter((m) => !m.startsWith('[') && !m.startsWith('_'))
    expect(vast.filter((m) => !GERESERVEERD.has(m))).toEqual([])
  })
})

describe('samenvatting voor het coachgesprek', () => {
  const sinds = new Date('2026-10-01T00:00:00Z')
  const leads = [
    lead({ id: 'a', status: 'intake', aangemaaktOp: '2026-10-02T09:00:00Z' }),
    lead({ id: 'b', status: 'klant', aangemaaktOp: '2026-10-05T09:00:00Z' }),
    lead({ id: 'c', status: 'klant', aangemaaktOp: '2026-09-20T09:00:00Z' }),
    lead({ id: 'd', status: 'opvolgen', opvolgdatum: '2026-10-03', aangemaaktOp: '2026-09-20T09:00:00Z' }),
  ]
  test('telt alleen nieuw sinds het vorige gesprek, nieuwste eerst; te late opvolging erbij', () => {
    const s = vatLeadsSamen(leads, sinds, '2026-10-08')
    expect(s.nieuw).toBe(2)
    expect(s.klantenTotaal).toBe(2)
    expect(s.achterstallig).toBe(1)
    expect(s.lijst.map((l) => l.id)).toEqual(['b', 'a'])
    expect(leadRegel(s)).toBe('2 nieuwe leads · 1 intake ingepland · 1 klant geworden · 1 opvolging te laat')
  })
  test('niets nieuw → eerlijke zin', () => {
    expect(leadRegel(vatLeadsSamen([], sinds, '2026-10-08'))).toBe('Geen nieuwe leads ingevuld sinds het vorige gesprek.')
  })
  test('rondreis via JSON', () => {
    const s = vatLeadsSamen(leads, sinds, '2026-10-08')
    expect(leesLeadSamenvatting(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })
})

describe('logboek per lead', () => {
  test('tekst verplicht, spaties samengevouwen, ingekort op 500', () => {
    expect(leesLeadNotitieTekst({ tekst: '   ' }).ok).toBe(false)
    expect(leesLeadNotitieTekst({ tekst: ' gebeld,   voicemail ' })).toEqual({ ok: true, waarde: 'gebeld, voicemail' })
    const lang = leesLeadNotitieTekst({ tekst: 'x'.repeat(900) })
    expect(lang.ok && lang.waarde.length).toBe(500)
  })
  test('rondreis via JSON met logboek; kapotte notities vallen weg', () => {
    const n = { id: 'n1', datum: '2026-10-15', tekst: 'proefles di 18:00', door: 'Joey', aangemaaktOp: '2026-10-15T09:00:00Z', status: 'proefles' as const, opvolgdatum: '2026-10-20', opvolgtijd: '18:00' }
    const l = { ...lead(), logboek: [n, { id: 'kapot' }] }
    expect(leesLead(JSON.parse(JSON.stringify(l)))?.logboek).toEqual([n])
  })
})

test('vergelijkLeads: te laat, vandaag, zonder plan, later; afgesloten onderaan, nieuwste eerst', () => {
  const ls = [
    lead({ id: 'klant-oud', status: 'klant', gesprokenOp: '2026-09-01' }),
    lead({ id: 'later', status: 'opvolgen', opvolgdatum: '2026-10-20' }),
    lead({ id: 'plan-nieuw', gesprokenOp: '2026-10-07' }),
    lead({ id: 'plan-oud', gesprokenOp: '2026-10-01' }),
    lead({ id: 'vandaag', status: 'opvolgen', opvolgdatum: '2026-10-08' }),
    lead({ id: 'laat-kort', status: 'opvolgen', opvolgdatum: '2026-10-07' }),
    lead({ id: 'laat-lang', status: 'opvolgen', opvolgdatum: '2026-10-01' }),
    lead({ id: 'geen-klant', status: 'geen_klant', gesprokenOp: '2026-10-05' }),
  ]
  expect([...ls].sort(vergelijkLeads('2026-10-08')).map((l) => l.id)).toEqual([
    'laat-lang', 'laat-kort', 'vandaag', 'plan-oud', 'plan-nieuw', 'later', 'geen-klant', 'klant-oud',
  ])
})

describe('contactmoment', () => {
  test('alleen tekst = alleen een notitie (lead blijft ongemoeid)', () => {
    expect(leesContactmoment({ tekst: 'gebeld' })).toEqual({ ok: true, waarde: { tekst: 'gebeld' } })
  })
  test('status + opvolging; lege datum wist de opvolging; tijd alleen met datum', () => {
    expect(leesContactmoment({ tekst: 'x', status: 'opvolgen', opvolgdatum: '2026-10-20', opvolgtijd: '10:00:00' })).toEqual({
      ok: true, waarde: { tekst: 'x', status: 'opvolgen', opvolgdatum: '2026-10-20', opvolgtijd: '10:00' },
    })
    expect(leesContactmoment({ tekst: 'x', opvolgdatum: '', opvolgtijd: '10:00' })).toEqual({ ok: true, waarde: { tekst: 'x', opvolgdatum: null, opvolgtijd: null } })
  })
  test('afgesloten status wist de opvolging; ongeldige invoer → fout', () => {
    const r = leesContactmoment({ tekst: 'lid geworden', status: 'klant', opvolgdatum: '2026-10-20' })
    expect(r.ok && r.waarde).toEqual({ tekst: 'lid geworden', status: 'klant', opvolgdatum: null, opvolgtijd: null })
    expect(leesContactmoment({ tekst: 'x', status: 'baas' }).ok).toBe(false)
    expect(leesContactmoment({ tekst: 'x', opvolgdatum: 'morgen' }).ok).toBe(false)
    expect(leesContactmoment({ tekst: ' ' }).ok).toBe(false)
  })
  test('leesTijd', () => {
    expect(leesTijd('09:05')).toBe('09:05')
    expect(leesTijd('24:00')).toBeNull()
    expect(leesTijd('9:05')).toBeNull()
  })
  test('opvolgtijd bij een lead alleen met datum; sorteren binnen dezelfde dag op tijd', () => {
    const r = leesNieuweLead({ naam: 'X', bron: 'vloer', club: 'eersel', opvolgtijd: '10:00' }, '2026-10-08')
    expect(r.ok && r.waarde.opvolgtijd).toBeNull()
    const ls = [
      lead({ id: 'zonder', status: 'opvolgen', opvolgdatum: '2026-10-08', opvolgtijd: null }),
      lead({ id: 'laat', status: 'opvolgen', opvolgdatum: '2026-10-08', opvolgtijd: '16:00' }),
      lead({ id: 'vroeg', status: 'opvolgen', opvolgdatum: '2026-10-08', opvolgtijd: '09:00' }),
    ]
    expect([...ls].sort(vergelijkLeads('2026-10-08')).map((l) => l.id)).toEqual(['vroeg', 'laat', 'zonder'])
  })
})
