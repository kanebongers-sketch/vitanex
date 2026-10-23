import { describe, expect, it } from 'vitest'
import {
  BEHEERDER_CODE, beheerderCookie, beheerderUitRij, beoordeelBeheerderSessie, leesBeoordeling, leesNieuweBeheerder, magBinnen,
} from './beheerder'

const ORG = 'de000000-0000-4000-8000-0000000000c1'
const ID = '11111111-1111-4111-8111-111111111111'
const RIJ = {
  id: ID, organisatie_id: ORG, naam: 'Sanne de Vries', email: null, rol: 'eigenaar', code: 'abcdefghijklmnopqrstuvwx',
  actief: true, pin_hash: 'salt:hash', pin_status: 'actief', mislukt: 2, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null,
}

describe('beheerderUitRij', () => {
  it('leest een geldige rij', () => {
    expect(beheerderUitRij(RIJ)).toMatchObject({ id: ID, organisatieId: ORG, rol: 'eigenaar', pinStatus: 'actief', mislukt: 2, actief: true })
  })
  it('weigert een rij zonder geldige organisatie, rol of code', () => {
    expect(beheerderUitRij({ ...RIJ, organisatie_id: 'x' })).toBeNull()
    expect(beheerderUitRij({ ...RIJ, rol: 'beheerder' })).toBeNull()
    expect(beheerderUitRij({ ...RIJ, code: 'kort' })).toBeNull()
    expect(beheerderUitRij(null)).toBeNull()
  })
  it('een onbekende pinstatus telt als geen pincode', () => {
    expect(beheerderUitRij({ ...RIJ, pin_status: 'raar' })?.pinStatus).toBe('geen')
  })
})

describe('code van de link', () => {
  it('accepteert alleen 24 tekens base64url', () => {
    expect(BEHEERDER_CODE.test('abcdefghijklmnopqrstuvwx')).toBe(true)
    expect(BEHEERDER_CODE.test('abcdefghijklmnopqrstuvw')).toBe(false)
    expect(BEHEERDER_CODE.test('abcdefghijklmnopqrstuv/x')).toBe(false)
  })
})

describe('leesNieuweBeheerder', () => {
  it('maakt naam en e-mail schoon', () => {
    expect(leesNieuweBeheerder({ naam: '  Sanne   de Vries ', email: ' SANNE@Gym.nl ', rol: 'clubmanager' })).toEqual({
      ok: true,
      waarde: { naam: 'Sanne de Vries', email: 'sanne@gym.nl', rol: 'clubmanager' },
    })
  })
  it('weigert lege naam, foute e-mail en onbekende rol (ook beheerder)', () => {
    expect(leesNieuweBeheerder({ naam: '', rol: 'eigenaar' }).ok).toBe(false)
    expect(leesNieuweBeheerder({ naam: 'A', email: 'geen-mail', rol: 'eigenaar' }).ok).toBe(false)
    expect(leesNieuweBeheerder({ naam: 'A', rol: 'beheerder' }).ok).toBe(false)
    expect(leesNieuweBeheerder({ naam: 'x'.repeat(61), rol: 'eigenaar' }).ok).toBe(false)
  })
  it('e-mail is verplicht (daarmee logt de beheerder in) en wordt kleine letters', () => {
    expect(leesNieuweBeheerder({ naam: 'A', rol: 'eigenaar' }).ok).toBe(false)
    expect(leesNieuweBeheerder({ naam: 'A', email: ' A@Gym.nl ', rol: 'eigenaar' })).toEqual({ ok: true, waarde: { naam: 'A', email: 'a@gym.nl', rol: 'eigenaar' } })
  })
})

describe('leesBeoordeling', () => {
  it('kent alleen nieuwe uitnodiging en stoppen (geen pincode meer)', () => {
    expect(leesBeoordeling({ actie: 'stoppen' })).toEqual({ ok: true, waarde: { actie: 'stoppen' } })
    expect(leesBeoordeling({ actie: 'reset' })).toEqual({ ok: true, waarde: { actie: 'reset' } })
    expect(leesBeoordeling({ actie: 'goedkeuren' }).ok).toBe(false)
    expect(leesBeoordeling({ actie: 'verwijderen' }).ok).toBe(false)
    expect(leesBeoordeling(null).ok).toBe(false)
  })
})

describe('beheerderCookie', () => {
  it('in productie met __Host-, lokaal zonder (dat vraagt https)', () => {
    expect(beheerderCookie(true)).toBe('__Host-club_sessie')
    expect(beheerderCookie(false)).toBe('club_sessie')
  })
})

describe('beoordeelBeheerderSessie', () => {
  const nu = new Date('2026-10-17T12:00:00Z')
  const sessie = (verloopt: string, laatst: string | null) => ({ beheerder_id: ID, verloopt_op: verloopt, laatst_gebruikt_op: laatst, aangemaakt_op: '2026-10-10T12:00:00Z' })
  it('geldig binnen het uur, aanraken daarna', () => {
    expect(beoordeelBeheerderSessie(sessie('2026-11-01T00:00:00Z', '2026-10-17T11:30:00Z'), nu)).toBe('geldig')
    expect(beoordeelBeheerderSessie(sessie('2026-11-01T00:00:00Z', '2026-10-17T09:00:00Z'), nu)).toBe('aanraken')
  })
  it('verlopen na de einddatum of na 7 dagen stilte', () => {
    expect(beoordeelBeheerderSessie(sessie('2026-10-17T11:59:59Z', '2026-10-17T11:30:00Z'), nu)).toBe('verlopen')
    expect(beoordeelBeheerderSessie(sessie('2026-11-01T00:00:00Z', '2026-10-09T11:00:00Z'), nu)).toBe('verlopen')
    expect(beoordeelBeheerderSessie(sessie('kapot', null), nu)).toBe('verlopen')
  })
})

describe('magBinnen', () => {
  it('alleen actief en met een eigen wachtwoord', () => {
    expect(magBinnen({ actief: true, wachtwoordHash: 's2:x' })).toBe(true)
    expect(magBinnen({ actief: false, wachtwoordHash: 's2:x' })).toBe(false)
    expect(magBinnen({ actief: true, wachtwoordHash: null })).toBe(false)
  })
})
