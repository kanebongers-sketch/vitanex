import { describe, expect, it } from 'vitest'
import { kopieerDag, naarPayloadRegels, nieuweDag, uitOpgeslagen, verplaats, verwijderDag, voegToe, type EditorStaat } from './editor'

function staat(): EditorStaat {
  return uitOpgeslagen(
    [
      { id: 'a', dag: 1, volgorde: 0, oefeningId: 'o1', sets: 3, herhalingen: '8-10', gewichtKg: 20, rustSec: 90, notitie: null },
      { id: 'c', dag: 2, volgorde: 0, oefeningId: 'o3', sets: 3, herhalingen: '10', gewichtKg: null, rustSec: 60, notitie: null },
      { id: 'b', dag: 1, volgorde: 1, oefeningId: 'o2', sets: null, herhalingen: null, gewichtKg: null, rustSec: null, notitie: 'rustig' },
    ],
    ['Boven'],
  )
}

const volgorde = (s: EditorStaat, dag: number) => s.regels.filter((r) => r.dag === dag).map((r) => r.sleutel)

describe('editor', () => {
  it('leest opgeslagen regels in de juiste volgorde en vult dagtitels aan', () => {
    const s = staat()
    expect(s.regels.map((r) => r.sleutel)).toEqual(['a', 'b', 'c'])
    expect(s.dagTitels).toEqual(['Boven', 'Dag B'])
    expect(s.regels[0]).toMatchObject({ sets: '3', gewichtKg: '20' })
  })

  it('verplaatst binnen een dag en niet voorbij de rand', () => {
    const s = verplaats(staat(), 'b', -1)
    expect(volgorde(s, 1)).toEqual(['b', 'a'])
    expect(verplaats(s, 'b', -1)).toBe(s)
    expect(volgorde(verplaats(staat(), 'c', 1), 2)).toEqual(['c'])
  })

  it('voegt toe aan het eind van de dag', () => {
    const s = voegToe(staat(), 1, 'o9', { sets: '3', herhalingen: '12', rustSec: '60' }, 'n')
    expect(volgorde(s, 1)).toEqual(['a', 'b', 'n'])
  })

  it('kopieert een dag met nieuwe sleutels', () => {
    let i = 0
    const s = kopieerDag(staat(), 1, () => `k${++i}`)
    expect(s.dagTitels).toEqual(['Boven', 'Dag B', 'Boven (kopie)'])
    expect(volgorde(s, 3)).toEqual(['k1', 'k2'])
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
    expect(p[1]).toEqual({ dag: 1, oefeningId: 'o2', sets: null, herhalingen: null, gewichtKg: null, rustSec: null, notitie: 'rustig' })
  })
})
