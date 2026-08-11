import { describe, it, expect } from 'vitest'
import { kiesMeldingen, type PlanContext, type PushVoorkeuren } from './planning'
import { minutenVanTijd } from './timing'

const allesAan: PushVoorkeuren = {
  checkinAan: true,
  streakAan: true,
  vitaWeekAan: true,
  stiltetijdStart: '22:00',
  stiltetijdEind: '08:00',
  maxPerDag: 2,
}

function ctx(over: Partial<PlanContext> = {}): PlanContext {
  return {
    nuMinuten: minutenVanTijd('20:00')!,
    datum: '2026-08-11',
    weekdag: 2, // dinsdag
    voorkeuren: allesAan,
    reedsVandaagActief: false,
    streak: 0,
    slimMomentCheckin: '20:00',
    laatstVerzonden: {},
    reedsVerzondenVandaag: 0,
    ...over,
  }
}

describe('kiesMeldingen — grenzen', () => {
  it('stuurt niets binnen de stiltetijd', () => {
    expect(kiesMeldingen(ctx({ nuMinuten: minutenVanTijd('23:30')! }))).toEqual([])
  })
  it('stuurt niets als de daglimiet al bereikt is', () => {
    expect(kiesMeldingen(ctx({ reedsVerzondenVandaag: 2 }))).toEqual([])
  })
  it('stuurt geen herinnering als de gebruiker vandaag al actief was', () => {
    expect(kiesMeldingen(ctx({ reedsVandaagActief: true, streak: 5 }))).toEqual([])
  })
})

describe('kiesMeldingen — check-in', () => {
  it('herinnert op of na het slimme moment', () => {
    const r = kiesMeldingen(ctx({ slimMomentCheckin: '20:00', nuMinuten: minutenVanTijd('20:00')!, streak: 0 }))
    expect(r).toHaveLength(1)
    expect(r[0].type).toBe('checkin')
  })
  it('herinnert nog niet vóór het slimme moment', () => {
    expect(kiesMeldingen(ctx({ slimMomentCheckin: '20:30', nuMinuten: minutenVanTijd('20:00')!, streak: 0 }))).toEqual([])
  })
  it('herinnert niet twee keer op dezelfde dag', () => {
    expect(kiesMeldingen(ctx({ streak: 0, laatstVerzonden: { checkin: '2026-08-11' } }))).toEqual([])
  })
  it('respecteert de uit-stand', () => {
    expect(kiesMeldingen(ctx({ streak: 0, voorkeuren: { ...allesAan, checkinAan: false } }))).toEqual([])
  })
})

describe('kiesMeldingen — streak in gevaar', () => {
  it('waarschuwt s avonds bij een streak die het beschermen waard is', () => {
    const r = kiesMeldingen(ctx({ streak: 6, nuMinuten: minutenVanTijd('20:30')! }))
    expect(r[0].type).toBe('streak')
    expect(r[0].tekst).toContain('6 dagen')
  })
  it('heeft voorrang op de gewone check-in', () => {
    const r = kiesMeldingen(ctx({ streak: 6, nuMinuten: minutenVanTijd('20:00')!, slimMomentCheckin: '20:00' }))
    expect(r[0].type).toBe('streak')
  })
  it('waarschuwt niet te vroeg op de dag', () => {
    const r = kiesMeldingen(ctx({ streak: 6, nuMinuten: minutenVanTijd('15:00')!, slimMomentCheckin: '21:00' }))
    expect(r).toEqual([]) // te vroeg voor streak, en check-in-moment nog niet bereikt
  })
  it('waarschuwt niet bij een te lage streak', () => {
    const r = kiesMeldingen(ctx({ streak: 1, nuMinuten: minutenVanTijd('20:30')!, voorkeuren: { ...allesAan, checkinAan: false } }))
    expect(r).toEqual([])
  })
})

describe('kiesMeldingen — Vita weekinzicht', () => {
  it('stuurt op zondagochtend', () => {
    const r = kiesMeldingen(ctx({ weekdag: 0, nuMinuten: minutenVanTijd('11:00')!, reedsVandaagActief: true }))
    expect(r[0].type).toBe('vita_week')
  })
  it('stuurt niet op een andere dag', () => {
    expect(kiesMeldingen(ctx({ weekdag: 3, nuMinuten: minutenVanTijd('11:00')!, reedsVandaagActief: true }))).toEqual([])
  })
  it('stuurt niet twee keer dezelfde dag', () => {
    const r = kiesMeldingen(ctx({ weekdag: 0, nuMinuten: minutenVanTijd('11:00')!, reedsVandaagActief: true, laatstVerzonden: { vita_week: '2026-08-11' } }))
    expect(r).toEqual([])
  })
})
