import { describe, expect, test } from 'vitest'
import { crmOpvolging, factuurAandacht, inboxAandacht, afhaakAandacht, statusHintAandacht, onbekendAandacht, bouwAandacht } from './aandacht'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Factuur } from '@/lib/lifeos/finance/finance'
import type { Afhaak } from '@/lib/lifeos/pt-klant/afhaak'
import type { PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'

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

describe('inboxAandacht', () => {
  test('null (niet nagegaan) = geen regel', () => {
    expect(inboxAandacht(null)).toBeNull()
  })

  test('0 actie-mails = geen regel', () => {
    expect(inboxAandacht(0)).toBeNull()
  })

  test('1 mail: enkelvoud, dringend', () => {
    expect(inboxAandacht(1)).toEqual({ tekst: '1 mail vraagt een reactie', dringend: true })
  })

  test('meerdere: meervoud', () => {
    expect(inboxAandacht(4)?.tekst).toBe('4 mails vragen een reactie')
  })
})

function afhaak(over: Partial<Afhaak> = {}): Afhaak {
  return { id: 'k', naam: 'Kevin', wekenGeleden: 3, ...over }
}

describe('afhaakAandacht', () => {
  test('een regel per afgehaakte klant, niet dringend', () => {
    const punten = afhaakAandacht([afhaak({ naam: 'Kevin', wekenGeleden: 3 })])
    expect(punten).toEqual([{ tekst: 'Kevin was 3 weken niet op PT — even contact?', dringend: false }])
  })

  test('enkelvoud "week" bij 1', () => {
    expect(afhaakAandacht([afhaak({ wekenGeleden: 1 })])[0].tekst).toContain('1 week niet')
  })

  test('boven de limiet één samenvattende regel', () => {
    const zes = Array.from({ length: 6 }, (_, i) => afhaak({ id: `k${i}`, naam: `Klant ${i}` }))
    const punten = afhaakAandacht(zes)
    expect(punten).toHaveLength(6) // 5 namen + 1 samenvatting
    expect(punten[5].tekst).toBe('en nog 1 klant die je een tijd niet zag')
  })

  test('leeg = geen regels', () => {
    expect(afhaakAandacht([])).toEqual([])
  })
})

describe('bouwAandacht', () => {
  test('volgorde: CRM, dan afhaak, dan inbox, dan finance', () => {
    const punten = bouwAandacht(
      [persoon({ naam: 'Sanne', followUpDatum: VANDAAG })],
      [factuur({ vervaldatum: '2026-09-01' })],
      VANDAAG,
      3,
      { afhaak: [afhaak({ naam: 'Kevin', wekenGeleden: 3 })] },
    )
    expect(punten[0].tekst).toContain('Sanne')
    expect(punten[1].tekst).toContain('Kevin')
    expect(punten[2].tekst).toContain('mails vragen een reactie')
    expect(punten[3].tekst).toContain('vervaldatum')
  })

  test('inbox weggelaten als niet nagegaan', () => {
    const punten = bouwAandacht([persoon({ naam: 'Sanne', followUpDatum: VANDAAG })], [], VANDAAG, null)
    expect(punten.some((p) => p.tekst.includes('reactie'))).toBe(false)
  })

  test('alles leeg = geen punten', () => {
    expect(bouwAandacht([], [], VANDAAG)).toEqual([])
  })
})

function hint(over: Partial<PtStatusHint> = {}): PtStatusHint {
  return { id: 'j', naam: 'Joris Bax', status: 'moet_benaderen', statusLabel: 'Moet benaderen', sessies: 5, ...over }
}

describe('statusHintAandacht', () => {
  test('een voorstel per klant, niet dringend, met sessies en statusnaam', () => {
    expect(statusHintAandacht([hint()])).toEqual([
      { tekst: 'Joris Bax traint al (5× in 8 weken) maar staat op "Moet benaderen" — zet op Actieve klant?', dringend: false },
    ])
  })

  test('boven de limiet één samenvattende regel', () => {
    const vier = Array.from({ length: 4 }, (_, i) => hint({ id: `h${i}`, naam: `K${i}` }))
    const punten = statusHintAandacht(vier)
    expect(punten).toHaveLength(4)
    expect(punten[3].tekst).toBe('en nog 1 klant met een verouderde status')
  })

  test('staat achteraan in bouwAandacht (administratie na mensen en geld)', () => {
    const punten = bouwAandacht(
      [persoon({ naam: 'Sanne', followUpDatum: VANDAAG })],
      [factuur({ vervaldatum: '2026-09-01' })],
      VANDAAG,
      2,
      { statusHints: [hint()] },
    )
    expect(punten[punten.length - 1].tekst).toContain('Joris Bax traint al')
    expect(punten[0].tekst).toContain('Sanne')
  })
})

describe('onbekendAandacht', () => {
  test('noemt de titel, aantal en laatste dag, niet dringend', () => {
    const punten = onbekendAandacht([{ titel: 'Darren PT', aantal: 2, laatsteOp: '2026-09-25T08:00:00.000Z' }])
    expect(punten).toEqual([{ tekst: '"Darren PT" (2×, laatst 25 sep) — staat nog niet in je CRM', dringend: false }])
  })

  test('één keer → geen "1×"', () => {
    const [p] = onbekendAandacht([{ titel: 'Darren PT', aantal: 1, laatsteOp: '2026-09-25T08:00:00.000Z' }])
    expect(p.tekst).toBe('"Darren PT" (laatst 25 sep) — staat nog niet in je CRM')
  })
})
