import { describe, expect, test } from 'vitest'
import { bepaalStatus, coachgesprekTitel, matchtCoachgesprek, type PtEvent, type PtPersoon } from './pt-gesprek'

describe('coachgesprekTitel', () => {
  test('bouwt de vaste naam met de klant ertussen', () => {
    expect(coachgesprekTitel('Iris')).toBe('Coachgesprek PT - Kane (Iris)')
  })

  test('trimt de naam', () => {
    expect(coachgesprekTitel('  Rick ')).toBe('Coachgesprek PT - Kane (Rick)')
  })
})

describe('matchtCoachgesprek', () => {
  test('herkent de eigen afspraaknaam', () => {
    expect(matchtCoachgesprek('Coachgesprek PT - Kane (Iris)', 'Iris')).toBe(true)
  })

  test('is hoofdletter- en spatieongevoelig', () => {
    expect(matchtCoachgesprek('  coachgesprek pt - kane (IRIS)  ', 'iris')).toBe(true)
  })

  test('matcht niet de coachgesprek van een ándere klant', () => {
    expect(matchtCoachgesprek('Coachgesprek PT - Kane (Rick)', 'Iris')).toBe(false)
  })

  test('een gewone afspraak met de naam erin telt niet — het signaal moet erbij', () => {
    expect(matchtCoachgesprek('Lunch met Iris', 'Iris')).toBe(false)
  })

  test('geen titel of lege naam matcht nooit', () => {
    expect(matchtCoachgesprek(null, 'Iris')).toBe(false)
    expect(matchtCoachgesprek('Coachgesprek PT - Kane ()', '')).toBe(false)
  })
})

describe('bepaalStatus', () => {
  const personen: PtPersoon[] = [
    { id: 'a', naam: 'Iris', email: 'iris@x.nl' },
    { id: 'b', naam: 'Rick', email: null },
  ]

  test('vinkt af wie een gesprek in het venster heeft, en laat de rest openstaan', () => {
    const events: PtEvent[] = [
      { titel: 'Coachgesprek PT - Kane (Iris)', startOp: '2026-09-10T09:00:00.000Z' },
    ]

    const status = bepaalStatus(personen, events)

    expect(status[0]).toMatchObject({ naam: 'Iris', ingepland: true, wanneer: '2026-09-10T09:00:00.000Z' })
    expect(status[1]).toMatchObject({ naam: 'Rick', ingepland: false, wanneer: null })
  })

  test('draagt het mailadres mee (voor de uitnodiging) en null als het ontbreekt', () => {
    const status = bepaalStatus(personen, [])
    expect(status[0].email).toBe('iris@x.nl')
    expect(status[1].email).toBeNull()
  })

  test('geen events: iedereen moet nog ingepland worden', () => {
    expect(bepaalStatus(personen, []).every((s) => !s.ingepland)).toBe(true)
  })
})
