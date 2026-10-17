import { describe, expect, it } from 'vitest'
import { KERN_VRAGEN, metKernRegels, standaardSleutel, standaardVragen } from './kern'
import { actieveVragen, hernummerAlles, secties, verplaatsSectie, verplaatsVraag, volgordeVoorNieuw, vulAan } from './lijst'
import type { IntakeVraag } from './soorten'

function vraag(id: string, sectie: string, volgorde: number, deel: Partial<IntakeVraag> = {}): IntakeVraag {
  return { id, sleutel: null, vraag: id, uitleg: null, soort: 'kort', opties: [], verplicht: false, gezondheid: false, sectie, volgorde, actief: true, ...deel }
}

const SET = [vraag('a', 'Doelen', 10), vraag('b', 'Doelen', 20), vraag('c', 'Leefstijl', 30), vraag('d', 'Gezondheid', 40)]

function kernVraag(sleutel: string): IntakeVraag {
  const v = standaardVragen().find((x) => x.sleutel === sleutel)
  if (!v) throw new Error(`geen kernvraag ${sleutel}`)
  return v
}

describe('de standaardset', () => {
  it('bevat de vaste vragen van het oude formulier, in volgorde', () => {
    const std = standaardVragen()
    expect(std).toHaveLength(KERN_VRAGEN.length)
    expect(secties(std).map((s) => s.naam)).toEqual(['Doelen', 'Ervaring', 'Leefstijl', 'Gezondheid'])
    expect(std.filter((v) => v.gezondheid).every((v) => v.sectie === 'Gezondheid')).toBe(true)
    expect(kernVraag('parq_hart').soort).toBe('ja_nee')
    expect(standaardSleutel(std[0].id)).toBe('doelen')
    expect(standaardSleutel('kern:onzin')).toBeNull()
  })

  it('vult een sportschool zonder rijen aan tot de standaardset', () => {
    expect(vulAan([]).map((v) => v.sleutel)).toEqual(standaardVragen().map((v) => v.sleutel))
  })

  it('houdt eigen rijen en aangepaste kernvragen, en vult de rest aan', () => {
    const eigen = vraag('x', 'Kennismaking', 1)
    const doelen = { ...kernVraag('doelen'), id: 'db-doelen', vraag: 'Waarvoor kom je?' }
    const set = vulAan([eigen, doelen])
    expect(set[0].id).toBe('x')
    expect(set.find((v) => v.sleutel === 'doelen')?.vraag).toBe('Waarvoor kom je?')
    expect(set).toHaveLength(KERN_VRAGEN.length + 1)
  })

  it('laat soort, verplicht en gezondheid van een kernvraag niet aanpassen; een vaste vraag blijft aan', () => {
    const niveau: IntakeVraag = { ...kernVraag('niveau'), soort: 'kort', verplicht: false, actief: false }
    const medicatie: IntakeVraag = { ...kernVraag('medicatie'), gezondheid: false, actief: false }
    expect(metKernRegels(niveau)).toMatchObject({ soort: 'keuze', verplicht: true, actief: true })
    expect(metKernRegels(medicatie)).toMatchObject({ gezondheid: true, actief: false })
  })
})

describe('secties en volgorde', () => {
  it('groepeert per sectie in de volgorde van de eerste vraag', () => {
    expect(secties(SET).map((s) => [s.naam, s.vragen.map((v) => v.id)])).toEqual([
      ['Doelen', ['a', 'b']], ['Leefstijl', ['c']], ['Gezondheid', ['d']],
    ])
  })

  it('schuift een vraag binnen haar sectie en nummert opnieuw', () => {
    expect(verplaatsVraag(SET, 'b', 'omhoog')).toEqual([
      { id: 'b', volgorde: 10 }, { id: 'a', volgorde: 20 }, { id: 'c', volgorde: 30 }, { id: 'd', volgorde: 40 },
    ])
    expect(verplaatsVraag(SET, 'a', 'omhoog')).toBeNull()
    expect(verplaatsVraag(SET, 'b', 'omlaag')).toBeNull()
    expect(verplaatsVraag(SET, 'z', 'omlaag')).toBeNull()
  })

  it('schuift een hele sectie', () => {
    expect(verplaatsSectie(SET, 'Leefstijl', 'omhoog')?.map((v) => v.id)).toEqual(['c', 'a', 'b', 'd'])
    expect(verplaatsSectie(SET, 'Gezondheid', 'omlaag')).toBeNull()
  })

  it('zet een nieuwe vraag achteraan in haar sectie', () => {
    const nieuw = vraag('n', 'Doelen', volgordeVoorNieuw(SET, 'Doelen'))
    expect(hernummerAlles([...SET, nieuw]).map((v) => v.id)).toEqual(['a', 'b', 'n', 'c', 'd'])
    expect(volgordeVoorNieuw(SET, 'Nieuw')).toBe(41)
  })

  it('toont alleen actieve vragen', () => {
    expect(actieveVragen([...SET, vraag('e', 'Doelen', 5, { actief: false })]).map((v) => v.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
