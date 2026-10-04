import { afterEach, describe, expect, it } from 'vitest'
import { legeSuggestieCache, onthoud, splitsBekend } from './suggestie-cache'
import type { MailKenmerk, Suggestie } from './analyse'

const NU = new Date('2026-10-05T09:00:00+02:00')
const MORGEN = new Date('2026-10-06T09:00:00+02:00')

const mail = (id: string, onderwerp = `Onderwerp ${id}`): MailKenmerk => ({ externId: id, afzender: 'Sanne', onderwerp })
const taak = (id: string): Suggestie => ({ externId: id, soort: 'taak', titel: 'Offerte sturen', wanneer: null, vertrouwen: 0.9 })

afterEach(() => legeSuggestieCache())

describe('suggestie-cache', () => {
  it('een onbekende mail moet geanalyseerd worden', () => {
    const { bekend, nieuw } = splitsBekend([mail('a')], NU)
    expect(bekend).toEqual([])
    expect(nieuw).toHaveLength(1)
  })

  it('een geanalyseerde mail komt de volgende keer uit het geheugen', () => {
    onthoud([mail('a')], [taak('a')], NU)
    const { bekend, nieuw } = splitsBekend([mail('a'), mail('b')], NU)
    expect(bekend).toEqual([taak('a')])
    expect(nieuw.map((m) => m.externId)).toEqual(['b'])
  })

  it('een gewijzigd onderwerp telt als nieuw', () => {
    onthoud([mail('a')], [taak('a')], NU)
    expect(splitsBekend([mail('a', 'Ander onderwerp')], NU).nieuw).toHaveLength(1)
  })

  it('een nieuwe dag analyseert opnieuw (relatieve datums)', () => {
    onthoud([mail('a')], [taak('a')], NU)
    expect(splitsBekend([mail('a')], MORGEN).nieuw).toHaveLength(1)
  })

  it('onthoudt geen mislukte analyse', () => {
    onthoud([mail('a')], [{ externId: 'a', soort: 'geen', titel: null, wanneer: null, vertrouwen: 0 }], NU)
    expect(splitsBekend([mail('a')], NU).nieuw).toHaveLength(1)
  })

  it('onthoudt wél een bewuste "geen actie" met vertrouwen', () => {
    onthoud([mail('a')], [{ externId: 'a', soort: 'geen', titel: null, wanneer: null, vertrouwen: 0.8 }], NU)
    expect(splitsBekend([mail('a')], NU).bekend).toHaveLength(1)
  })
})
