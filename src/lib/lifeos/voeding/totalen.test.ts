import { describe, it, expect } from 'vitest'
import {
  dagTotalen,
  isVolledig,
  isOnvolledig,
  waterTotaalMl,
  waterVoortgang,
  type Meetbaar,
} from './totalen'

/** Een log met alles leeg; de test vult in wat hij bedoelt. */
function log(velden: Partial<Meetbaar> = {}): Meetbaar {
  return { kcal: null, eiwitG: null, koolhydratenG: null, vetG: null, ...velden }
}

describe('dagTotalen — geen logs', () => {
  it('geeft null, geen 0 — dat betekent iets anders', () => {
    // Arrange
    const logs: Meetbaar[] = []

    // Act
    const t = dagTotalen(logs)

    // Assert — 0 zou zeggen "je at vandaag nul calorieën". null zegt "je hebt
    // niets gelogd". Alleen de tweede is waar, en dit is de hele reden dat dit
    // project bestaat.
    expect(t.kcal.waarde).toBeNull()
    expect(t.kcal.waarde).not.toBe(0)
    expect(t.eiwit.waarde).toBeNull()
    expect(t.koolhydraten.waarde).toBeNull()
    expect(t.vet.waarde).toBeNull()
    expect(t.logs).toBe(0)
  })

  it('is niet volledig en niet onvolledig — er is niets', () => {
    // Arrange/Act
    const t = dagTotalen([])

    // Assert — "onvolledig" zou een zin op het scherm zetten over maaltijden
    // die niet bestaan.
    expect(isVolledig(t.eiwit)).toBe(false)
    expect(isOnvolledig(t.eiwit)).toBe(false)
  })
})

describe('dagTotalen — alles ingevuld', () => {
  it('telt op en meldt volledige dekking', () => {
    // Arrange
    const logs = [
      log({ kcal: 500, eiwitG: 30, koolhydratenG: 50, vetG: 20 }),
      log({ kcal: 700, eiwitG: 40, koolhydratenG: 60, vetG: 25 }),
    ]

    // Act
    const t = dagTotalen(logs)

    // Assert
    expect(t.kcal).toEqual({ waarde: 1200, gemeten: 2, vanTotaal: 2 })
    expect(t.eiwit).toEqual({ waarde: 70, gemeten: 2, vanTotaal: 2 })
    expect(isVolledig(t.eiwit)).toBe(true)
    expect(isOnvolledig(t.eiwit)).toBe(false)
  })
})

describe('dagTotalen — deels ingevulde macros', () => {
  it('telt de bekende waarden op en zegt uit hoeveel logs ze komen', () => {
    // Arrange — drie maaltijden, bij één de eiwitten ingevuld. Precies het
    // scenario uit de kop van totalen.ts.
    const logs = [
      log({ kcal: 400, eiwitG: 42 }),
      log({ kcal: 600 }),
      log({ kcal: 300 }),
    ]

    // Act
    const t = dagTotalen(logs)

    // Assert — 42 is geen dagtotaal maar wél een echte som. Het getal blijft
    // staan; de dekking reist mee zodat de UI het niet als dagtotaal toont.
    expect(t.eiwit).toEqual({ waarde: 42, gemeten: 1, vanTotaal: 3 })
    expect(isOnvolledig(t.eiwit)).toBe(true)
    expect(isVolledig(t.eiwit)).toBe(false)
  })

  it('telt een ontbrekende macro NOOIT als 0 mee', () => {
    // Arrange — twee maaltijden, één met eiwit.
    const logs = [log({ eiwitG: 30 }), log({})]

    // Act
    const t = dagTotalen(logs)

    // Assert — de som is 30, niet "30 + 0 = 30 en dus compleet". Het verschil
    // zit niet in het getal maar in `gemeten`: die verraadt dat er een maaltijd
    // buiten viel.
    expect(t.eiwit.waarde).toBe(30)
    expect(t.eiwit.gemeten).toBe(1)
    expect(t.eiwit.vanTotaal).toBe(2)
  })

  it('houdt de dekking per veld apart', () => {
    // Arrange — kcal overal, eiwit bij twee, vet bij niets.
    const logs = [
      log({ kcal: 400, eiwitG: 20 }),
      log({ kcal: 600, eiwitG: 25 }),
      log({ kcal: 200 }),
    ]

    // Act
    const t = dagTotalen(logs)

    // Assert — één veld mag niet de dekking van een ander veld verpesten.
    expect(isVolledig(t.kcal)).toBe(true)
    expect(isOnvolledig(t.eiwit)).toBe(true)
    expect(t.vet.waarde).toBeNull()
  })
})

describe('dagTotalen — kcal zonder macros', () => {
  it('geeft een volledig kcal-totaal en null voor de macros', () => {
    // Arrange — het gewone geval: je weet de calorieën van een broodje wel,
    // de macro-verdeling niet.
    const logs = [log({ kcal: 350 }), log({ kcal: 450 })]

    // Act
    const t = dagTotalen(logs)

    // Assert — kcal is compleet én de macro's zijn eerlijk leeg. Een halve log
    // is beter dan geen log; hier zie je waarom dat werkt.
    expect(t.kcal).toEqual({ waarde: 800, gemeten: 2, vanTotaal: 2 })
    expect(isVolledig(t.kcal)).toBe(true)
    expect(t.eiwit.waarde).toBeNull()
    expect(t.eiwit.gemeten).toBe(0)
    expect(t.eiwit.vanTotaal).toBe(2)
    expect(isOnvolledig(t.eiwit)).toBe(false) // niets gemeten ≠ deels gemeten
  })
})

describe('dagTotalen — randgevallen', () => {
  it('telt een gemeten 0 wél mee — die is een meting', () => {
    // Arrange — zwarte koffie heeft echt nul vet. Dat is data.
    const logs = [log({ vetG: 0 }), log({ vetG: 12 })]

    // Act
    const t = dagTotalen(logs)

    // Assert — beide logs tellen mee: de dekking is compleet.
    expect(t.vet).toEqual({ waarde: 12, gemeten: 2, vanTotaal: 2 })
    expect(isVolledig(t.vet)).toBe(true)
  })

  it('een dag met alleen een gemeten 0 geeft 0, niet null', () => {
    // Arrange/Act
    const t = dagTotalen([log({ kcal: 0 })])

    // Assert — hier is 0 het eerlijke antwoord: je logde iets van nul calorieën.
    expect(t.kcal.waarde).toBe(0)
    expect(t.kcal.waarde).not.toBeNull()
  })

  it('rondt de som af op één decimaal', () => {
    // Arrange — 12.5 + 3.3 is in floating point 15.799999999999999.
    const logs = [log({ eiwitG: 12.5 }), log({ eiwitG: 3.3 })]

    // Act
    const t = dagTotalen(logs)

    // Assert
    expect(t.eiwit.waarde).toBe(15.8)
  })

  it('slaat kapotte getallen over in plaats van NaN door te geven', () => {
    // Arrange — een NaN uit een kapotte parse mag geen heel dagtotaal wissen.
    const logs = [log({ kcal: Number.NaN }), log({ kcal: 300 })]

    // Act
    const t = dagTotalen(logs)

    // Assert
    expect(t.kcal.waarde).toBe(300)
    expect(t.kcal.gemeten).toBe(1)
    expect(t.kcal.vanTotaal).toBe(2)
  })
})

describe('waterTotaalMl', () => {
  it('telt de slokken op', () => {
    expect(waterTotaalMl([{ ml: 250 }, { ml: 500 }, { ml: 250 }])).toBe(1000)
  })

  it('geeft null bij geen logs, geen 0', () => {
    // "Je hebt niets gelogd" is geen "je dronk niets".
    expect(waterTotaalMl([])).toBeNull()
    expect(waterTotaalMl([])).not.toBe(0)
  })
})

describe('waterVoortgang', () => {
  it('rekent het percentage van je doel uit', () => {
    // Arrange/Act
    const v = waterVoortgang(1500, 2000)

    // Assert
    expect(v).toEqual({ totaalMl: 1500, doelMl: 2000, pct: 75 })
  })

  it('geeft null zonder doel — we verzinnen geen 2 liter', () => {
    // Arrange/Act/Assert — zonder doel toont de kaart het totaal zonder
    // percentage. Een default-norm zou een uitspraak zijn over Kane's lichaam
    // die deze app niet kan doen.
    expect(waterVoortgang(1500, null)).toBeNull()
  })

  it('geeft null als er niets gelogd is', () => {
    expect(waterVoortgang(null, 2000)).toBeNull()
  })

  it('klemt niet op 100 — over je doel heen is ook een feit', () => {
    // Arrange/Act
    const v = waterVoortgang(2400, 2000)

    // Assert
    expect(v?.pct).toBe(120)
  })

  it('geeft null bij een doel van 0 in plaats van te delen door nul', () => {
    expect(waterVoortgang(500, 0)).toBeNull()
  })
})
