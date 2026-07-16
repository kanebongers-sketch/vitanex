import { describe, it, expect } from 'vitest'
import {
  leesNieuweVoedingLog,
  leesNieuweWaterLog,
  leesVoedingAntwoord,
  leesWaterAntwoord,
  voedingLogVanRij,
  doelenVanRij,
  GEEN_DOELEN,
  MAX_SLOK_ML,
} from './voeding'

describe('leesNieuweWaterLog', () => {
  it('accepteert een glas', () => {
    // Arrange/Act
    const uit = leesNieuweWaterLog({ datum: '2026-07-16', ml: 250 })

    // Assert
    expect(uit).toEqual({ ok: true, waarde: { datum: '2026-07-16', ml: 250 } })
  })

  it('weigert een slok van niets', () => {
    expect(leesNieuweWaterLog({ datum: '2026-07-16', ml: 0 }).ok).toBe(false)
    expect(leesNieuweWaterLog({ datum: '2026-07-16', ml: -250 }).ok).toBe(false)
  })

  it('weigert een typefout', () => {
    // 250 → 250000: het vangnet, niet een uitspraak over gezond drinken.
    expect(leesNieuweWaterLog({ datum: '2026-07-16', ml: MAX_SLOK_ML + 1 }).ok).toBe(false)
  })

  it('weigert een onzin-datum', () => {
    expect(leesNieuweWaterLog({ datum: '2026-02-31', ml: 250 }).ok).toBe(false)
    expect(leesNieuweWaterLog({ datum: 'gisteren', ml: 250 }).ok).toBe(false)
  })
})

describe('leesNieuweVoedingLog', () => {
  it('accepteert een log met alleen een omschrijving — een halve log is een log', () => {
    // Arrange/Act
    const uit = leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'Broodje kaas' })

    // Assert — dit is het gewone geval, niet een randgeval. Alle macro's null,
    // en dat is precies goed: null = niet ingevuld.
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde.omschrijving).toBe('Broodje kaas')
    expect(uit.waarde.kcal).toBeNull()
    expect(uit.waarde.eiwitG).toBeNull()
    expect(uit.waarde.moment).toBeNull()
  })

  it('maakt van een leeg macroveld NOOIT een 0', () => {
    // Arrange — een leeg <input type="number"> levert ''.
    const uit = leesNieuweVoedingLog({
      datum: '2026-07-16',
      omschrijving: 'Broodje kaas',
      kcal: 350,
      eiwitG: '',
    })

    // Assert — als dit ooit 0 wordt, liegt de hele keten erachter mee.
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde.kcal).toBe(350)
    expect(uit.waarde.eiwitG).toBeNull()
    expect(uit.waarde.eiwitG).not.toBe(0)
  })

  it('laat een gemeten 0 wél door', () => {
    // Arrange/Act — zwarte koffie heeft echt nul vet. Dat is data.
    const uit = leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'Koffie', vetG: 0 })

    // Assert
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde.vetG).toBe(0)
  })

  it('leest cijferstrings uit een number-input, met komma of punt', () => {
    // Arrange/Act
    const uit = leesNieuweVoedingLog({
      datum: '2026-07-16',
      omschrijving: 'Kwark',
      kcal: '150',
      eiwitG: '17,5',
    })

    // Assert
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde.kcal).toBe(150)
    expect(uit.waarde.eiwitG).toBe(17.5)
  })

  it('weigert een log zonder omschrijving', () => {
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: '   ' }).ok).toBe(false)
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', kcal: 350 }).ok).toBe(false)
  })

  it('weigert negatieve en onzinnige macros', () => {
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'X', kcal: -10 }).ok).toBe(false)
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'X', kcal: 'veel' }).ok).toBe(false)
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'X', kcal: 999999 }).ok).toBe(false)
  })

  it('weigert een onbekend moment', () => {
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'X', moment: 'luch' }).ok).toBe(false)
    expect(leesNieuweVoedingLog({ datum: '2026-07-16', omschrijving: 'X', moment: 'lunch' }).ok).toBe(true)
  })
})

describe('voedingLogVanRij', () => {
  it('leest numeric als getal, niet als string', () => {
    // Arrange — PostgREST levert `numeric` als STRING aan. Zonder conversie
    // plakt `+` ze aan elkaar en staat er '3040' waar 70 hoort.
    const rij = {
      id: 'a',
      datum: '2026-07-16',
      omschrijving: 'Kwark',
      kcal: 150,
      eiwit_g: '17.5',
      koolhydraten_g: null,
      vet_g: null,
      moment: 'ontbijt',
      aangemaakt_op: '2026-07-16T08:00:00Z',
    }

    // Act
    const log = voedingLogVanRij(rij)

    // Assert
    expect(log?.eiwitG).toBe(17.5)
    expect(typeof log?.eiwitG).toBe('number')
    expect(log?.koolhydratenG).toBeNull()
  })

  it('geeft null bij een rij zonder omschrijving in plaats van een half object', () => {
    expect(voedingLogVanRij({ id: 'a', datum: '2026-07-16' })).toBeNull()
    expect(voedingLogVanRij(null)).toBeNull()
  })
})

describe('doelenVanRij', () => {
  it('geeft geen doelen terug als er geen rij is — dat is een geldige toestand', () => {
    // Arrange/Act/Assert — géén verzonnen 2000 kcal.
    expect(doelenVanRij(null)).toEqual(GEEN_DOELEN)
    expect(doelenVanRij(undefined)).toEqual(GEEN_DOELEN)
  })

  it('leest een half ingevulde rij: wat er staat is een doel, de rest is null', () => {
    // Arrange/Act
    const doelen = doelenVanRij({ kcal_doel: null, eiwit_doel_g: '180.0', water_doel_ml: 2500 })

    // Assert
    expect(doelen).toEqual({ kcalDoel: null, eiwitDoelG: 180, waterDoelMl: 2500 })
  })
})

describe('leesWaterAntwoord', () => {
  it('leest een geldig antwoord', () => {
    // Arrange
    const json = {
      logs: [{ id: 'a', datum: '2026-07-16', ml: 250, aangemaaktOp: '2026-07-16T08:00:00Z' }],
      doelMl: 2500,
    }

    // Act
    const uit = leesWaterAntwoord(json)

    // Assert
    expect(uit?.logs).toHaveLength(1)
    expect(uit?.doelMl).toBe(2500)
  })

  it('leest "geen doel" als null en niet als fout', () => {
    expect(leesWaterAntwoord({ logs: [], doelMl: null })).toEqual({ logs: [], doelMl: null })
  })

  it('geeft null bij een vorm die we niet herkennen', () => {
    // Liever de foutstaat dan een half object dat drie componenten verderop crasht.
    expect(leesWaterAntwoord({ logs: 'nope' })).toBeNull()
    expect(leesWaterAntwoord({})).toBeNull()
    expect(leesWaterAntwoord(null)).toBeNull()
  })

  it('geeft null als één log onleesbaar is — geen stille halve lijst', () => {
    // Arrange — een lijst waaruit we stilletjes een rij weglaten, toont minder
    // water dan je dronk. Dan liever eerlijk falen.
    const json = { logs: [{ id: 'a', ml: 250 }], doelMl: null }

    // Act/Assert
    expect(leesWaterAntwoord(json)).toBeNull()
  })
})

describe('leesVoedingAntwoord', () => {
  it('leest logs en doelen', () => {
    // Arrange
    const json = {
      logs: [
        {
          id: 'a',
          datum: '2026-07-16',
          omschrijving: 'Kwark',
          kcal: 150,
          eiwitG: 17.5,
          koolhydratenG: null,
          vetG: null,
          moment: 'ontbijt',
          aangemaaktOp: '2026-07-16T08:00:00Z',
        },
      ],
      doelen: { kcalDoel: null, eiwitDoelG: 180, waterDoelMl: null },
    }

    // Act
    const uit = leesVoedingAntwoord(json)

    // Assert
    expect(uit?.logs[0]?.omschrijving).toBe('Kwark')
    expect(uit?.doelen.eiwitDoelG).toBe(180)
    expect(uit?.doelen.kcalDoel).toBeNull()
  })

  it('overleeft een ontbrekend doelen-blok — geen doelen is geldig', () => {
    // Arrange/Act
    const uit = leesVoedingAntwoord({ logs: [] })

    // Assert
    expect(uit?.doelen).toEqual(GEEN_DOELEN)
  })
})
