import { describe, expect, it } from 'vitest'
import type { CheckinRij, LidReservering } from './rijen'
import { checkinNotitie, checkinOpLesdag, reserveringStatusTekst } from './reservering'

const NU = new Date('2026-10-14T12:00:00+02:00')

function les(start: string, extra: Partial<LidReservering> = {}): LidReservering {
  const s = new Date(start)
  return {
    id: 'r1', lidId: 'l1', status: 'aanwezig', wachtpositie: null, lesId: 'les1', lesNaam: 'Spinning',
    start: s, eind: new Date(s.getTime() + 3_600_000), lesGeannuleerd: false, vestiging: 'budel', ...extra,
  }
}

function checkin(op: string): CheckinRij {
  return { id: op, lidId: 'l1', op: new Date(op), bron: 'balie', vestiging: 'budel', naam: null }
}

const CHECKINS = [checkin('2026-10-12T18:51:00+02:00'), checkin('2026-10-12T17:48:00+02:00'), checkin('2026-10-10T09:00:00+02:00')]

describe('checkinOpLesdag', () => {
  it('vindt de eerste check-in op de Nederlandse dag van de les', () => {
    expect(checkinOpLesdag(CHECKINS, les('2026-10-12T18:00:00+02:00'))?.op.toISOString()).toBe('2026-10-12T15:48:00.000Z')
    expect(checkinOpLesdag(CHECKINS, les('2026-10-11T18:00:00+02:00'))).toBeNull()
  })

  it('kijkt naar de Nederlandse dag, ook net na middernacht', () => {
    const laat = [checkin('2026-10-12T00:30:00+02:00')]
    expect(checkinOpLesdag(laat, les('2026-10-12T19:00:00+02:00'))).not.toBeNull()
    expect(checkinOpLesdag(laat, les('2026-10-11T19:00:00+02:00'))).toBeNull()
  })
})

describe('checkinNotitie', () => {
  it('toont bij aanwezig of het lid die dag incheckte', () => {
    expect(checkinNotitie(CHECKINS, les('2026-10-12T18:00:00+02:00'), NU)).toBe('ingecheckt om 17:48')
    expect(checkinNotitie(CHECKINS, les('2026-10-11T18:00:00+02:00'), NU)).toBe('geen check-in die dag')
  })

  it('toont bij niet gekomen alleen een check-in als die er wel was', () => {
    expect(checkinNotitie(CHECKINS, les('2026-10-12T18:00:00+02:00', { status: 'no_show' }), NU)).toBe('ingecheckt om 17:48')
    expect(checkinNotitie(CHECKINS, les('2026-10-11T18:00:00+02:00', { status: 'no_show' }), NU)).toBeNull()
  })

  it('zegt niets bij lessen die nog komen, vervallen of geannuleerd zijn', () => {
    expect(checkinNotitie(CHECKINS, les('2026-10-15T18:00:00+02:00', { status: 'geboekt' }), NU)).toBeNull()
    expect(checkinNotitie(CHECKINS, les('2026-10-12T18:00:00+02:00', { lesGeannuleerd: true }), NU)).toBeNull()
    expect(checkinNotitie(CHECKINS, les('2026-10-12T18:00:00+02:00', { status: 'geannuleerd' }), NU)).toBeNull()
  })
})

describe('reserveringStatusTekst', () => {
  it('geeft het juiste label', () => {
    expect(reserveringStatusTekst(les('2026-10-12T18:00:00+02:00'))).toBe('Aanwezig')
    expect(reserveringStatusTekst(les('2026-10-12T18:00:00+02:00', { lesGeannuleerd: true }))).toBe('Les vervalt')
    expect(reserveringStatusTekst(les('2026-10-12T18:00:00+02:00', { status: 'wachtlijst', wachtpositie: 2 }))).toBe('Wachtlijst 2')
    expect(reserveringStatusTekst(les('2026-10-12T18:00:00+02:00', { status: 'no_show' }))).toBe('Niet gekomen')
  })
})
