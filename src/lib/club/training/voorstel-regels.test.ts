import { describe, expect, it } from 'vitest'
import { cardioDosering, dosering, hoofddoel, kiesSplit, metExplosief, minutenVoor, reserve, volgordeRang } from './voorstel-regels'
import { notitieMetWaarom, notitieVoorLid, WAAROM_KOP, waaromUitNotitie } from './voorstel-uitleg'

describe('kiesSplit', () => {
  it('kiest full body bij 1 tot 3 dagen, boven en onder bij 4, vijf dagen bij 5 of meer', () => {
    expect(kiesSplit(1, 2).dagen).toHaveLength(1)
    expect(kiesSplit(2, 2).dagen.map((d) => d.titel)).toEqual(['Full body A', 'Full body B'])
    expect(kiesSplit(4, 2).naam).toBe('Boven en onder')
    expect(kiesSplit(5, 3).dagen).toHaveLength(5)
    expect(kiesSplit(6, 3).uitleg).toContain('herstel')
  })
  it('houdt een beginner op drie full body dagen', () => {
    expect(kiesSplit(5, 1).dagen).toHaveLength(3)
  })
  it('zet bij sport een explosief slot vooraan, niet bij een beginner', () => {
    expect(metExplosief(kiesSplit(3, 2), 'sport', 2).dagen.every((d) => d.slots[0].patroon === 'explosief')).toBe(true)
    expect(metExplosief(kiesSplit(3, 1), 'sport', 1).dagen[0].slots[0].patroon).toBe('squat')
    expect(metExplosief(kiesSplit(3, 2), 'kracht', 2).dagen[0].slots[0].patroon).toBe('squat')
  })
})

describe('dosering', () => {
  it('per doel andere herhalingen en rust', () => {
    expect(dosering('kracht', 'squat', 3)).toEqual({ sets: 4, herhalingen: '4-6', rustSec: 150 })
    expect(dosering('spiermassa', 'squat', 2).herhalingen).toBe('8-12')
    expect(dosering('conditie', 'squat', 2).rustSec).toBeLessThan(dosering('kracht', 'squat', 2).rustSec)
  })
  it('lichter voor een beginner, bij een klacht en compact bij weinig tijd', () => {
    expect(dosering('kracht', 'squat', 1)).toEqual({ sets: 3, herhalingen: '6-8', rustSec: 150 })
    expect(dosering('kracht', 'squat', 3, { klacht: true }).herhalingen).toBe('8-12')
    expect(dosering('sport', 'squat', 2, { klacht: true }).herhalingen).toBe('8-12')
    expect(dosering('spiermassa', 'squat', 2, { compact: true }).sets).toBe(2)
    expect(dosering('revalidatie', 'squat', 1, { compact: true }).sets).toBe(2)
  })
  it('romp in seconden, cardio in minuten, explosief kort', () => {
    expect(dosering('afvallen', 'core', 2).herhalingen).toBe('30-45 sec')
    expect(dosering('afvallen', 'cardio', 2)).toEqual({ sets: 1, herhalingen: '20-30 min', rustSec: 0 })
    expect(dosering('sport', 'explosief', 3)).toEqual({ sets: 3, herhalingen: '3-5', rustSec: 90 })
    expect(cardioDosering('afvallen', 40).herhalingen).toBe('10-15 min')
  })
})

describe('reserve, volgorde, tijd en hoofddoel', () => {
  it('reserve per doel en niveau', () => {
    expect(reserve('spiermassa', 'squat', 2)).toBe(1)
    expect(reserve('kracht', 'squat', 3)).toBe(2)
    expect(reserve('kracht', 'squat', 1)).toBe(3)
    expect(reserve('kracht', 'squat', 3, true)).toBe(3)
    expect(reserve('afvallen', 'core', 2)).toBeNull()
  })
  it('volgorde van groot naar klein', () => {
    expect(volgordeRang('explosief')).toBeLessThan(volgordeRang('squat'))
    expect(volgordeRang('trekken_verticaal')).toBeLessThan(volgordeRang('isolatie'))
    expect(volgordeRang('isolatie')).toBeLessThan(volgordeRang('core'))
    expect(volgordeRang('core')).toBeLessThan(volgordeRang('cardio'))
  })
  it('tijd per oefening uit sets, werk en rust', () => {
    expect(minutenVoor({ sets: 3, herhalingen: '8-12', rustSec: 80 }, 'squat')).toBe(7)
    expect(minutenVoor({ sets: 1, herhalingen: '20-30 min', rustSec: 0 }, 'cardio')).toBe(20)
  })
  it('zet revalidatie altijd voorop', () => {
    expect(hoofddoel(['afvallen', 'revalidatie', 'kracht'])).toBe('revalidatie')
    expect(hoofddoel(['conditie', 'spiermassa'])).toBe('spiermassa')
    expect(hoofddoel([])).toBe('gezondheid')
  })
})

describe('waarom in de notitie', () => {
  it('schrijft de uitleg met kop en leest hem terug', () => {
    const notitie = notitieMetWaarom(['Zin een.', 'Zin twee.', 'Zin drie.'], ['Overleg met de huisarts.'])
    expect(notitie.split('\n')[0]).toBe(WAAROM_KOP)
    expect(waaromUitNotitie(notitie)).toEqual({ zinnen: ['Zin een.', 'Zin twee.', 'Zin drie.'], letOp: ['Overleg met de huisarts.'] })
  })
  it('geeft null als de trainer de notitie heeft aangepast', () => {
    expect(waaromUitNotitie('Eigen notitie')).toBeNull()
    expect(waaromUitNotitie(null)).toBeNull()
    expect(waaromUitNotitie(WAAROM_KOP)).toBeNull()
  })
  it('laat het lid de uitleg zien zonder de Let op-regels voor de trainer', () => {
    const notitie = notitieMetWaarom(['Zin een.', 'Zin twee.'], ['Overleg met de huisarts.'])
    expect(notitieVoorLid(notitie)).toBe(`${WAAROM_KOP}\nZin een.\nZin twee.`)
    expect(notitieVoorLid('Eigen notitie\n\nTweede alinea')).toBe('Eigen notitie\n\nTweede alinea')
    expect(notitieVoorLid('Let op: houd je rug recht')).toBe('Let op: houd je rug recht')
    expect(notitieVoorLid(`${WAAROM_KOP}\nLet op: alleen voor de trainer`)).toBeNull()
    expect(notitieVoorLid('  ')).toBeNull()
    expect(notitieVoorLid(null)).toBeNull()
  })
  it('blijft binnen 1000 tekens', () => {
    expect(notitieMetWaarom(Array.from({ length: 40 }, () => 'x'.repeat(60)), []).length).toBeLessThanOrEqual(1000)
  })
})
