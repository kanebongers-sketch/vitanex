import { describe, it, expect } from 'vitest'
import { dekkingTekst, macroTekst, waterTekst, dagSamenvatting, momentLabel } from './formatteer'
import { dagTotalen, type Meetbaar } from './totalen'
import type { Totaal } from './totalen'

function totaal(waarde: number | null, gemeten: number, vanTotaal: number): Totaal {
  return { waarde, gemeten, vanTotaal }
}

function log(velden: Partial<Meetbaar> = {}): Meetbaar {
  return { kcal: null, eiwitG: null, koolhydratenG: null, vetG: null, ...velden }
}

describe('waterTekst', () => {
  it('toont ml onder een liter en liters daarboven', () => {
    expect(waterTekst(750)).toBe('750 ml')
    expect(waterTekst(1500)).toBe('1,5 l')
    expect(waterTekst(2000)).toBe('2,0 l')
  })

  it('null blijft null — de UI beslist wat er dan staat', () => {
    expect(waterTekst(null)).toBeNull()
  })
})

describe('dekkingTekst', () => {
  it('zegt uit hoeveel maaltijden een onvolledig totaal komt', () => {
    // Arrange/Act/Assert — dit is de zin die voorkomt dat '42 g' als dagtotaal
    // gelezen wordt.
    expect(dekkingTekst(totaal(42, 1, 3))).toBe('uit 1 van 3 maaltijden')
    expect(dekkingTekst(totaal(70, 2, 3))).toBe('uit 2 van 3 maaltijden')
  })

  it('zwijgt als het totaal de hele dag dekt', () => {
    // Een voorbehoud bij een compleet getal is ruis, en ruis leert je het
    // voorbehoud negeren — juist als het er wél toe doet.
    expect(dekkingTekst(totaal(70, 3, 3))).toBeNull()
  })

  it('zwijgt als er niets gemeten is — er is geen getal om te nuanceren', () => {
    expect(dekkingTekst(totaal(null, 0, 3))).toBeNull()
  })

  it('vervoegt "maaltijd" enkelvoudig', () => {
    expect(dekkingTekst(totaal(0, 0, 1))).toBeNull()
    expect(dekkingTekst(totaal(42, 1, 2))).toBe('uit 1 van 2 maaltijden')
  })
})

describe('macroTekst', () => {
  it('levert getal en dekking altijd samen', () => {
    // Arrange — drie maaltijden, bij één de eiwitten ingevuld.
    const t = dagTotalen([log({ eiwitG: 42 }), log(), log()])

    // Act
    const tekst = macroTekst(t.eiwit, 'g')

    // Assert — het type dwingt af dat je de dekking in handen krijgt; je kunt
    // de 42 niet lezen zonder de 1-van-3 tegen te komen.
    expect(tekst).toEqual({ waarde: '42 g', dekking: 'uit 1 van 3 maaltijden' })
  })

  it('geeft een compleet totaal zonder voorbehoud', () => {
    // Arrange
    const t = dagTotalen([log({ eiwitG: 30 }), log({ eiwitG: 40 })])

    // Act/Assert
    expect(macroTekst(t.eiwit, 'g')).toEqual({ waarde: '70 g', dekking: null })
  })

  it('geeft null als er niets gemeten is — geen "0 g"', () => {
    // Arrange — twee logs, geen enkele met eiwit.
    const t = dagTotalen([log({ kcal: 300 }), log({ kcal: 400 })])

    // Act/Assert — '0 g' zou beweren dat je geen eiwit at. Je vulde het niet in.
    expect(macroTekst(t.eiwit, 'g')).toBeNull()
  })

  it('toont een gemeten 0 wél', () => {
    // Arrange
    const t = dagTotalen([log({ vetG: 0 })])

    // Act/Assert
    expect(macroTekst(t.vet, 'g')).toEqual({ waarde: '0 g', dekking: null })
  })
})

describe('dagSamenvatting', () => {
  it('beschrijft, oordeelt niet', () => {
    // Geen advies, geen "je eet te weinig". Cijfers tonen, niet vinden.
    expect(dagSamenvatting(0)).toBe('Nog niets gelogd vandaag.')
    expect(dagSamenvatting(1)).toBe('1 ding gelogd vandaag.')
    expect(dagSamenvatting(3)).toBe('3 dingen gelogd vandaag.')
  })
})

describe('momentLabel', () => {
  it('geeft het Nederlandse label', () => {
    expect(momentLabel('ontbijt')).toBe('Ontbijt')
    expect(momentLabel('snack')).toBe('Snack')
  })
})
