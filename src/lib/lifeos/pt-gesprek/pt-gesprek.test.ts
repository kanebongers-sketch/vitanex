import { describe, expect, test } from 'vitest'
import { bepaalStatus, coachAchterstand, coachgesprekTitel, matchtCoachgesprek, type PtEvent, type PtPersoon } from './pt-gesprek'

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
    // Hele woorden: "Jamey" is niet "Amey", "Bennet" niet "Ben".
    expect(matchtCoachgesprek('Coachgesprek PT - Kane (Jamey)', 'Amey')).toBe(false)
    expect(matchtCoachgesprek('Coachgesprek PT - Kane (Bennet)', 'Ben')).toBe(false)
    expect(matchtCoachgesprek('Coachgesprek PT - Kane (Amey)', 'Amey')).toBe(true)
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

describe('coachAchterstand', () => {
  const NU = new Date('2026-09-30T08:00:00Z')
  const gesprek = (naam: string, iso: string): PtEvent => ({ titel: `Coachgesprek PT - Kane (${naam})`, startOp: iso })

  test('gesprek in de afgelopen of komende 14 dagen = op ritme', () => {
    const events = [gesprek('Michael', '2026-09-28T18:00:00Z'), gesprek('Brandon', '2026-10-10T10:00:00Z')]
    expect(coachAchterstand([{ naam: 'Michael' }, { naam: 'Brandon' }], events, NU)).toEqual([])
  })

  test('te lang geleden en niets gepland → achterstand met "laatst"', () => {
    const uit = coachAchterstand([{ naam: 'Dylan' }], [gesprek('Dylan', '2026-09-09T16:30:00Z')], NU)
    expect(uit).toEqual([{ naam: 'Dylan', laatsteOp: '2026-09-09T16:30:00.000Z' }])
  })

  test('nooit gezien eerst, dan langst geleden; ander gesprek telt niet', () => {
    const events = [
      gesprek('Dylan', '2026-09-09T16:30:00Z'),
      gesprek('Amey', '2026-08-20T10:00:00Z'),
      { titel: 'Tristan PT - Kane', startOp: '2026-09-17T13:00:00Z' },
    ]
    const uit = coachAchterstand([{ naam: 'Dylan' }, { naam: 'Tristan' }, { naam: 'Amey' }], events, NU)
    expect(uit.map((a) => a.naam)).toEqual(['Tristan', 'Amey', 'Dylan'])
  })
})
