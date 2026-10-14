import { describe, expect, it } from 'vitest'
import { maakTaak, vink, WEEK } from './testdata'
import { nogOpen, normPerWeek, perMoment, resterendeDagen, takenVanVandaag, telGedaan, weekTeller } from './voortgang'

const stofzuigen = maakTaak({ id: 'stofzuigen', frequentie: 'per_week', perWeekMin: 3 })

describe('normPerWeek', () => {
  it('geeft 7 voor elke dag, het minimum voor weektaken en niets voor indien nodig', () => {
    expect(normPerWeek(maakTaak({ id: 'a' }))).toBe(7)
    expect(normPerWeek(stofzuigen)).toBe(3)
    expect(normPerWeek(maakTaak({ id: 'b', frequentie: 'indien_nodig' }))).toBeNull()
    expect(normPerWeek(maakTaak({ id: 'c', frequentie: 'extra' }))).toBeNull()
  })
})

describe('resterendeDagen', () => {
  it('telt vandaag mee', () => {
    expect(resterendeDagen(WEEK, '2026-10-12')).toBe(7)
    expect(resterendeDagen(WEEK, '2026-10-16')).toBe(3)
    expect(resterendeDagen(WEEK, '2026-10-18')).toBe(1)
  })
  it('is 0 voor een voorbije week en 7 voor een week in de toekomst', () => {
    expect(resterendeDagen(WEEK, '2026-10-20')).toBe(0)
    expect(resterendeDagen(WEEK, '2026-10-01')).toBe(7)
  })
})

describe('telGedaan', () => {
  it('telt alleen vinkjes van deze taak in deze dagen', () => {
    const v = [vink('stofzuigen', '2026-10-12'), vink('stofzuigen', '2026-10-19'), vink('ander', '2026-10-13')]
    expect(telGedaan('stofzuigen', v, WEEK)).toBe(1)
  })
})

describe('weekTeller', () => {
  it('is gehaald zodra het minimum binnen is', () => {
    const v = ['2026-10-12', '2026-10-13', '2026-10-14'].map((d) => vink('stofzuigen', d))
    expect(weekTeller(stofzuigen, v, WEEK, '2026-10-14')).toEqual({ gedaan: 3, minimum: 3, status: 'gehaald' })
  })
  it('is bezig als er nog speling is', () => {
    expect(weekTeller(stofzuigen, [vink('stofzuigen', '2026-10-12')], WEEK, '2026-10-14').status).toBe('bezig')
  })
  it('loopt achter als elke resterende dag nodig is', () => {
    // Vrijdag, 0 van 3: vrijdag, zaterdag en zondag moeten allemaal.
    expect(weekTeller(stofzuigen, [], WEEK, '2026-10-16').status).toBe('achter')
    // Donderdag, 1 van 3: nog 2 nodig, 4 dagen over.
    expect(weekTeller(stofzuigen, [vink('stofzuigen', '2026-10-12')], WEEK, '2026-10-15').status).toBe('bezig')
  })
  it('loopt achter als de week voorbij is zonder het minimum', () => {
    expect(weekTeller(stofzuigen, [vink('stofzuigen', '2026-10-12')], WEEK, '2026-10-25')).toEqual({ gedaan: 1, minimum: 3, status: 'achter' })
  })
  it('heeft geen minimum voor dagtaken en indien nodig', () => {
    expect(weekTeller(maakTaak({ id: 'a' }), [], WEEK, '2026-10-14')).toEqual({ gedaan: 0, minimum: null, status: 'vrij' })
  })
})

describe('takenVanVandaag', () => {
  const dag = maakTaak({ id: 'toilet', moment: 'ochtend' })
  const afsluit = maakTaak({ id: 'kassa', moment: 'afsluiten' })
  const extra = maakTaak({ id: 'spiegels', frequentie: 'extra' })
  const uit = maakTaak({ id: 'oud', actief: false })
  const taken = [dag, afsluit, stofzuigen, extra, uit]

  it('toont dagtaken, open weektaken en extra taken als optioneel; uitgezette niet', () => {
    const items = takenVanVandaag(taken, [], WEEK, '2026-10-14')
    expect(items.map((i) => [i.taak.id, i.soort])).toEqual([
      ['toilet', 'verplicht'],
      ['kassa', 'verplicht'],
      ['stofzuigen', 'verplicht'],
      ['spiegels', 'optioneel'],
    ])
  })
  it('laat een weektaak weg als het minimum al voor vandaag gehaald is', () => {
    const klaar = ['2026-10-12', '2026-10-13'].map((d) => vink('stofzuigen', d))
    const min2 = { ...stofzuigen, perWeekMin: 2 }
    expect(takenVanVandaag([min2], klaar, WEEK, '2026-10-14')).toEqual([])
  })
  it('houdt een weektaak zichtbaar als hij vandaag is afgevinkt, met de teller', () => {
    const v = ['2026-10-12', '2026-10-13', '2026-10-14'].map((d) => vink('stofzuigen', d))
    const [item] = takenVanVandaag([stofzuigen], v, WEEK, '2026-10-14')
    expect(item.afgevinkt?.datum).toBe('2026-10-14')
    expect(item.teller).toEqual({ gedaan: 3, minimum: 3, status: 'gehaald' })
  })
  it('telt wat nog open staat (alleen verplicht)', () => {
    const items = takenVanVandaag(taken, [vink('toilet', '2026-10-14')], WEEK, '2026-10-14')
    expect(nogOpen(items)).toBe(2)
  })
  it('groepeert per moment in vaste volgorde', () => {
    const items = takenVanVandaag(taken, [], WEEK, '2026-10-14')
    expect(perMoment(items).map((g) => g.moment)).toEqual(['ochtend', 'vrij', 'afsluiten'])
  })
})
