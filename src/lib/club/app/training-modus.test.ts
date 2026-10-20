import { describe, expect, it } from 'vitest'
import type { AppOefening, AppSchemaDag, OefeningHistorie } from './schema'
import { beginInvoer, huidigeSet, metKilo, naarSets, oefeningPlekken, rustNaSet, setSleutel, setTekst, stapGrootte, stapWaarde, stappenVanDag, volgendeOpen, volgendeSet, voortgang, vorigeTekst, voorstelSet } from './training-modus'

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

  it('neemt een zwaarder gewicht van de trainer over, maar nooit een lichter', () => {
    const omhoog = beginInvoer(dag([oef('a', { gewichtKg: 45 })]), historie)
    expect([1, 2, 3].map((n) => omhoog[setSleutel('a', n)].kg)).toEqual(['45', '45', '45'])
    const lager = beginInvoer(dag([oef('a', { gewichtKg: 30 })]), historie)
    expect(lager[setSleutel('a', 1)].kg).toBe('40')
    expect(lager[setSleutel('a', 2)].kg).toBe('42,5')
    // Gelijk aan het zwaarste van de vorige keer: de vorige keer per set blijft staan.
    expect(beginInvoer(dag([oef('a', { gewichtKg: 42.5 })]), historie)[setSleutel('a', 1)].kg).toBe('40')
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

  it('labels zoals op de vloer: A, dan B1 en B2 voor een superset', () => {
    const p = oefeningPlekken(dag([oef('a'), oef('b', { groep: 1 }), oef('c', { groep: 1 }), oef('d')]))
    expect([...p.values()].map((x) => x.label)).toEqual(['A', 'B1', 'B2', 'C'])
    expect(p.get('b')).toEqual({ label: 'B1', soort: 'superset', samenMet: ['c'] })
    expect(p.get('a')?.samenMet).toEqual([])
  })

  it('plus en min: vanaf het voorstel, nooit onder 0, met komma', () => {
    expect(stapWaarde('40', '', 2.5, 1000)).toBe('42,5')
    expect(stapWaarde('', '10', 1, 300)).toBe('11')
    expect(stapWaarde('1', '', -2.5, 1000)).toBe('0')
    expect(stapWaarde('22,5', '', -2.5, 1000)).toBe('20')
    expect(stapGrootte('kg', '8')).toBe(1)
    expect(stapGrootte('kg', '40')).toBe(2.5)
    expect(stapGrootte('tijd', '')).toBe(5)
  })

  it('weet welke set aan de beurt is en wat er na een superset-set komt', () => {
    const d = dag([oef('b', { groep: 1, sets: 2 }), oef('c', { groep: 1, sets: 2 })])
    const inv = beginInvoer(d, {})
    expect(huidigeSet(d.oefeningen[0], inv)).toBe(1)
    inv['b:1'] = { ...inv['b:1'], klaar: true }
    expect(huidigeSet(d.oefeningen[0], inv)).toBe(2)
    expect(volgendeOpen(stappenVanDag(d), inv, 'b:1')?.regelId).toBe('c')
  })

  it('toont een set kort en laat het kiloveld weg bij een oefening op tijd', () => {
    const o = oef('a')
    expect(setTekst(o, { kg: '42,5', herh: '', tijd: '', klaar: true }, { herh: '9', tijd: '' })).toBe('42,5 kg x 9')
    const plank = oef('p', { herhalingen: null, tijdSec: 45 })
    expect(setTekst(plank, { kg: '', herh: '', tijd: '', klaar: true }, { herh: '', tijd: '45' })).toBe('45 sec')
    expect(metKilo(plank, undefined)).toBe(false)
    expect(metKilo(o, undefined)).toBe(true)
  })
})
