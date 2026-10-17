import { describe, expect, test } from 'vitest'
import { kladUitRij, leesKladAntwoord, leesKladWijziging, pastKlad, sorteerKlad, voorproef, type KladNotitie } from './model'

const n = (over: Partial<KladNotitie> = {}): KladNotitie => ({
  id: 'a', vestiging: 'budel', map: 'overdracht', titel: 'Sauna', inhoud: 'Reset via de knop achter de balie', vastgepind: false,
  gearchiveerd: false, auteur: 'Kane', aangemaaktOp: '2026-10-16T08:00:00Z', bijgewerktOp: '2026-10-16T08:00:00Z', ...over,
})
const F = { vestiging: 'budel' as const, map: null, zoek: '', archief: false }

describe('leesKladWijziging', () => {
  test('nieuw zonder titel: eerste regel van de inhoud, anders "Naamloze notitie"', () => {
    expect(leesKladWijziging({ inhoud: '\n  Sleutels kluis  \nrest' }, { nieuw: true })).toEqual({ ok: true, waarde: { inhoud: '\n  Sleutels kluis  \nrest', titel: 'Sleutels kluis' } })
    expect(leesKladWijziging({}, { nieuw: true })).toEqual({ ok: true, waarde: { titel: 'Naamloze notitie' } })
  })
  test('alleen meegestuurde velden; ongeldige map/vestiging → fout; lege wijziging → fout', () => {
    expect(leesKladWijziging({ vastgepind: true })).toEqual({ ok: true, waarde: { vastgepind: true } })
    expect(leesKladWijziging({ vestiging: null })).toEqual({ ok: true, waarde: { vestiging: null } })
    expect(leesKladWijziging({ map: 'geheim' }).ok).toBe(false)
    expect(leesKladWijziging({ vestiging: 'mars' }).ok).toBe(false)
    expect(leesKladWijziging({}).ok).toBe(false)
  })
  test('inhoud: regeleinden blijven, max 3 lege regels, ingekort', () => {
    const r = leesKladWijziging({ inhoud: 'a\r\n\n\n\n\nb   ' })
    expect(r.ok && r.waarde.inhoud).toBe('a\n\n\nb')
    const lang = leesKladWijziging({ inhoud: 'x'.repeat(30000) })
    expect(lang.ok && lang.waarde.inhoud?.length).toBe(20000)
  })
})

describe('lijst', () => {
  test('pastKlad: eigen vestiging + alle vestigingen; map; zoeken in titel en inhoud; archief apart', () => {
    expect(pastKlad(n(), F)).toBe(true)
    expect(pastKlad(n({ vestiging: null }), F)).toBe(true)
    expect(pastKlad(n({ vestiging: 'bladel' }), F)).toBe(false)
    expect(pastKlad(n(), { ...F, map: 'kennis' })).toBe(false)
    expect(pastKlad(n(), { ...F, zoek: 'BALIE' })).toBe(true)
    expect(pastKlad(n(), { ...F, zoek: 'douche' })).toBe(false)
    expect(pastKlad(n({ gearchiveerd: true }), F)).toBe(false)
    expect(pastKlad(n({ gearchiveerd: true }), { ...F, archief: true })).toBe(true)
  })
  test('sorteerKlad: vastgepind eerst, dan nieuwste', () => {
    const lijst = [n({ id: 'oud', bijgewerktOp: '2026-10-01T00:00:00Z' }), n({ id: 'nieuw', bijgewerktOp: '2026-10-15T00:00:00Z' }), n({ id: 'pin', vastgepind: true, bijgewerktOp: '2026-09-01T00:00:00Z' })]
    expect(lijst.sort(sorteerKlad).map((x) => x.id)).toEqual(['pin', 'nieuw', 'oud'])
  })
  test('voorproef en rij/antwoord inlezen', () => {
    expect(voorproef('a\n\nb', 10)).toBe('a b')
    expect(voorproef('x'.repeat(20), 10)).toBe(`${'x'.repeat(9)}…`)
    const rij = { id: 'a', vestiging: 'onbekend', map: 'x', titel: 'T', inhoud: null, aangemaakt_op: 'a', bijgewerkt_op: 'b' }
    expect(kladUitRij(rij)).toMatchObject({ vestiging: null, map: 'algemeen', inhoud: '' })
    expect(leesKladAntwoord({ notitie: n() })).toEqual(n())
  })
})

test('overdrachtVoorVandaag: map overdracht, vastgepind of recent, niet gearchiveerd', async () => {
  const { overdrachtVoorVandaag } = await import('./model')
  const nu = new Date('2026-10-17T12:00:00Z')
  const lijst = [
    n({ id: 'recent', bijgewerktOp: '2026-10-16T08:00:00Z' }),
    n({ id: 'oud', bijgewerktOp: '2026-10-01T08:00:00Z' }),
    n({ id: 'pin-oud', vastgepind: true, bijgewerktOp: '2026-09-01T08:00:00Z' }),
    n({ id: 'kennis', map: 'kennis', bijgewerktOp: '2026-10-16T09:00:00Z' }),
    n({ id: 'archief', gearchiveerd: true, bijgewerktOp: '2026-10-16T09:00:00Z' }),
  ]
  expect(overdrachtVoorVandaag(lijst, nu).map((x) => x.id)).toEqual(['pin-oud', 'recent'])
})
