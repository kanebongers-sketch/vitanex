import { describe, expect, it } from 'vitest'
import { kopieerDiensten, sjabloonToepassen, sjabloonUitWeek, wekenVanaf, zonderDubbele } from './planning'
import { controleerWeek, kandidaten } from './controle'
import { openingstijdenUitJson } from '@/lib/club/rooster/openingstijden'
import type { Dienst, PersoneelLid } from './typen'

function dienst(over: Partial<Dienst>): Dienst {
  return {
    id: 'd',
    datum: '2026-10-12',
    begin: '08:00',
    eind: '14:00',
    medewerkerId: 'a',
    soortId: 's',
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
  }
}

const leden: PersoneelLid[] = [
  { id: 'a', naam: 'Lynn', rollen: ['balie'], contracturen: 24, kleur: 'groen' },
  { id: 'b', naam: 'Dennis', rollen: ['trainer'], contracturen: 24, kleur: 'blauw' },
  { id: 'c', naam: 'Yara', rollen: ['trainer'], contracturen: 8, kleur: 'turkoois' },
]

describe('kopieren en patronen', () => {
  const week = [
    dienst({ id: '1' }),
    dienst({ id: '2', datum: '2026-10-14', uursoort: 'ziek', status: 'ziek' }),
    dienst({ id: '3', datum: '2026-10-14', medewerkerId: 'b', vervangtId: '2' }),
  ]

  it('kopieert een week een week verder, ziek wordt weer gewoon en vervanging gaat niet mee', () => {
    expect(kopieerDiensten(week, 7)).toEqual([
      { datum: '2026-10-19', begin: '08:00', eind: '14:00', medewerkerId: 'a', soortId: 's', notitie: null },
      { datum: '2026-10-21', begin: '08:00', eind: '14:00', medewerkerId: 'a', soortId: 's', notitie: null },
    ])
  })

  it('maakt een sjabloon en zet het vooruit', () => {
    const s = sjabloonUitWeek(week)
    expect(s.map((x) => x.weekdag)).toEqual([1, 3])
    const nieuw = sjabloonToepassen(s, wekenVanaf('2026-10-26', 2))
    expect(nieuw.map((n) => n.datum)).toEqual(['2026-10-26', '2026-10-28', '2026-11-02', '2026-11-04'])
  })

  it('laat dubbele diensten weg', () => {
    const nieuw = kopieerDiensten([dienst({ id: '1' })], 7)
    expect(zonderDubbele(nieuw, [{ datum: '2026-10-19', begin: '08:00', eind: '14:00', medewerkerId: 'a' }])).toEqual([])
  })
})

describe('controleerWeek', () => {
  it('meldt gat, open dienst, rust en beschikbaarheid', () => {
    const bemand = openingstijdenUitJson({ '1': ['08:00', '21:30'], '2': ['08:00', '21:30'] })
    const meldingen = controleerWeek({
      dagen: ['2026-10-12', '2026-10-13'],
      diensten: [
        dienst({ id: '1', begin: '08:00', eind: '13:30' }),
        dienst({ id: '2', medewerkerId: 'b', begin: '14:00', eind: '21:30' }),
        dienst({ id: '3', datum: '2026-10-13', medewerkerId: 'b', begin: '08:00', eind: '14:00' }),
        dienst({ id: '4', datum: '2026-10-13', medewerkerId: null, begin: '14:00', eind: '21:30' }),
      ],
      randDiensten: [],
      beschikbaarheid: [{ id: 'r', medewerkerId: 'b', weekdag: 2, datum: null, datumTot: null, beschikbaar: false, van: null, tot: null, reden: null, notitie: null }],
      bemand,
      leden,
      minRustUren: 11,
    })
    expect(meldingen.map((m) => m.soort).sort()).toEqual(['beschikbaar', 'gat', 'gat', 'open', 'rust'])
  })
})

describe('kandidaten', () => {
  it('zet wie vrij is bovenaan en wie al staat of niet kan onderaan', () => {
    const alle = [dienst({ id: '1', medewerkerId: 'a', begin: '08:00', eind: '14:00' })]
    const nieuw = dienst({ id: 'nieuw', medewerkerId: null, begin: '12:00', eind: '17:00' })
    const besch = [{ id: 'r', medewerkerId: 'c', weekdag: null, datum: '2026-10-12', datumTot: null, beschikbaar: true, van: '12:00', tot: '18:00', reden: null, notitie: null }]
    const uit = kandidaten(nieuw, leden, alle, besch, 11)
    expect(uit.map((k) => k.lid.id)).toEqual(['c', 'b', 'a'])
    expect(uit[2].waarschuwing).toBe('Al ingepland')
  })
})
