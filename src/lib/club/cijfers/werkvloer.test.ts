import { describe, expect, it } from 'vitest'
import type { Dienst, PersoneelLid } from '@/lib/club/personeel/typen'
import type { Taak } from '@/lib/club/taken/typen'
import type { VandaagTaak } from '@/lib/club/taken/voortgang'
import { dienstenVandaag, dienstFase, takenStand } from './werkvloer'

const VANDAAG = '2026-10-14'

function dienst(id: string, begin: string, eind: string, deel: Partial<Dienst> = {}): Dienst {
  return {
    id, datum: VANDAAG, begin, eind, medewerkerId: 'm1', soortId: null, notitie: null, status: 'gepland', vervangtId: null,
    uursoort: 'werk', uurStatus: 'gepland', gewerktBegin: null, gewerktEind: null, pauzeMin: 0, urenOpmerking: null,
    ...deel,
  }
}

const TEAM: PersoneelLid[] = [
  { id: 'm1', naam: 'Marloes', rollen: ['trainer'], contracturen: 28, kleur: 'roze' },
  { id: 'm2', naam: 'Dennis', rollen: ['trainer'], contracturen: 24, kleur: 'blauw' },
]

describe('wie werkt er vandaag', () => {
  it('weet of een dienst bezig is, nog komt of geweest is', () => {
    expect(dienstFase({ begin: '09:00', eind: '13:00' }, '08:59')).toBe('straks')
    expect(dienstFase({ begin: '09:00', eind: '13:00' }, '09:00')).toBe('nu')
    expect(dienstFase({ begin: '09:00', eind: '13:00' }, '13:00')).toBe('geweest')
    expect(dienstFase({ begin: '17:00', eind: '00:00' }, '23:30')).toBe('nu')
  })

  it('zet wie nu staat bovenaan en laat ziek, verlof en andere dagen weg', () => {
    const r = dienstenVandaag(
      [
        dienst('ochtend', '07:00', '12:00'),
        dienst('avond', '17:00', '22:00', { medewerkerId: 'm2' }),
        dienst('nu', '12:00', '18:00', { medewerkerId: 'm2' }),
        dienst('open', '18:00', '22:00', { medewerkerId: null }),
        dienst('ziek', '12:00', '18:00', { status: 'ziek' }),
        dienst('verlof', '12:00', '18:00', { uursoort: 'verlof' }),
        dienst('morgen', '12:00', '18:00', { datum: '2026-10-15' }),
      ],
      TEAM,
      VANDAAG,
      '13:15',
    )
    expect(r.map((d) => [d.id, d.fase, d.naam])).toEqual([
      ['nu', 'nu', 'Dennis'],
      ['avond', 'straks', 'Dennis'],
      ['open', 'straks', null],
      ['ochtend', 'geweest', 'Marloes'],
    ])
    expect(r[0].kleur).toBe('blauw')
  })
})

function taak(id: string, moment: Taak['moment'], naam = id): Taak {
  return { id, lijstId: 'l', naam, groep: null, frequentie: 'dagelijks', perWeekMin: null, moment, volgorde: 0, actief: true }
}

function item(t: Taak, gedaan: boolean, soort: VandaagTaak['soort'] = 'verplicht'): VandaagTaak {
  const afgevinkt = gedaan ? { id: `v-${t.id}`, taakId: t.id, datum: VANDAAG, afgevinktOp: `${VANDAAG}T09:00:00Z`, medewerkerId: null, wie: 'Lynn', notitie: null } : null
  return { taak: t, afgevinkt, soort, teller: null }
}

describe('stand van de taken', () => {
  it('telt verplichte taken en de afsluitronde apart', () => {
    const items = [
      item(taak('a', 'ochtend'), true),
      item(taak('b', 'middag', 'Kleedkamers'), false),
      item(taak('c', 'afsluiten', 'Lichten uit'), false),
      item(taak('d', 'afsluiten'), true),
      item(taak('e', 'vrij'), false, 'optioneel'),
    ]
    const s = takenStand(items, [{ datum: '2026-10-13', wie: 'Lynn', op: '2026-10-13T22:00:00Z', openTaken: 0 }], VANDAAG)
    expect(s).toMatchObject({ verplicht: 4, gedaan: 2, afsluiten: 2, afsluitenGedaan: 1, open: ['Kleedkamers', 'Lichten uit'], afsluitronde: null })
  })

  it('pakt de laatst gemelde afsluitronde van vandaag', () => {
    const s = takenStand([], [
      { datum: VANDAAG, wie: 'Lynn', op: `${VANDAAG}T21:00:00Z`, openTaken: 2 },
      { datum: VANDAAG, wie: 'Dennis', op: `${VANDAAG}T22:00:00Z`, openTaken: 0 },
    ], VANDAAG)
    expect(s.afsluitronde?.wie).toBe('Dennis')
  })
})
