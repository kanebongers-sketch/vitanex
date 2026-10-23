import { describe, expect, it } from 'vitest'
import {
  beoordeelMedewerkerSessie, leesLoginActie, loginStaat, magMedewerkerBinnen, medewerkerCookie, medewerkerMetOrgUitRij, sessiePastBij, toegangUitRij, uitnodigingPad,
  type MedewerkerMetOrg, type MedewerkerToegang,
} from './medewerker-login'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDERE_GYM = 'be000000-0000-4000-8000-0000000000b2'
const MW = '33333333-3333-4333-8333-333333333333'
const TOEGANG_ID = '44444444-4444-4444-8444-444444444444'
const CODE = 'abcdefghijklmnopqrstuvwx'

const rij = { id: TOEGANG_ID, user_id: GYM, medewerker_id: MW, code: CODE, actief: true, pin_hash: 'salt:hash', pin_status: 'actief', mislukt: 1, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null }
const toegang = toegangUitRij(rij) as MedewerkerToegang
const mens: MedewerkerMetOrg = { id: MW, userId: GYM, naam: 'Lotte de Vries', email: null, rollen: ['trainer'], vestigingen: ['budel'], actief: true }

describe('toegangUitRij', () => {
  it('leest een goede rij', () => {
    expect(toegang).toMatchObject({ id: TOEGANG_ID, userId: GYM, medewerkerId: MW, pinStatus: 'actief', mislukt: 1, actief: true })
  })
  it('weigert een rij met een kapotte code of id', () => {
    expect(toegangUitRij({ ...rij, code: 'kort' })).toBeNull()
    expect(toegangUitRij({ ...rij, user_id: 'x' })).toBeNull()
    expect(toegangUitRij(null)).toBeNull()
  })
  it('leest e-mailadres (kleine letters), wachtwoord-hash en uitnodiging', () => {
    const t = toegangUitRij({ ...rij, email: 'Lotte@Gym.NL', wachtwoord_hash: 's2:x', uitnodiging_verloopt_op: '2026-10-24T00:00:00Z' })
    expect(t).toMatchObject({ email: 'lotte@gym.nl', wachtwoordHash: 's2:x', uitnodigingVerlooptOp: '2026-10-24T00:00:00Z' })
    expect(toegangUitRij({ ...rij, email: 'geen-adres' })?.email).toBeNull()
  })
  it('onbekende pinstatus wordt geen; actief alleen bij true', () => {
    expect(toegangUitRij({ ...rij, pin_status: 'raar', actief: 'ja' })).toMatchObject({ pinStatus: 'geen', actief: false })
  })
})

describe('medewerkerMetOrgUitRij', () => {
  it('neemt de sportschool mee en filtert onbekende rollen', () => {
    const m = medewerkerMetOrgUitRij({ id: MW, user_id: GYM, naam: 'Lotte', rollen: ['trainer', 'baas'], vestigingen: ['budel'], actief: true })
    expect(m).toMatchObject({ userId: GYM, rollen: ['trainer'] })
  })
  it('zonder geldige user_id: null', () => {
    expect(medewerkerMetOrgUitRij({ id: MW, naam: 'Lotte' })).toBeNull()
  })
})

describe('magMedewerkerBinnen', () => {
  it('actieve link, goedgekeurde pin, in dienst, met een rol: ja', () => {
    expect(magMedewerkerBinnen(toegang, mens)).toBe(true)
  })
  it('met een wachtwoord: ja, ook zonder pincode', () => {
    expect(magMedewerkerBinnen({ ...toegang, pinStatus: 'geen', pinHash: null, wachtwoordHash: 's2:x' }, mens)).toBe(true)
  })
  it('alleen uitgenodigd, pin wacht of geen pin en geen wachtwoord: nee', () => {
    expect(magMedewerkerBinnen({ ...toegang, pinStatus: 'wacht' }, mens)).toBe(false)
    expect(magMedewerkerBinnen({ ...toegang, pinStatus: 'geen', uitnodigingVerlooptOp: '2030-01-01T00:00:00Z' }, mens)).toBe(false)
  })
  it('link ingetrokken of medewerker uit dienst: nee', () => {
    expect(magMedewerkerBinnen({ ...toegang, actief: false }, mens)).toBe(false)
    expect(magMedewerkerBinnen(toegang, { ...mens, actief: false })).toBe(false)
  })
  it('zonder rol, andere medewerker of andere sportschool: nee', () => {
    expect(magMedewerkerBinnen(toegang, { ...mens, rollen: [] })).toBe(false)
    expect(magMedewerkerBinnen(toegang, { ...mens, id: TOEGANG_ID })).toBe(false)
    expect(magMedewerkerBinnen(toegang, { ...mens, userId: ANDERE_GYM })).toBe(false)
  })
})

describe('beoordeelMedewerkerSessie', () => {
  const nu = new Date('2026-10-17T12:00:00Z')
  const sessie = (verloopt: string, laatst: string | null, aangemaakt = '2026-10-10T12:00:00Z') => ({ verloopt_op: verloopt, laatst_gebruikt_op: laatst, aangemaakt_op: aangemaakt })
  it('net gebruikt: geldig', () => {
    expect(beoordeelMedewerkerSessie(sessie('2026-11-01T00:00:00Z', '2026-10-17T11:30:00Z'), nu)).toBe('geldig')
  })
  it('langer dan een uur niet gebruikt: aanraken', () => {
    expect(beoordeelMedewerkerSessie(sessie('2026-11-01T00:00:00Z', '2026-10-17T09:00:00Z'), nu)).toBe('aanraken')
  })
  it('na de harde einddatum, na 7 dagen stil of met kapotte data: verlopen', () => {
    expect(beoordeelMedewerkerSessie(sessie('2026-10-17T11:00:00Z', '2026-10-17T11:30:00Z'), nu)).toBe('verlopen')
    expect(beoordeelMedewerkerSessie(sessie('2026-11-01T00:00:00Z', '2026-10-09T12:00:00Z'), nu)).toBe('verlopen')
    expect(beoordeelMedewerkerSessie(sessie('kapot', null), nu)).toBe('verlopen')
  })
  it('zonder laatst gebruikt telt het aanmaakmoment', () => {
    expect(beoordeelMedewerkerSessie(sessie('2026-11-01T00:00:00Z', null, '2026-10-17T11:45:00Z'), nu)).toBe('geldig')
  })
})

describe('sessiePastBij', () => {
  it('alleen bij dezelfde link, medewerker en sportschool', () => {
    const s = { toegang_id: TOEGANG_ID, medewerker_id: MW, user_id: GYM }
    expect(sessiePastBij(s, toegang)).toBe(true)
    expect(sessiePastBij({ ...s, user_id: ANDERE_GYM }, toegang)).toBe(false)
    expect(sessiePastBij({ ...s, medewerker_id: TOEGANG_ID }, toegang)).toBe(false)
  })
})

describe('leesLoginActie', () => {
  it('uitnodigen vraagt een geldig e-mailadres en maakt het klein', () => {
    expect(leesLoginActie({ actie: 'uitnodigen' }).ok).toBe(false)
    expect(leesLoginActie({ actie: 'uitnodigen', email: 'geen adres' }).ok).toBe(false)
    expect(leesLoginActie({ actie: 'uitnodigen', email: ' Lotte@Gym.NL ' })).toEqual({ ok: true, waarde: { actie: 'uitnodigen', email: 'lotte@gym.nl' } })
  })
  it('intrekken zonder meer; oude pincode-acties en onbekend worden geweigerd', () => {
    expect(leesLoginActie({ actie: 'intrekken', email: 'x@y.nl' })).toEqual({ ok: true, waarde: { actie: 'intrekken' } })
    for (const actie of ['maken', 'goedkeuren', 'afwijzen', 'reset', 'stoppen']) expect(leesLoginActie({ actie, controle: '1234' }).ok).toBe(false)
    expect(leesLoginActie(null).ok).toBe(false)
  })
})

describe('loginStaat', () => {
  const nu = new Date('2026-10-23T12:00:00Z')
  const leeg = { ...toegang, pinStatus: 'geen' as const, pinHash: null }
  it('wachtwoord gaat voor alles; ingetrokken is geen', () => {
    expect(loginStaat({ ...leeg, wachtwoordHash: 's2:x', uitnodigingVerlooptOp: '2026-10-20T00:00:00Z' }, nu)).toBe('actief')
    expect(loginStaat({ ...leeg, actief: false, wachtwoordHash: 's2:x' }, nu)).toBe('geen')
  })
  it('uitnodiging open of verlopen; oude pincode; niets', () => {
    expect(loginStaat({ ...leeg, uitnodigingVerlooptOp: '2026-10-30T00:00:00Z' }, nu)).toBe('uitgenodigd')
    expect(loginStaat({ ...leeg, uitnodigingVerlooptOp: '2026-10-23T11:59:00Z' }, nu)).toBe('verlopen')
    expect(loginStaat(toegang, nu)).toBe('oud')
    expect(loginStaat(leeg, nu)).toBe('geen')
  })
})

describe('cookie en link', () => {
  it('in productie host-only met __Host-, los van de beheerderscookie', () => {
    expect(medewerkerCookie(true)).toBe('__Host-club_mw_sessie')
    expect(medewerkerCookie(false)).toBe('club_mw_sessie')
  })
  it('de uitnodiging staat onder /clubinloggen/ (gaat door op een subdomein)', () => {
    expect(uitnodigingPad('t'.repeat(43))).toBe(`/clubinloggen/medewerker/${'t'.repeat(43)}`)
  })
})
