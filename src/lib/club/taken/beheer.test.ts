import { describe, expect, it } from 'vitest'
import { kopieerPlan, verplaats, volgendeVolgorde } from './beheer'
import { maakTaak } from './testdata'
import { frequentieTekst, kortWie, opVolgorde, type Takenlijst } from './typen'
import { perGroep, weekLabel, dagKort } from './weergave'
import { weekContext } from './week'
import { leesWeek, takenHref } from './url'

const items = [
  { id: 'a', naam: 'A', volgorde: 10 },
  { id: 'b', naam: 'B', volgorde: 20 },
  { id: 'c', naam: 'C', volgorde: 30 },
]

describe('verplaats', () => {
  it('wisselt met de buur en geeft alleen wat verandert', () => {
    expect(verplaats(items, 'b', 'omhoog')).toEqual([
      { id: 'b', volgorde: 10 },
      { id: 'a', volgorde: 20 },
    ])
    expect(verplaats(items, 'b', 'omlaag')).toEqual([
      { id: 'c', volgorde: 20 },
      { id: 'b', volgorde: 30 },
    ])
  })
  it('kan niet verder dan de rand of bij een onbekend id', () => {
    expect(verplaats(items, 'a', 'omhoog')).toBeNull()
    expect(verplaats(items, 'c', 'omlaag')).toBeNull()
    expect(verplaats(items, 'x', 'omlaag')).toBeNull()
  })
  it('nummert rommelige volgordes netjes opnieuw', () => {
    const rommel = [
      { id: 'a', naam: 'A', volgorde: 0 },
      { id: 'b', naam: 'B', volgorde: 0 },
    ]
    expect(verplaats(rommel, 'b', 'omhoog')).toEqual([
      { id: 'b', volgorde: 10 },
      { id: 'a', volgorde: 20 },
    ])
  })
})

describe('volgendeVolgorde', () => {
  it('zet nieuw achteraan', () => {
    expect(volgendeVolgorde(items)).toBe(40)
    expect(volgendeVolgorde([])).toBe(10)
  })
})

function lijst(id: string, naam: string, actief = true): Takenlijst {
  return { id, vestiging: 'budel', naam, volgorde: 10, actief }
}

describe('kopieerPlan', () => {
  const bron = {
    lijsten: [lijst('l1', 'Dagelijks'), lijst('l2', 'Poetsrooster'), lijst('l3', 'Oud', false)],
    taken: [
      maakTaak({ id: 't1', lijstId: 'l1', naam: 'Kassa telling', volgorde: 10 }),
      maakTaak({ id: 't2', lijstId: 'l1', naam: 'Afwas keuken', volgorde: 20 }),
      maakTaak({ id: 't3', lijstId: 'l2', naam: 'Trap afdoen', frequentie: 'extra', volgorde: 10 }),
      maakTaak({ id: 't4', lijstId: 'l2', naam: 'Weg', actief: false }),
      maakTaak({ id: 't5', lijstId: 'l3', naam: 'Nooit' }),
    ],
  }
  it('maakt ontbrekende lijsten aan met hun actieve taken', () => {
    const plan = kopieerPlan(bron, { lijsten: [], taken: [] })
    expect(plan.nieuweLijsten.map((l) => [l.naam, l.taken.map((t) => t.naam)])).toEqual([
      ['Dagelijks', ['Kassa telling', 'Afwas keuken']],
      ['Poetsrooster', ['Trap afdoen']],
    ])
    expect(plan.aantalTaken).toBe(3)
  })
  it('vult een lijst met dezelfde naam aan zonder dubbelingen', () => {
    const doel = { lijsten: [lijst('d1', 'dagelijks')], taken: [maakTaak({ id: 'x', lijstId: 'd1', naam: 'kassa telling', volgorde: 50 })] }
    const plan = kopieerPlan(bron, doel)
    expect(plan.aanvullen).toEqual([{ lijstId: 'd1', taken: [expect.objectContaining({ naam: 'Afwas keuken', volgorde: 60 })] }])
    expect(plan.nieuweLijsten.map((l) => l.naam)).toEqual(['Poetsrooster'])
    expect(plan.aantalTaken).toBe(2)
  })
  it('doet niets als alles er al staat', () => {
    expect(kopieerPlan(bron, bron).aantalTaken).toBe(0)
  })
})

describe('kleine hulpjes', () => {
  it('kortWie maakt initialen zoals op papier', () => {
    expect(kortWie('Lynn Maas')).toBe('LM')
    expect(kortWie('Kim van Gestel')).toBe('KG')
    expect(kortWie('lm')).toBe('LM')
    expect(kortWie('Kane')).toBe('KA')
    expect(kortWie('  ')).toBe('?')
  })
  it('frequentieTekst', () => {
    expect(frequentieTekst({ frequentie: 'per_week', perWeekMin: 3 })).toBe('Minimaal 3x per week')
    expect(frequentieTekst({ frequentie: 'indien_nodig', perWeekMin: null })).toBe('Indien nodig')
  })
  it('opVolgorde en perGroep houden de volgorde van de lijst', () => {
    const t = opVolgorde([maakTaak({ id: 'b', naam: 'B', groep: 'Min 2x', volgorde: 20 }), maakTaak({ id: 'a', naam: 'A', groep: 'Min 3x', volgorde: 10 }), maakTaak({ id: 'c', naam: 'C', groep: 'Min 2x', volgorde: 30 })])
    expect(perGroep(t).map((g) => [g.groep, g.taken.map((x) => x.id)])).toEqual([
      ['Min 3x', ['a']],
      ['Min 2x', ['b', 'c']],
    ])
  })
  it('weergave van datums', () => {
    expect(dagKort('2026-10-12')).toBe('ma')
    expect(weekLabel('2026-10-12')).toBe('12 oktober tot 18 oktober 2026')
  })
  it('weekContext en adressen', () => {
    const w = weekContext('2026-W42', '2026-10-20')
    expect(w).toMatchObject({ maandag: '2026-10-12', zondag: '2026-10-18', weekNummer: 42, vorige: '2026-W41', volgende: '2026-W43', isDezeWeek: false })
    expect(weekContext(null, '2026-10-14').isDezeWeek).toBe(true)
    expect(leesWeek('2026-W42')).toBe('2026-W42')
    expect(leesWeek('volgende')).toBeNull()
    expect(takenHref('week', 'budel', '2026-W42')).toBe('/club/taken/week?v=budel&week=2026-W42')
    expect(takenHref('', 'budel')).toBe('/club/taken?v=budel')
  })
})
