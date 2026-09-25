import { describe, expect, test } from 'vitest'
import { metAgendaContact } from './agenda-contact'
import { laatsteContactMoment } from './versheid'
import { koudeContacten } from '@/lib/lifeos/weekmail/weekmail'
import type { Persoon, Groep } from './crm'

function persoon(naam: string, groep: Groep, laatsteContactOp: string | null = null): Persoon {
  return {
    id: `${naam}-${groep}`,
    naam,
    groep,
    status: 'actief',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp,
    sessiesPerWeek: null,
    locatie: null,
    vakantieTot: null,
    abonnement: null,
    duo: false,
    aangemaaktOp: '2026-01-01T00:00:00Z',
  }
}

const NU = new Date('2026-09-28T08:00:00Z')
const op = (iso: string, titel: string) => ({ titel, startOp: new Date(iso) })

describe('metAgendaContact', () => {
  const kevin = persoon('Kevin', 'pt_klant', '2026-08-02T12:00:00Z')
  const ruben = persoon('Ruben', 'management')
  const ken = persoon('Ken', 'management')
  const nieckPt = persoon('Nieck', 'pt_team')
  const nieckBudel = persoon('Nieck', 'budel_team')
  const alle = [kevin, ruben, ken, nieckPt, nieckBudel]

  test('laatste voorbije afspraak per persoon; toekomst telt niet', () => {
    const uit = metAgendaContact(
      alle,
      [op('2026-09-15T17:30:00Z', 'Kevin PT'), op('2026-09-22T17:30:00Z', 'Kevin PT'), op('2026-09-29T17:30:00Z', 'Kevin PT')],
      NU,
    )
    expect(uit.find((p) => p.naam === 'Kevin')?.laatsteAfspraakOp).toBe('2026-09-22T17:30:00.000Z')
  })

  test('afspraak met meerdere mensen telt voor elk; naamgenoten voor niemand', () => {
    const uit = metAgendaContact(alle, [op('2026-09-20T09:00:00Z', 'Ruben Ken en Dave'), op('2026-09-21T09:00:00Z', 'Nieck')], NU)
    expect(uit.find((p) => p.naam === 'Ruben')?.laatsteAfspraakOp).toBe('2026-09-20T09:00:00.000Z')
    expect(uit.find((p) => p.naam === 'Ken')?.laatsteAfspraakOp).toBe('2026-09-20T09:00:00.000Z')
    expect(uit.filter((p) => p.naam === 'Nieck').map((p) => p.laatsteAfspraakOp)).toEqual([null, null])
  })

  test('muteert de invoer niet', () => {
    metAgendaContact(alle, [op('2026-09-22T17:30:00Z', 'Kevin PT')], NU)
    expect(kevin.laatsteAfspraakOp).toBeUndefined()
  })
})

describe('laatsteContactMoment', () => {
  test('de latere van gelogd contact en laatste afspraak', () => {
    expect(laatsteContactMoment({ laatsteContactOp: '2026-08-02T00:00:00Z', laatsteAfspraakOp: '2026-09-22T00:00:00Z' })).toBe('2026-09-22T00:00:00Z')
    expect(laatsteContactMoment({ laatsteContactOp: '2026-09-25T00:00:00Z', laatsteAfspraakOp: '2026-09-22T00:00:00Z' })).toBe('2026-09-25T00:00:00Z')
    expect(laatsteContactMoment({ laatsteContactOp: null, laatsteAfspraakOp: '2026-09-22T00:00:00Z' })).toBe('2026-09-22T00:00:00Z')
    expect(laatsteContactMoment({ laatsteContactOp: '2026-08-02T00:00:00Z' })).toBe('2026-08-02T00:00:00Z')
    expect(laatsteContactMoment({ laatsteContactOp: null, laatsteAfspraakOp: null })).toBeNull()
  })
})

describe('koudeContacten — een wekelijkse klant verwatert niet (echte data 28-09)', () => {
  test('Kevin: gelogd contact 2 aug, maar vorige week nog PT → niet koud', () => {
    const kevin = persoon('Kevin', 'pt_klant', '2026-08-02T12:00:00Z')
    expect(koudeContacten([kevin], NU).map((c) => c.naam)).toEqual(['Kevin'])
    const verrijkt = metAgendaContact([kevin], [op('2026-09-22T17:30:00Z', 'Kevin PT')], NU)
    expect(koudeContacten(verrijkt, NU)).toEqual([])
  })
})
