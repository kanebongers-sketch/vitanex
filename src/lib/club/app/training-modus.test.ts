import { describe, expect, it } from 'vitest'
import type { AppOefening, AppSchemaDag, OefeningHistorie } from './schema'
import { beginInvoer, naarSets, rustNaSet, setSleutel, stappenVanDag, volgendeSet, voortgang, vorigeTekst, voorstelSet } from './training-modus'

const oef = (id: string, deel: Partial<AppOefening> = {}): AppOefening => ({
  id, oefeningId: `o-${id}`, dag: 1, volgorde: 0, naam: id, spiergroep: null, spierenPrimair: [], spierenSecundair: [],
  sets: 3, herhalingen: '8-10', gewichtKg: null, rustSec: 90, notitie: null, groep: null, tijdSec: null, rpe: null, rir: null, tempo: null,
  aandachtspunten: null, uitleg: null, beeld: null, ...deel,
})

const dag = (oefeningen: AppOefening[]): AppSchemaDag => ({ dag: 1, letter: 'A', oefeningen })

const historie: Record<string, OefeningHistorie> = {
  'o-a': {
    vorige: { op: '2026-10-08', sets: [{ setNr: 1, herhalingen: 10, gewichtKg: 40, tijdSec: null }, { setNr: 2, herhalingen: 9, gewichtKg: 42.5, tijdSec: null }] },
    beste: { gewichtKg: 42.5, herhalingen: 9 },
  },
}

describe('training doen', () => {
  it('vult het gewicht van de vorige keer in, anders uit het schema', () => {
    const inv = beginInvoer(dag([oef('a'), oef('b', { gewichtKg: 20, sets: 2 })]), historie)
    expect(inv[setSleutel('a', 1)].kg).toBe('40')
    expect(inv[setSleutel('a', 2)].kg).toBe('42,5')
    expect(inv[setSleutel('a', 3)].kg).toBe('42,5')
    expect(inv[setSleutel('b', 2)].kg).toBe('20')
    expect(Object.keys(inv)).toHaveLength(5)
  })

  it('toont de vorige keer en een voorstel', () => {
    expect(vorigeTekst(historie['o-a'], 2)).toBe('42,5 kg x 9')
    expect(vorigeTekst(historie['o-a'], 3)).toBeNull()
    expect(voorstelSet(oef('a'), historie['o-a'], 1).herh).toBe('10')
    expect(voorstelSet(oef('x'), undefined, 1).herh).toBe('10')
    expect(voorstelSet(oef('t', { herhalingen: null, tijdSec: 30 }), undefined, 1).tijd).toBe('30')
  })

  it('stuurt alleen afgevinkte sets en vult lege herhalingen met het voorstel', () => {
    const d = dag([oef('a'), oef('t', { herhalingen: null, tijdSec: 30, sets: 1 })])
    const inv = beginInvoer(d, historie)
    inv[setSleutel('a', 1)] = { ...inv[setSleutel('a', 1)], herh: '11', klaar: true }
    inv[setSleutel('a', 2)] = { ...inv[setSleutel('a', 2)], klaar: true }
    inv[setSleutel('t', 1)] = { ...inv[setSleutel('t', 1)], tijd: '35', klaar: true }
    expect(naarSets(d, inv, historie)).toEqual([
      { oefeningId: 'o-a', setNr: 1, herhalingen: 11, gewichtKg: 40, tijdSec: null },
      { oefeningId: 'o-a', setNr: 2, herhalingen: 9, gewichtKg: 42.5, tijdSec: null },
      { oefeningId: 'o-t', setNr: 1, herhalingen: null, gewichtKg: null, tijdSec: 35 },
    ])
    expect(voortgang(d, inv)).toEqual({ klaar: 3, totaal: 4 })
  })

  it('rust: los na elke set, superset pas na de tweede oefening', () => {
    const r = rustNaSet(dag([oef('a', { rustSec: 120 }), oef('b', { groep: 1, rustSec: 0 }), oef('c', { groep: 1, rustSec: 60 })]))
    expect(r.get(setSleutel('a', 1))).toBe(120)
    expect(r.get(setSleutel('b', 1))).toBe(0)
    expect(r.get(setSleutel('c', 1))).toBe(60)
  })

  it('weet wat de volgende open set is, in superset-volgorde', () => {
    const d = dag([oef('b', { groep: 1, sets: 2 }), oef('c', { groep: 1, sets: 2 })])
    const stappen = stappenVanDag(d)
    expect(stappen.map((s) => s.sleutel)).toEqual(['b:1', 'c:1', 'b:2', 'c:2'])
    const inv = beginInvoer(d, {})
    expect(volgendeSet(stappen, inv, 'b:1')).toBe('set 1 c')
    inv['c:1'] = { ...inv['c:1'], klaar: true }
    expect(volgendeSet(stappen, inv, 'b:1')).toBe('set 2 b')
  })
})
