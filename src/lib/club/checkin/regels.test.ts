import { describe, expect, it } from 'vitest'
import type { CheckinRij, LidReservering } from '@/lib/club/leden/rijen'
import { isCheckinAntwoord, isZoekAntwoord } from './types'
import { beoordeelCheckin, bronVoorMatch, isCode, isDubbel, leesCheckinInvoer, leesVenster, lesInVenster, lesVandaag, magInVestiging, vatDagSamen } from './regels'

const NU = new Date('2026-10-14T18:50:00+02:00')
const MIN = 60_000

function res(id: string, startOver: number, extra: Partial<LidReservering> = {}): LidReservering {
  const start = new Date(NU.getTime() + startOver * MIN)
  return {
    id, lidId: 'l1', status: 'geboekt', wachtpositie: null, lesId: `les-${id}`, lesNaam: 'Spinning',
    start, eind: new Date(start.getTime() + 45 * MIN), lesGeannuleerd: false, vestiging: 'budel', ...extra,
  }
}

function ci(id: string, lidId: string, minutenGeleden: number): CheckinRij {
  return { id, lidId, op: new Date(NU.getTime() - minutenGeleden * MIN), bron: 'bandje', vestiging: 'budel', naam: lidId }
}

describe('leesVenster', () => {
  it('leest het venster uit de regels of valt terug op 15', () => {
    expect(leesVenster({ checkin_venster_min: 20 })).toBe(20)
    expect(leesVenster({})).toBe(15)
    expect(leesVenster(null)).toBe(15)
    expect(leesVenster({ checkin_venster_min: '20' })).toBe(15)
    expect(leesVenster({ checkin_venster_min: 999 })).toBe(120)
  })
})

describe('isDubbel en beoordeelCheckin', () => {
  it('ziet een check-in binnen 30 minuten als dubbel', () => {
    expect(isDubbel(new Date(NU.getTime() - 29 * MIN), NU)).toBe(true)
    expect(isDubbel(new Date(NU.getTime() - 30 * MIN), NU)).toBe(false)
    expect(isDubbel(null, NU)).toBe(false)
  })

  it('laat alleen leden die mogen trainen inchecken', () => {
    expect(beoordeelCheckin('actief', null, NU)).toEqual({ soort: 'mag' })
    expect(beoordeelCheckin('opgezegd', null, NU)).toEqual({ soort: 'mag' })
    expect(beoordeelCheckin('gepauzeerd', null, NU)).toEqual({ soort: 'niet_actief', status: 'gepauzeerd' })
    expect(beoordeelCheckin('gestopt', null, NU).soort).toBe('niet_actief')
    const laatste = new Date(NU.getTime() - 5 * MIN)
    expect(beoordeelCheckin('actief', laatste, NU)).toEqual({ soort: 'dubbel', op: laatste })
  })
})

describe('lesInVenster', () => {
  it('pakt een geboekte les die binnen het venster begint', () => {
    expect(lesInVenster([res('a', 10)], NU, 15)?.id).toBe('a')
    expect(lesInVenster([res('a', 20)], NU, 15)).toBeNull()
  })

  it('telt tot 10 minuten te laat nog mee', () => {
    expect(lesInVenster([res('a', -9)], NU, 15)?.id).toBe('a')
    expect(lesInVenster([res('a', -11)], NU, 15)).toBeNull()
  })

  it('negeert wachtlijst, geannuleerde lessen en kiest de vroegste', () => {
    expect(lesInVenster([res('a', 5, { status: 'wachtlijst' })], NU, 15)).toBeNull()
    expect(lesInVenster([res('a', 5, { lesGeannuleerd: true })], NU, 15)).toBeNull()
    expect(lesInVenster([res('b', 12), res('a', 2)], NU, 15)?.id).toBe('a')
  })
})

describe('lesVandaag', () => {
  it('toont de eerstvolgende les die nog niet voorbij is', () => {
    expect(lesVandaag([res('ochtend', -600), res('avond', 40)], NU)?.id).toBe('avond')
  })

  it('valt terug op de laatste les als alles voorbij is en slaat geannuleerd over', () => {
    expect(lesVandaag([res('ochtend', -600), res('middag', -300)], NU)?.id).toBe('middag')
    expect(lesVandaag([res('x', 40, { status: 'geannuleerd' })], NU)).toBeNull()
  })
})

describe('bron en code', () => {
  it('kiest de bron naar het gevonden veld', () => {
    expect(bronVoorMatch('qr_token')).toBe('qr')
    expect(bronVoorMatch('sportivity_id')).toBe('bandje')
    expect(bronVoorMatch('lidnummer')).toBe('balie')
    expect(bronVoorMatch('naam')).toBe('balie')
  })

  it('herkent een gescande code', () => {
    expect(isCode('BU01023')).toBe(true)
    expect(isCode('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(true)
    expect(isCode('Sanne de Vries')).toBe(false)
    expect(isCode("x,or(id.eq.1)")).toBe(false)
  })
})

describe('vatDagSamen', () => {
  it('telt vandaag, schat wie binnen is en geeft de laatste tien', () => {
    const lijst = [ci('1', 'a', 10), ci('2', 'b', 60), ci('3', 'a', 80), ci('4', 'c', 120), ...Array.from({ length: 9 }, (_, i) => ci(`x${i}`, `x${i}`, 200 + i))]
    const s = vatDagSamen(lijst, NU)
    expect(s.vandaag).toBe(13)
    expect(s.binnen.map((c) => c.lidId)).toEqual(['a', 'b'])
    expect(s.laatste).toHaveLength(10)
    expect(s.laatste[0].id).toBe('1')
  })
})

describe('leesCheckinInvoer', () => {
  it('leest een geldig verzoek en valt terug op balie', () => {
    const id = '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c'
    expect(leesCheckinInvoer({ lidId: id, vestiging: 'budel', bron: 'qr' })).toEqual({ lidId: id, vestiging: 'budel', bron: 'qr', toch: false })
    expect(leesCheckinInvoer({ lidId: id, vestiging: 'budel', bron: 'les' })?.bron).toBe('balie')
  })

  it('leest toch inchecken alleen als echte true', () => {
    const id = '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c'
    expect(leesCheckinInvoer({ lidId: id, vestiging: 'budel', toch: true })?.toch).toBe(true)
    expect(leesCheckinInvoer({ lidId: id, vestiging: 'budel', toch: 'ja' })?.toch).toBe(false)
  })

  it('weigert onzin', () => {
    expect(leesCheckinInvoer({ lidId: '1', vestiging: 'budel' })).toBeNull()
    expect(leesCheckinInvoer(null)).toBeNull()
    expect(leesCheckinInvoer({ lidId: '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c' })).toBeNull()
  })
})

describe('antwoorden van de API', () => {
  it('herkent geldige en ongeldige antwoorden', () => {
    const lid = { id: 'a', naam: 'Sanne', magTrainen: true }
    expect(isZoekAntwoord({ exact: true, bron: 'qr', leden: [lid] })).toBe(true)
    expect(isZoekAntwoord({ exact: true, bron: 'qr', leden: [{ id: 1 }] })).toBe(false)
    expect(isCheckinAntwoord({ soort: 'ingecheckt', op: '2026-10-14T10:00:00Z', les: null })).toBe(true)
    expect(isCheckinAntwoord({ soort: 'niet_actief', statusLabel: 'Gepauzeerd' })).toBe(true)
    expect(isCheckinAntwoord({ soort: 'raar' })).toBe(false)
    expect(isCheckinAntwoord(null)).toBe(false)
  })
})

describe('magInVestiging (regel van fitfactory.nl)', () => {
  it('leden van Eersel sporten overal, anderen overal behalve in Eersel', () => {
    expect(magInVestiging('eersel', 'budel')).toBe(true)
    expect(magInVestiging('eersel', 'eersel')).toBe(true)
    expect(magInVestiging('budel', 'someren')).toBe(true)
    expect(magInVestiging('budel', 'eersel')).toBe(false)
  })

  it('beoordeelCheckin weigert zonder toegang, maar niet-actief gaat voor', () => {
    const nu = new Date('2026-10-14T10:00:00Z')
    expect(beoordeelCheckin('actief', null, nu, false)).toEqual({ soort: 'geen_toegang' })
    expect(beoordeelCheckin('gestopt', null, nu, false)).toEqual({ soort: 'niet_actief', status: 'gestopt' })
    expect(beoordeelCheckin('actief', null, nu)).toEqual({ soort: 'mag' })
  })

  it('isCheckinAntwoord kent geen_toegang', () => {
    expect(isCheckinAntwoord({ soort: 'geen_toegang', vestigingLabel: 'Budel' })).toBe(true)
    expect(isCheckinAntwoord({ soort: 'geen_toegang' })).toBe(false)
  })

  it('isCheckinAntwoord kent de waarschuwing van het lidmaatschap', () => {
    expect(isCheckinAntwoord({ soort: 'vorm_waarschuwing', reden: 'Buiten de daluren.' })).toBe(true)
    expect(isCheckinAntwoord({ soort: 'vorm_waarschuwing' })).toBe(false)
  })
})
