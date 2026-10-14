import { describe, expect, it } from 'vitest'
import { leesHerhalingen, leesOefening, leesSchema, metVolgorde, oefeningNaarRij } from './invoer'
import { filterNaarParams, filterOefeningen, filterUitParams, keuzeNaarWaarde, LEEG_FILTER, waardeNaarKeuze } from './filter'
import type { Oefening } from './rijen'
import { lijnPunten, toonHerhalingen, toonRust, toonVerschil, trainingenPerWeek } from './weergave'

const OEF = '22222222-2222-4222-8222-222222222222'

const schema = {
  naam: 'Full body',
  doel: 'kracht',
  niveau: 2,
  weken: 8,
  status: 'actief',
  medewerkerId: null,
  dagTitels: ['Full body A'],
  regels: [{ dag: 1, oefeningId: OEF, sets: 3, herhalingen: '8 tot 10', gewichtKg: '22,5', rustSec: 90 }],
}

describe('leesSchema', () => {
  it('accepteert een geldig schema en normaliseert herhalingen', () => {
    const u = leesSchema(schema)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.regels[0]).toMatchObject({ herhalingen: '8-10', gewichtKg: 22.5, rustSec: 90 })
  })
  it('weigert foute waarden met het nummer van de oefening', () => {
    const u = leesSchema({ ...schema, regels: [...schema.regels, { dag: 1, oefeningId: OEF, sets: 40 }] })
    expect(u).toEqual({ ok: false, fout: 'Oefening 2: sets moet tussen 1 en 20 liggen.' })
    expect(leesSchema({ ...schema, naam: ' ' }).ok).toBe(false)
    expect(leesSchema({ ...schema, status: 'weg' }).ok).toBe(false)
    expect(leesSchema({ ...schema, regels: [{ dag: 9, oefeningId: OEF }] }).ok).toBe(false)
    expect(leesSchema({ ...schema, regels: [{ dag: 1, oefeningId: 'x' }] }).ok).toBe(false)
  })
})

describe('herhalingen', () => {
  it('leest en toont herhalingen zonder streepje', () => {
    expect(leesHerhalingen('8 - 10')).toBe('8-10')
    expect(leesHerhalingen(12)).toBe('12')
    expect(leesHerhalingen('<script>')).toBeUndefined()
    expect(toonHerhalingen('8-10')).toBe('8 tot 10')
    expect(toonHerhalingen('30-45 sec')).toBe('30 tot 45 sec')
    expect(toonHerhalingen(null)).toBe('')
  })
})

describe('metVolgorde', () => {
  it('nummert per dag', () => {
    const r = metVolgorde([
      { dag: 1, oefeningId: OEF, sets: null, herhalingen: null, gewichtKg: null, rustSec: null, notitie: null },
      { dag: 2, oefeningId: OEF, sets: null, herhalingen: null, gewichtKg: null, rustSec: null, notitie: null },
      { dag: 1, oefeningId: OEF, sets: null, herhalingen: null, gewichtKg: null, rustSec: null, notitie: null },
    ])
    expect(r.map((x) => x.volgorde)).toEqual([0, 0, 1])
  })
})

describe('leesOefening', () => {
  it('valideert de oefening', () => {
    const plank = { naam: 'Plank', spiergroep: 'buik', materiaal: 'geen', niveau: '1', patroon: 'core', belast: ['rug', 'x'], spierenPrimair: ['rechte_buikspier', 'diepe_buikspier'], spierenSecundair: ['schuine_buikspieren'] }
    const u = leesOefening(plank)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde).toMatchObject({ niveau: 1, belast: ['rug'], actief: true, spierenPrimair: ['rechte_buikspier', 'diepe_buikspier'] })
    expect(oefeningNaarRij(u.waarde)).toMatchObject({ spieren_primair: ['rechte_buikspier', 'diepe_buikspier'], spieren_secundair: ['schuine_buikspieren'] })
    expect(oefeningNaarRij(u.waarde)).not.toHaveProperty('spierenPrimair')
    expect(leesOefening({ naam: 'X', spiergroep: 'nek', materiaal: 'geen', niveau: 1 }).ok).toBe(false)
  })
  it('eist minstens een primaire spier en geen spier in beide lijsten', () => {
    const basis = { naam: 'Plank', spiergroep: 'buik', materiaal: 'geen', niveau: 1 }
    expect(leesOefening({ ...basis, spierenPrimair: [] })).toEqual({ ok: false, fout: 'Kies minstens een spier waar de oefening vooral op werkt.' })
    const dubbel = leesOefening({ ...basis, spierenPrimair: ['rechte_buikspier'], spierenSecundair: ['rechte_buikspier'] })
    expect(dubbel.ok).toBe(false)
    expect(leesOefening({ ...basis, spierenPrimair: ['nek'] }).ok).toBe(false)
  })
})

describe('weergave', () => {
  it('toont rust leesbaar', () => {
    expect(toonRust(45)).toBe('45 sec')
    expect(toonRust(90)).toBe('1:30 min')
    expect(toonRust(120)).toBe('2 min')
    expect(toonRust(0)).toBe('geen')
  })
  it('telt trainingen per week, ook lege weken', () => {
    const nu = new Date('2026-10-14T10:00:00Z')
    const weken = trainingenPerWeek(
      [
        { id: '1', schemaId: null, dag: 1, op: '2026-10-12T08:00:00Z', aantalOefeningen: 5 },
        { id: '2', schemaId: null, dag: 2, op: '2026-10-13T08:00:00Z', aantalOefeningen: 5 },
        { id: '3', schemaId: null, dag: 1, op: '2026-10-01T08:00:00Z', aantalOefeningen: 5 },
      ],
      nu,
      4,
    )
    expect(weken).toEqual([
      { week: '2026-09-21', aantal: 0 },
      { week: '2026-09-28', aantal: 1 },
      { week: '2026-10-05', aantal: 0 },
      { week: '2026-10-12', aantal: 2 },
    ])
  })
  it('schaalt punten voor een lijn', () => {
    const p = lijnPunten([{ label: 'a', waarde: 80 }, { label: 'b', waarde: 78 }], 100, 50, 10)
    expect(p[0]).toMatchObject({ x: 10, y: 10 })
    expect(p[1]).toMatchObject({ x: 90, y: 40 })
    expect(lijnPunten([{ label: 'a', waarde: 5 }], 100, 50)[0]).toMatchObject({ x: 50, y: 25 })
  })
  it('toont een verschil met teken', () => {
    expect(toonVerschil(80, 78.5)).toBe('-1,5')
    expect(toonVerschil(20, 22)).toBe('+2')
  })
})

describe('filterOefeningen', () => {
  const lijst: Oefening[] = [
    { id: '1', naam: 'Push-up op knieën', spiergroep: 'borst', spierenPrimair: ['borstspieren'], spierenSecundair: ['triceps', 'voorste_schouder'], materiaal: 'geen', niveau: 1, patroon: 'duwen_horizontaal', belast: [], uitleg: null, aandachtspunten: null, actief: true, beeld: null },
    { id: '2', naam: 'Bankdrukken', spiergroep: 'borst', spierenPrimair: ['borstspieren'], spierenSecundair: ['triceps'], materiaal: 'barbell', niveau: 2, patroon: 'duwen_horizontaal', belast: [], uitleg: null, aandachtspunten: null, actief: true, beeld: { start: '/club/oefeningen/0042-start.svg', eind: '/club/oefeningen/0042-eind.svg', bron: 'everkinetic', enkel: false } },
    { id: '3', naam: 'Oude oefening', spiergroep: 'rug', spierenPrimair: [], spierenSecundair: [], materiaal: 'geen', niveau: 1, patroon: null, belast: [], uitleg: null, aandachtspunten: null, actief: false, beeld: null },
  ]
  it('zoekt zonder accenten en filtert', () => {
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, zoek: 'knieen' }).map((o) => o.id)).toEqual(['1'])
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, materiaal: 'barbell' }).map((o) => o.id)).toEqual(['2'])
    expect(filterOefeningen(lijst, LEEG_FILTER)).toHaveLength(2)
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, metInactief: true })).toHaveLength(3)
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, zonderBeeld: true }).map((o) => o.id)).toEqual(['1'])
  })
  it('filtert op een spier, ook als meewerkende spier', () => {
    const borst = { soort: 'spier', spier: 'borstspieren' } as const
    const triceps = { soort: 'spier', spier: 'triceps' } as const
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, spier: borst }).map((o) => o.id)).toEqual(['1', '2'])
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, spier: triceps })).toHaveLength(0)
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, spier: triceps, ookMeewerkend: true }).map((o) => o.id)).toEqual(['1', '2'])
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, spier: { soort: 'groep', groep: 'schouders' }, ookMeewerkend: true }).map((o) => o.id)).toEqual(['1'])
  })
  it('valt zonder spieren terug op de grove spiergroep', () => {
    const rug = { soort: 'spier', spier: 'latissimus' } as const
    expect(filterOefeningen(lijst, { ...LEEG_FILTER, metInactief: true, spier: rug }).map((o) => o.id)).toEqual(['3'])
  })
  it('leest en schrijft de URL', () => {
    const f = filterUitParams({ spier: 'quadriceps', mee: '1', mat: 'onzin', niveau: '2', zoek: 'press' })
    expect(f).toMatchObject({ spier: { soort: 'spier', spier: 'quadriceps' }, ookMeewerkend: true, materiaal: null, niveau: 2, zoek: 'press' })
    expect(filterNaarParams(f)).toEqual({ zoek: 'press', spier: 'quadriceps', mee: '1', niveau: '2' })
    expect(filterUitParams({ groep: 'benen' }).spier).toEqual({ soort: 'groep', groep: 'benen' })
    expect(filterUitParams({ spier: 'benen' }).spier).toBeNull()
    expect(filterNaarParams({ ...LEEG_FILTER, ookMeewerkend: true })).toEqual({})
    expect(keuzeNaarWaarde(waardeNaarKeuze('g:romp'))).toBe('g:romp')
    expect(waardeNaarKeuze('s:nek')).toBeNull()
    expect(filterUitParams({ beeld: 'zonder' }).zonderBeeld).toBe(true)
    expect(filterNaarParams({ ...LEEG_FILTER, zonderBeeld: true })).toEqual({ beeld: 'zonder' })
  })
})
