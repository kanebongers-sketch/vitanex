import { describe, expect, it } from 'vitest'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { filterPersonen, LEGE_WEERGAVE, sorteerPersonen, type WeergaveKeuze } from './weergave'

const VANDAAG = new Date(2026, 6, 20)

function persoon(over: Partial<Persoon>): Persoon {
  return {
    id: over.id ?? crypto.randomUUID(),
    naam: over.naam ?? 'Test',
    groep: 'pt_klant',
    status: over.status ?? 'moet_benaderen',
    sortering: over.sortering ?? 0,
    followUpDatum: over.followUpDatum ?? null,
    telefoon: over.telefoon ?? null,
    email: over.email ?? null,
    bijzonderheden: over.bijzonderheden ?? null,
    laatsteContactOp: over.laatsteContactOp ?? null,
    aangemaaktOp: over.aangemaaktOp ?? '2026-01-01T00:00:00.000Z',
  }
}

function keuze(over: Partial<WeergaveKeuze>): WeergaveKeuze {
  return { ...LEGE_WEERGAVE, ...over }
}

describe('filterPersonen', () => {
  const mensen = [
    persoon({ naam: 'Kane Bongers', email: 'kane@vitaal.nl' }),
    persoon({ naam: 'Lisa', telefoon: '0612345678', bijzonderheden: 'wil afvallen' }),
    persoon({ naam: 'Nico', followUpDatum: '2026-07-10' }), // te laat
    persoon({ naam: 'Henri', followUpDatum: '2026-08-01' }), // toekomst
  ]

  it('laat alles door bij een lege keuze', () => {
    expect(filterPersonen(mensen, LEGE_WEERGAVE, VANDAAG)).toHaveLength(4)
  })

  it('zoekt in naam, e-mail, telefoon en bijzonderheden (case-insensitief)', () => {
    expect(filterPersonen(mensen, keuze({ zoek: 'kane' }), VANDAAG).map((p) => p.naam)).toEqual(['Kane Bongers'])
    expect(filterPersonen(mensen, keuze({ zoek: 'vitaal.nl' }), VANDAAG)).toHaveLength(1)
    expect(filterPersonen(mensen, keuze({ zoek: '061234' }), VANDAAG)).toHaveLength(1)
    expect(filterPersonen(mensen, keuze({ zoek: 'AFVALLEN' }), VANDAAG)).toHaveLength(1)
  })

  it('"alleen opvolgen" houdt alleen follow-up op/vóór vandaag over', () => {
    const uit = filterPersonen(mensen, keuze({ alleenOpvolgen: true }), VANDAAG)
    expect(uit.map((p) => p.naam)).toEqual(['Nico'])
  })

  it('muteert de invoer niet', () => {
    const kopie = [...mensen]
    filterPersonen(mensen, keuze({ zoek: 'kane' }), VANDAAG)
    expect(mensen).toEqual(kopie)
  })
})

describe('sorteerPersonen', () => {
  it('handmatig sorteert op sortering, oplopend', () => {
    const mensen = [persoon({ naam: 'C', sortering: 2 }), persoon({ naam: 'A', sortering: 0 }), persoon({ naam: 'B', sortering: 1 })]
    expect(sorteerPersonen(mensen, 'handmatig').map((p) => p.naam)).toEqual(['A', 'B', 'C'])
  })

  it('naam sorteert alfabetisch (NL)', () => {
    const mensen = [persoon({ naam: 'Nico' }), persoon({ naam: 'Henri' }), persoon({ naam: 'lisa' })]
    expect(sorteerPersonen(mensen, 'naam').map((p) => p.naam)).toEqual(['Henri', 'lisa', 'Nico'])
  })

  it('follow_up zet de vroegste datum eerst, geen datum achteraan', () => {
    const mensen = [
      persoon({ naam: 'geen', followUpDatum: null }),
      persoon({ naam: 'laat', followUpDatum: '2026-08-01' }),
      persoon({ naam: 'vroeg', followUpDatum: '2026-07-05' }),
    ]
    expect(sorteerPersonen(mensen, 'follow_up').map((p) => p.naam)).toEqual(['vroeg', 'laat', 'geen'])
  })

  it('laatst_contact zet langst-geen-contact (en nooit) eerst', () => {
    const mensen = [
      persoon({ naam: 'recent', laatsteContactOp: '2026-07-19T09:00:00.000Z' }),
      persoon({ naam: 'oud', laatsteContactOp: '2026-05-01T09:00:00.000Z' }),
      persoon({ naam: 'nooit', laatsteContactOp: null }),
    ]
    expect(sorteerPersonen(mensen, 'laatst_contact').map((p) => p.naam)).toEqual(['nooit', 'oud', 'recent'])
  })

  it('muteert de invoer niet', () => {
    const mensen = [persoon({ naam: 'B', sortering: 1 }), persoon({ naam: 'A', sortering: 0 })]
    const kopie = [...mensen]
    sorteerPersonen(mensen, 'naam')
    expect(mensen).toEqual(kopie)
  })
})
