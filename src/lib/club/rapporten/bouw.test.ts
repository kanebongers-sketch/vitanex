import { describe, expect, it } from 'vitest'
import { RAPPORTEN } from './definities'
import { bezoekPerLid, instroom, ledenlijst, lidInMaand } from './bouw-leden'
import { bezettingPerLes, eersteLessen, leadsLijst, noShows } from './bouw-lessen'
import { afsprakenPerTrainer, opvolgPerMedewerker, urenPerMedewerker, type DienstRij } from './bouw-team'
import type { AfspraakRij, CheckinRij, LeadRij, LesRij, LidNaam, LidRij, OpvolgRij, ReserveringRij } from './rijen'

const SEPT = { eerste: '2026-09-01', laatste: '2026-09-30' }
const VEST = (s: string) => ({ budel: 'Budel', eersel: 'Eersel' })[s] ?? s

function lid(over: Partial<LidRij>): LidRij {
  return { id: 'l1', vestiging: 'budel', lidnummer: '100', voornaam: 'Anna', achternaam: 'Jansen', email: 'a@x.nl', telefoon: null, abonnement: 'Basis', status: 'actief', lidSinds: '2025-01-01', einddatum: null, ...over }
}

const NAMEN = new Map<string, LidNaam>([
  ['l1', { id: 'l1', vestiging: 'budel', lidnummer: '100', voornaam: 'Anna', achternaam: 'Jansen' }],
  ['l2', { id: 'l2', vestiging: 'eersel', lidnummer: '200', voornaam: 'Bram', achternaam: 'de Vries' }],
])
const MEDEWERKERS = new Map([
  ['m1', 'Sanne'],
  ['m2', 'Tom'],
])

describe('ledenlijst', () => {
  it('neemt alleen leden die in de maand lid waren, op achternaam', () => {
    const rijen = ledenlijst(
      [
        lid({ id: 'a', achternaam: 'Zwart' }),
        lid({ id: 'b', achternaam: 'Appel', einddatum: '2026-09-15', status: 'opgezegd' }),
        lid({ id: 'c', achternaam: 'Later', lidSinds: '2026-10-02' }),
        lid({ id: 'd', achternaam: 'Weg', einddatum: '2026-08-31' }),
      ],
      SEPT,
      VEST,
    )
    expect(rijen.map((r) => r[2])).toEqual(['Appel', 'Zwart'])
    expect(rijen[0]).toEqual(['100', 'Anna', 'Appel', 'a@x.nl', null, 'Budel', 'Basis', 'Opgezegd', '01-01-2025', '15-09-2026'])
    expect(rijen[0]).toHaveLength(RAPPORTEN.ledenlijst.kolommen.length)
  })

  it('lidInMaand telt de grensdagen mee', () => {
    expect(lidInMaand({ lidSinds: '2026-09-30', einddatum: null }, SEPT)).toBe(true)
    expect(lidInMaand({ lidSinds: null, einddatum: '2026-09-01' }, SEPT)).toBe(true)
    expect(lidInMaand({ lidSinds: '2026-10-01', einddatum: null }, SEPT)).toBe(false)
  })
})

describe('instroom', () => {
  it('geeft nieuwe leden en opzeggingen op datum; een lid kan in beide staan', () => {
    const rijen = instroom([lid({ id: 'x', lidSinds: '2026-09-03', einddatum: '2026-09-20', status: 'opgezegd' }), lid({ id: 'y', lidSinds: '2024-01-01' })], SEPT, VEST)
    expect(rijen.map((r) => [r[0], r[1]])).toEqual([
      ['Nieuw lid', '03-09-2026'],
      ['Opzegging', '20-09-2026'],
    ])
    expect(rijen[0]).toHaveLength(RAPPORTEN.instroom.kolommen.length)
  })
})

describe('bezoekPerLid', () => {
  it('telt bezoekdagen in Nederlandse tijd en zet de trouwste bezoeker bovenaan', () => {
    const c = (lidId: string, op: string, vestiging = 'budel'): CheckinRij => ({ lidId, vestiging, op: new Date(op) })
    const rijen = bezoekPerLid(
      [
        c('l1', '2026-09-02T07:00:00Z'),
        c('l1', '2026-09-02T17:00:00Z'),
        c('l2', '2026-09-03T08:00:00Z', 'eersel'),
        c('l2', '2026-09-04T22:30:00Z', 'budel'), // 00:30 op 5 september in Nederland
        c('l2', '2026-09-10T10:00:00Z', 'eersel'),
      ],
      NAMEN,
      VEST,
    )
    expect(rijen[0]).toEqual(['200', 'Bram', 'de Vries', 'Eersel', 3, 3, '03-09-2026', '10-09-2026', 'Budel, Eersel'])
    expect(rijen[1]).toEqual(['100', 'Anna', 'Jansen', 'Budel', 1, 2, '02-09-2026', '02-09-2026', 'Budel'])
    expect(rijen[0]).toHaveLength(RAPPORTEN.bezoek.kolommen.length)
  })

  it('toont een onbekend lid zonder te crashen', () => {
    const rijen = bezoekPerLid([{ lidId: 'weg', vestiging: 'budel', op: new Date('2026-09-02T07:00:00Z') }], NAMEN, VEST)
    expect(rijen[0][2]).toBe('(onbekend lid)')
  })
})

const LES: LesRij = { id: 'les1', vestiging: 'budel', lestype: 'Spinning', start: new Date('2026-09-07T17:30:00Z'), capaciteit: 12, geannuleerd: false, instructeurId: 'm1' }
const res = (status: ReserveringRij['status'], lidId = 'l1', teLaat = false): ReserveringRij => ({ lesId: 'les1', lidId, status, teLaat })

describe('bezettingPerLes', () => {
  it('telt bezet, aanwezig, no-show, wachtlijst en bezetting', () => {
    const rijen = bezettingPerLes([LES], [res('aanwezig'), res('aanwezig'), res('no_show'), res('geboekt'), res('wachtlijst'), res('geannuleerd')], MEDEWERKERS, VEST)
    expect(rijen).toEqual([['07-09-2026', '19:30', 'Spinning', 'Sanne', 'Budel', 12, 4, 2, 1, 1, 33, 'Gepland']])
    expect(rijen[0]).toHaveLength(RAPPORTEN.bezetting.kolommen.length)
  })
})

describe('eersteLessen', () => {
  it('geeft voor het voorbeeld dezelfde eerste rijen als het hele rapport', () => {
    // Arrange: 30 lessen in willekeurige volgorde, sommige op hetzelfde tijdstip, met reserveringen.
    const lessen: LesRij[] = Array.from({ length: 30 }, (_, i) => ({
      ...LES,
      id: `les${i}`,
      lestype: i % 2 ? 'Yoga' : 'Spinning',
      start: new Date(Date.UTC(2026, 8, 1 + ((i * 7) % 28), 17 + (i % 3))),
    }))
    const reserveringen = lessen.flatMap((l, i) => Array.from({ length: i % 5 }, () => ({ lesId: l.id, lidId: 'l1', status: 'aanwezig' as const, teLaat: false })))
    // Act
    const voorbeeld = eersteLessen(lessen, 20)
    const ids = new Set(voorbeeld.map((l) => l.id))
    const deel = bezettingPerLes(voorbeeld, reserveringen.filter((r) => ids.has(r.lesId)), MEDEWERKERS, VEST)
    const geheel = bezettingPerLes(lessen, reserveringen, MEDEWERKERS, VEST)
    // Assert
    expect(voorbeeld).toHaveLength(20)
    expect(deel).toEqual(geheel.slice(0, 20))
  })
})

describe('noShows', () => {
  it('neemt no-shows, te late afmeldingen en gemiste afspraken op tijd', () => {
    const afspraak: AfspraakRij = { vestiging: 'eersel', medewerkerId: 'm2', lidId: 'l2', start: new Date('2026-09-01T08:00:00Z'), eind: new Date('2026-09-01T09:00:00Z'), status: 'niet_gekomen', type: 'Intake' }
    const rijen = noShows([LES], [res('no_show'), res('geannuleerd', 'l2', true), res('geannuleerd', 'l2', false)], [afspraak], NAMEN, VEST)
    expect(rijen.map((r) => r[2])).toEqual(['Afspraak: niet gekomen', 'Les: no-show', 'Les: te laat afgemeld'])
    expect(rijen[0]).toEqual(['01-09-2026', '10:00', 'Afspraak: niet gekomen', 'Intake', '200', 'Bram', 'de Vries', 'Eersel'])
    expect(rijen[0]).toHaveLength(RAPPORTEN.noshows.kolommen.length)
  })
})

describe('leadsLijst', () => {
  it('geeft labels voor bron en status', () => {
    const lead: LeadRij = { aangemaakt: new Date('2026-09-05T10:00:00Z'), naam: 'Chris', email: null, telefoon: '0612345678', vestiging: 'budel', bron: 'social', interesse: 'Afvallen', status: 'proefles', proeflesOp: new Date('2026-09-08T16:00:00Z'), verlorenReden: null, medewerkerId: 'm2' }
    const rijen = leadsLijst([lead], MEDEWERKERS, VEST)
    expect(rijen[0]).toEqual(['05-09-2026', 'Chris', null, '0612345678', 'Budel', 'Social media', 'Afvallen', 'Proefles gepland', '08-09-2026 18:00', null, 'Tom'])
    expect(rijen[0]).toHaveLength(RAPPORTEN.leads.kolommen.length)
  })
})

describe('afsprakenPerTrainer', () => {
  it('telt per trainer en vestiging; geannuleerd telt niet mee in de uren', () => {
    const a = (status: AfspraakRij['status'], medewerkerId = 'm1', min = 60): AfspraakRij => ({ vestiging: 'budel', medewerkerId, lidId: 'l1', start: new Date('2026-09-02T08:00:00Z'), eind: new Date(Date.parse('2026-09-02T08:00:00Z') + min * 60_000), status, type: 'PT' })
    const rijen = afsprakenPerTrainer([a('geweest'), a('geweest', 'm1', 30), a('geannuleerd'), a('niet_gekomen', 'm2'), a('gepland', 'onbekend')], MEDEWERKERS, VEST)
    expect(rijen).toEqual([
      ['(onbekende medewerker)', 'Budel', 1, 0, 0, 0, 1, 1],
      ['Sanne', 'Budel', 3, 2, 0, 1, 0, 1.5],
      ['Tom', 'Budel', 1, 0, 1, 0, 0, 1],
    ])
    expect(rijen[0]).toHaveLength(RAPPORTEN.afspraken.kolommen.length)
  })
})

describe('urenPerMedewerker', () => {
  const d = (over: Partial<DienstRij>): DienstRij => ({
    id: 'd',
    vestiging: 'budel',
    datum: '2026-09-02',
    begin: '08:00',
    eind: '12:00',
    medewerkerId: 'm1',
    soortId: null,
    notitie: null,
    status: 'gepland',
    vervangtId: null,
    uursoort: 'werk',
    uurStatus: 'gepland',
    gewerktBegin: null,
    gewerktEind: null,
    pauzeMin: 0,
    urenOpmerking: null,
    ...over,
  })

  it('splitst gepland, gewerkt, goedgekeurd, verwerkt, ziek en verlof', () => {
    const rijen = urenPerMedewerker(
      [
        d({ uurStatus: 'gepland' }),
        d({ uurStatus: 'gewerkt', gewerktEind: '12:30' }),
        d({ uurStatus: 'goedgekeurd', pauzeMin: 30 }),
        d({ uurStatus: 'verwerkt' }),
        d({ uursoort: 'ziek' }),
        d({ uursoort: 'verlof', begin: '09:00', eind: '17:00' }),
        d({ medewerkerId: null, uurStatus: 'gewerkt' }),
      ],
      MEDEWERKERS,
      VEST,
    )
    // Gewerkt: 4,5 + 3,5 + 4 = 12; goedgekeurd 3,5 + 4; verwerkt 4; nog goed te keuren 4,5.
    expect(rijen).toEqual([['Sanne', 'Budel', 4, 16, 12, 7.5, 4, 4.5, 4, 8]])
    expect(rijen[0]).toHaveLength(RAPPORTEN.uren.kolommen.length)
  })
})

describe('opvolgPerMedewerker', () => {
  it('telt afgehandelde taken per persoon en regel, meeste eerst', () => {
    const t = (door: string | null, regel: OpvolgRij['regel'], status: OpvolgRij['status'] = 'gedaan'): OpvolgRij => ({ vestiging: 'budel', regel, status, door, op: new Date('2026-09-02T08:00:00Z') })
    const rijen = opvolgPerMedewerker([t('Tom', 'welkom'), t('Sanne', 'niet_gezien'), t('Sanne', 'niet_gezien', 'overgeslagen'), t(null, 'mijlpaal')], VEST)
    expect(rijen[0]).toEqual(['Sanne', 'Budel', 2, 1, 1, 0, 0, 2, 0, 0, 0, 0])
    expect(rijen.map((r) => r[0])).toEqual(['Sanne', '(onbekend)', 'Tom'])
    expect(rijen[0]).toHaveLength(RAPPORTEN.opvolging.kolommen.length)
  })
})
