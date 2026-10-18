import { describe, expect, it } from 'vitest'
import {
  koppelAanVorige, kopieerDag, naarPayloadRegels, nieuweDag, ontkoppel, uitOpgeslagen, verplaats, verplaatsNaar, verwijderDag, verwijderRegel,
  voegToe, zetGewicht, zetInspanning, zetMaat, wijzigRegel, type EditorStaat,
} from './editor'
import type { SchemaRegel } from './rijen'

const EXTRA = { groep: null, tijdSec: null, rpe: null, rir: null, tempo: null }

function regel(id: string, dag: number, volgorde: number, extra: Partial<SchemaRegel> = {}): SchemaRegel {
  return { id, dag, volgorde, oefeningId: `o-${id}`, sets: 3, herhalingen: '10', gewichtKg: null, rustSec: 60, notitie: null, ...EXTRA, ...extra }
}

function staat(): EditorStaat {
  return uitOpgeslagen(
    [
      regel('a', 1, 0, { oefeningId: 'o1', herhalingen: '8-10', gewichtKg: 20, rustSec: 90 }),
      regel('c', 2, 0, { oefeningId: 'o3' }),
      regel('b', 1, 1, { oefeningId: 'o2', sets: null, herhalingen: null, rustSec: null, notitie: 'rustig' }),
    ],
    ['Boven'],
  )
}

/** Dag 1: a, b (superset), c (los), d en e (superset). */
function metSupersets(): EditorStaat {
  return uitOpgeslagen(
    [
      regel('a', 1, 0, { groep: 7 }),
      regel('b', 1, 1, { groep: 7 }),
      regel('c', 1, 2),
      regel('d', 1, 3, { groep: 9 }),
      regel('e', 1, 4, { groep: 9 }),
    ],
    ['Dag A'],
  )
}

const volgorde = (s: EditorStaat, dag: number) => s.regels.filter((r) => r.dag === dag).map((r) => r.sleutel)
const groepen = (s: EditorStaat, dag = 1) => s.regels.filter((r) => r.dag === dag).map((r) => r.groep)

describe('editor', () => {
  it('leest opgeslagen regels in de juiste volgorde en vult dagtitels aan', () => {
    const s = staat()
    expect(s.regels.map((r) => r.sleutel)).toEqual(['a', 'b', 'c'])
    expect(s.dagTitels).toEqual(['Boven', 'Dag B'])
    expect(s.regels[0]).toMatchObject({ sets: '3', gewichtKg: '20', maat: 'herhalingen', inspanning: 'geen' })
  })

  it('nummert opgeslagen groepen opnieuw vanaf 1', () => {
    expect(groepen(metSupersets())).toEqual([1, 1, null, 2, 2])
  })

  it('verplaatst binnen een dag en niet voorbij de rand', () => {
    const s = verplaats(staat(), 'b', -1)
    expect(volgorde(s, 1)).toEqual(['b', 'a'])
    expect(verplaats(s, 'b', -1)).toBe(s)
    expect(volgorde(verplaats(staat(), 'c', 1), 2)).toEqual(['c'])
  })

  it('wisselt binnen een superset en schuift aan de rand het hele blok', () => {
    const s = metSupersets()
    expect(volgorde(verplaats(s, 'b', -1), 1)).toEqual(['b', 'a', 'c', 'd', 'e'])
    const blokOmlaag = verplaats(s, 'b', 1)
    expect(volgorde(blokOmlaag, 1)).toEqual(['c', 'a', 'b', 'd', 'e'])
    expect(groepen(blokOmlaag)).toEqual([null, 1, 1, 2, 2])
    expect(volgorde(verplaats(s, 'c', 1), 1)).toEqual(['a', 'b', 'd', 'e', 'c'])
  })

  it('sleept naar een andere plek en andere dag', () => {
    const s = metSupersets()
    const naarMidden = verplaatsNaar(s, 'c', 1, 'b')
    expect(volgorde(naarMidden, 1)).toEqual(['a', 'c', 'b', 'd', 'e'])
    expect(groepen(naarMidden)).toEqual([1, 1, 1, 2, 2])
    const metDag = nieuweDag(s)
    const naarDagB = verplaatsNaar(metDag, 'd', 2, null)
    expect(volgorde(naarDagB, 2)).toEqual(['d'])
    expect(groepen(naarDagB, 2)).toEqual([null])
    expect(groepen(naarDagB)).toEqual([1, 1, null, null])
    expect(verplaatsNaar(s, 'c', 5, null)).toBe(s)
  })

  it('koppelt aan de vorige en maakt een circuit van drie', () => {
    let s = metSupersets()
    s = koppelAanVorige(s, 'c')
    expect(groepen(s)).toEqual([1, 1, 1, 2, 2])
    s = koppelAanVorige(s, 'd')
    expect(groepen(s)).toEqual([1, 1, 1, 1, 1])
    expect(koppelAanVorige(s, 'a')).toBe(s)
  })

  it('ontkoppelt en splitst wat erna komt af', () => {
    let s = koppelAanVorige(metSupersets(), 'c')
    s = ontkoppel(s, 'b')
    expect(groepen(s)).toEqual([null, null, null, 1, 1])
    expect(ontkoppel(s, 'a')).toBe(s)
  })

  it('verwijderen uit een superset maakt de rest los', () => {
    expect(groepen(verwijderRegel(metSupersets(), 'a'))).toEqual([null, null, 1, 1])
  })

  it('voegt toe aan het eind van de dag', () => {
    const s = voegToe(staat(), 1, 'o9', { sets: '3', herhalingen: '12', rustSec: '60' }, 'n')
    expect(volgorde(s, 1)).toEqual(['a', 'b', 'n'])
  })

  it('kopieert een dag met nieuwe sleutels en eigen groepen', () => {
    let i = 0
    const s = kopieerDag(metSupersets(), 1, () => `k${++i}`)
    expect(s.dagTitels).toEqual(['Dag A', 'Dag A (kopie)'])
    expect(volgorde(s, 2)).toEqual(['k1', 'k2', 'k3', 'k4', 'k5'])
    expect(groepen(s, 2)).toEqual([3, 3, null, 4, 4])
  })

  it('verwijdert een dag en schuift de rest op', () => {
    const s = verwijderDag(staat(), 1)
    expect(s.dagTitels).toEqual(['Dag B'])
    expect(s.regels).toHaveLength(1)
    expect(s.regels[0].dag).toBe(1)
    expect(verwijderDag(s, 1)).toBe(s)
  })

  it('stopt bij zeven dagen', () => {
    let s = staat()
    for (let i = 0; i < 10; i++) s = nieuweDag(s)
    expect(s.dagTitels).toHaveLength(7)
  })

  it('maakt een payload met lege velden als null', () => {
    const p = naarPayloadRegels(staat())
    expect(p[1]).toEqual({
      dag: 1, oefeningId: 'o2', sets: null, herhalingen: null, tijdSec: null, gewichtKg: null, rustSec: null, notitie: 'rustig', groep: null, rpe: null, rir: null, tempo: null,
    })
  })

  it('stuurt tijd in plaats van herhalingen en RPE of RIR', () => {
    let s = zetMaat(staat(), 'a', 'tijd')
    s = wijzigRegel(s, 'a', 'tijdSec', '45')
    s = zetInspanning(s, 'a', 'rir')
    s = wijzigRegel(s, 'a', 'inspanningWaarde', '2')
    expect(naarPayloadRegels(s)[0]).toMatchObject({ herhalingen: null, tijdSec: '45', rir: '2', rpe: null })
    expect(naarPayloadRegels(zetInspanning(s, 'a', 'geen'))[0]).toMatchObject({ rir: null, rpe: null })
  })

  it('zet een gewicht uit de suggestie met een komma', () => {
    expect(zetGewicht(staat(), 'o1', 22.5).regels[0].gewichtKg).toBe('22,5')
  })
})
