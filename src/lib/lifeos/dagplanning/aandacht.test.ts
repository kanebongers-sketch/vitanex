import { describe, expect, test } from 'vitest'
import { crmOpvolging, factuurAandacht, bouwAandacht } from './aandacht'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Factuur } from '@/lib/lifeos/finance/finance'

const VANDAAG = '2026-09-14'

function persoon(over: Partial<Persoon> = {}): Persoon {
  return {
    id: crypto.randomUUID(),
    naam: 'Naam',
    groep: 'pt_klant',
    status: 'actieve_klant',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    sessiesPerWeek: null,
    locatie: null,
    vakantieTot: null,
    abonnement: null,
    duo: false,
    aangemaaktOp: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function factuur(over: Partial<Factuur> = {}): Factuur {
  return {
    id: crypto.randomUUID(),
    klant: 'Klant',
    bedrag: 100,
    status: 'open',
    factuurdatum: '2026-09-01',
    vervaldatum: '2026-09-30',
    persoonId: null,
    aangemaaktOp: '2026-09-01T00:00:00Z',
    ...over,
  }
}

describe('crmOpvolging', () => {
  test('geen follow-up-datum = geen regel', () => {
    expect(crmOpvolging([persoon(), persoon()], VANDAAG)).toEqual([])
  })

  test('follow-up in de toekomst telt niet mee', () => {
    expect(crmOpvolging([persoon({ followUpDatum: '2026-09-20' })], VANDAAG)).toEqual([])
  })

  test('vandaag = dringend met label "vandaag"', () => {
    const punten = crmOpvolging([persoon({ naam: 'Sanne', followUpDatum: VANDAAG })], VANDAAG)
    expect(punten).toHaveLength(1)
    expect(punten[0].dringend).toBe(true)
    expect(punten[0].tekst).toBe('Sanne opvolgen (vandaag)')
  })

  test('verstreken datum = "te laat"', () => {
    const punten = crmOpvolging([persoon({ naam: 'Tom', followUpDatum: '2026-09-01' })], VANDAAG)
    expect(punten[0].tekst).toBe('Tom opvolgen (te laat)')
  })

  test('te laat staat vóór vandaag, oudste bovenaan', () => {
    const punten = crmOpvolging(
      [
        persoon({ naam: 'Vandaag', followUpDatum: VANDAAG }),
        persoon({ naam: 'Ouder', followUpDatum: '2026-09-01' }),
        persoon({ naam: 'Nieuwer', followUpDatum: '2026-09-10' }),
      ],
      VANDAAG,
    )
    expect(punten.map((p) => p.tekst)).toEqual([
      'Ouder opvolgen (te laat)',
      'Nieuwer opvolgen (te laat)',
      'Vandaag opvolgen (vandaag)',
    ])
  })

  test('boven het plafond: één samenvattende, niet-dringende restregel', () => {
    const velen = Array.from({ length: 10 }, (_, i) =>
      persoon({ naam: `P${String(i).padStart(2, '0')}`, followUpDatum: '2026-09-10' }),
    )
    const punten = crmOpvolging(velen, VANDAAG)
    expect(punten).toHaveLength(9) // 8 bij naam + 1 samenvatting
    expect(punten[8]).toEqual({ tekst: 'en nog 2 contacten om op te volgen', dringend: false })
  })
})

describe('factuurAandacht', () => {
  test('niets openstaand = null', () => {
    expect(factuurAandacht([factuur({ status: 'betaald' })], VANDAAG)).toBeNull()
  })

  test('open, nog niet vervallen = niet-dringende openstaand-regel', () => {
    const punt = factuurAandacht([factuur({ bedrag: 250, vervaldatum: '2026-09-30' })], VANDAAG)
    expect(punt).not.toBeNull()
    expect(punt?.dringend).toBe(false)
    expect(punt?.tekst).toContain('1 openstaande factuur')
    expect(punt?.tekst).toContain('€')
    expect(punt?.tekst).toContain('250')
  })

  test('over de vervaldatum = dringend en wint van gewoon-open', () => {
    const punt = factuurAandacht(
      [
        factuur({ bedrag: 100, vervaldatum: '2026-09-01' }), // te laat
        factuur({ bedrag: 300, vervaldatum: '2026-09-30' }), // nog niet
      ],
      VANDAAG,
    )
    expect(punt?.dringend).toBe(true)
    expect(punt?.tekst).toContain('1 factuur over de vervaldatum')
  })

  test('status "verlopen" telt als te laat, ook zonder vervaldatum', () => {
    const punt = factuurAandacht([factuur({ status: 'verlopen', vervaldatum: null })], VANDAAG)
    expect(punt?.dringend).toBe(true)
    expect(punt?.tekst).toContain('over de vervaldatum')
  })

  test('sommeert de te-late bedragen', () => {
    const punt = factuurAandacht(
      [
        factuur({ bedrag: 100, vervaldatum: '2026-09-01' }),
        factuur({ bedrag: 150.5, vervaldatum: '2026-09-02' }),
      ],
      VANDAAG,
    )
    expect(punt?.tekst).toContain('2 facturen over de vervaldatum')
    expect(punt?.tekst).toContain('250,50')
  })
})

describe('bouwAandacht', () => {
  test('combineert CRM-regels en de factuurregel, CRM eerst', () => {
    const punten = bouwAandacht(
      [persoon({ naam: 'Sanne', followUpDatum: VANDAAG })],
      [factuur({ vervaldatum: '2026-09-01' })],
      VANDAAG,
    )
    expect(punten[0].tekst).toContain('Sanne')
    expect(punten[punten.length - 1].tekst).toContain('vervaldatum')
  })

  test('alles leeg = geen punten', () => {
    expect(bouwAandacht([], [], VANDAAG)).toEqual([])
  })
})
