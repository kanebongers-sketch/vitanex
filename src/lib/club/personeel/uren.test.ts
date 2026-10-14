import { describe, expect, it } from 'vitest'
import { afwijkingen, avondMin, csvVeld, goedTeKeuren, gewerktMin, periodeVan, urenCsv, urenKlok, urenOverzicht, verschuifPeriode } from './uren'
import type { Dienst, PersoneelLid } from './typen'

function dienst(over: Partial<Dienst>): Dienst {
  return {
    id: 'd',
    datum: '2026-10-12',
    begin: '14:00',
    eind: '21:30',
    medewerkerId: 'a',
    soortId: null,
    notitie: null,
    status: 'gepland',
    vervangtId: null,
    uursoort: 'werk',
    uurStatus: 'gewerkt',
    gewerktBegin: null,
    gewerktEind: null,
    pauzeMin: 0,
    urenOpmerking: null,
    ...over,
  }
}

const lid: PersoneelLid = { id: 'a', naam: 'Lynn Maas', rollen: ['balie'], contracturen: 24, kleur: 'groen' }

describe('periodes', () => {
  it('week en vier weken beginnen op maandag', () => {
    expect(periodeVan('week', '2026-10-14')).toEqual({ soort: 'week', van: '2026-10-12', tot: '2026-10-19', dagen: 7 })
    expect(periodeVan('4weken', '2026-10-14')).toMatchObject({ van: '2026-10-12', tot: '2026-11-09', dagen: 28 })
  })

  it('maand is de kalendermaand, ook in december', () => {
    expect(periodeVan('maand', '2026-10-14')).toEqual({ soort: 'maand', van: '2026-10-01', tot: '2026-11-01', dagen: 31 })
    expect(periodeVan('maand', '2026-12-05')).toMatchObject({ van: '2026-12-01', tot: '2027-01-01' })
  })

  it('bladeren', () => {
    expect(verschuifPeriode(periodeVan('maand', '2026-10-14'), -1).van).toBe('2026-09-01')
    expect(verschuifPeriode(periodeVan('maand', '2026-10-14'), 1).van).toBe('2026-11-01')
    expect(verschuifPeriode(periodeVan('week', '2026-10-14'), 1).van).toBe('2026-10-19')
  })
})

describe('gewerkte uren', () => {
  it('gebruikt de aangepaste tijden en trekt de pauze af', () => {
    expect(gewerktMin(dienst({ gewerktEind: '22:15', pauzeMin: 30 }))).toBe(465)
  })

  it('een geplande of zieke dienst telt niet als gewerkt', () => {
    expect(gewerktMin(dienst({ uurStatus: 'gepland' }))).toBe(0)
    expect(gewerktMin(dienst({ uursoort: 'ziek' }))).toBe(0)
  })

  it('avond is alles na 18:00', () => {
    expect(avondMin('14:00', '21:30')).toBe(210)
    expect(avondMin('08:00', '14:00')).toBe(0)
    expect(avondMin('19:00', '21:00')).toBe(120)
  })
})

describe('urenOverzicht', () => {
  it('telt gepland, gewerkt, ziek, verlof, avond, weekend en contract', () => {
    const p = periodeVan('week', '2026-10-12')
    const diensten = [
      dienst({ id: '1', pauzeMin: 30 }),
      dienst({ id: '2', datum: '2026-10-17', begin: '08:00', eind: '13:00' }),
      dienst({ id: '3', datum: '2026-10-14', begin: '08:00', eind: '14:00', uursoort: 'ziek' }),
      dienst({ id: '4', datum: '2026-10-15', begin: '08:00', eind: '14:00', uursoort: 'verlof' }),
      dienst({ id: '5', datum: '2026-10-16', begin: '08:00', eind: '14:00', uurStatus: 'gepland' }),
      dienst({ id: '6', datum: '2026-10-19', begin: '08:00', eind: '14:00' }),
    ]
    const [r] = urenOverzicht([lid], diensten, p)
    expect(r).toEqual({
      medewerkerId: 'a',
      geplandMin: 450 + 300 + 360,
      gewerktMin: 420 + 300,
      contractMin: 1440,
      verschilMin: 720 - 1440,
      ziekMin: 360,
      verlofMin: 360,
      avondMin: 210,
      weekendMin: 300,
      onbevestigd: 1,
      diensten: 3,
    })
  })

  it('contract over een maand naar rato van de dagen', () => {
    const [r] = urenOverzicht([lid], [], periodeVan('maand', '2026-10-01'))
    expect(r.contractMin).toBe(Math.round((24 * 60 * 31) / 7))
    expect(urenOverzicht([{ ...lid, contracturen: null }], [], periodeVan('week', '2026-10-12'))[0].verschilMin).toBeNull()
  })
})

describe('afwijkingen', () => {
  it('vindt andere tijden, onbevestigde diensten in het verleden en overlap', () => {
    const lijst = [
      dienst({ id: '1', gewerktEind: '22:15' }),
      dienst({ id: '2', datum: '2026-10-13', uurStatus: 'gepland' }),
      dienst({ id: '3', datum: '2026-10-20', uurStatus: 'gepland' }),
      dienst({ id: '4', datum: '2026-10-14', begin: '08:00', eind: '14:00' }),
      dienst({ id: '5', datum: '2026-10-14', begin: '13:00', eind: '17:00' }),
    ]
    const uit = afwijkingen(lijst, '2026-10-14', 600)
    expect(uit.map((a) => `${a.dienstId}:${a.soort}`)).toEqual(['1:afwijkend', '2:onbevestigd', '4:overlap'])
  })

  it('vandaag telt pas als onbevestigd na het einde', () => {
    const d = dienst({ id: '1', datum: '2026-10-14', begin: '08:00', eind: '14:00', uurStatus: 'gepland' })
    expect(afwijkingen([d], '2026-10-14', 13 * 60)).toEqual([])
    expect(afwijkingen([d], '2026-10-14', 14 * 60)).toHaveLength(1)
  })

  it('goedkeuren in een keer slaat afwijkingen over', () => {
    const lijst = [dienst({ id: '1', gewerktEind: '22:15' }), dienst({ id: '2', datum: '2026-10-13' }), dienst({ id: '3', datum: '2026-10-15', uurStatus: 'goedgekeurd' })]
    expect(goedTeKeuren(lijst, afwijkingen(lijst, '2026-10-20', 0))).toEqual(['2'])
  })
})

describe('export', () => {
  it('maakt een CSV met puntkomma en decimale komma', () => {
    const p = periodeVan('week', '2026-10-12')
    const csv = urenCsv(urenOverzicht([lid], [dienst({ id: '1', pauzeMin: 30 })], p), [lid], p)
    const regels = csv.trim().split('\r\n')
    expect(regels[0].startsWith('Medewerker;Van;Tot en met;Gepland;Gewerkt')).toBe(true)
    expect(regels[1]).toBe('Lynn Maas;2026-10-12;2026-10-18;7,50;7,00;24,00;-17,00;0,00;0,00;3,50;0,00;0')
  })

  it('beschermt tegen formules en scheidingstekens', () => {
    expect(csvVeld('=SOM(A1)')).toBe("'=SOM(A1)")
    expect(csvVeld('Jansen; Piet')).toBe('"Jansen; Piet"')
    expect(urenKlok(-90)).toBe('-1:30')
  })
})
