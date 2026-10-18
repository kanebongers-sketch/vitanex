import { describe, expect, it } from 'vitest'
import {
  LID_INACTIEF_DAGEN, LID_SESSIE_DAGEN, LINK_KIES_DAGEN, beoordeelLidSessie, leesLinkActie, lidApparaatCookie, lidCookie, lidToegangUitRij,
  linkBasis, linkOverzicht, linkStaat, sessiePastBij, startPad, type LidToegangRij,
} from './regels'
import { isZwakkePin } from './pin-keuze'
import { tabsUitVoor } from './tabs'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij } from '@/lib/club/kern/org-instellingen'

const NU = new Date('2026-10-17T12:00:00Z')
const DAG = 86_400_000
const GYM = 'de000000-0000-4000-8000-0000000000c1'
const LID = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'

const toegang = (extra: Partial<LidToegangRij> = {}): LidToegangRij => ({
  id: ID, userId: GYM, lidId: LID, code: 'abcdefghijklmnopqrstuvwx', codeGemaaktOp: NU.toISOString(), actief: true,
  pinHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
})

describe('cookies', () => {
  it('in productie met __Host-, lokaal zonder', () => {
    expect(lidCookie(true)).toBe('__Host-club_lid')
    expect(lidCookie(false)).toBe('club_lid')
    expect(lidApparaatCookie(true)).toMatch(/^__Host-/)
  })
})

describe('lidToegangUitRij', () => {
  const rij = { id: ID, user_id: GYM, lid_id: LID, code: 'abcdefghijklmnopqrstuvwx', code_gemaakt_op: NU.toISOString(), actief: true, pin_hash: 'x', mislukt: 2 }
  it('leest een goede rij', () => {
    expect(lidToegangUitRij(rij)).toMatchObject({ id: ID, userId: GYM, lidId: LID, pinHash: 'x', mislukt: 2 })
  })
  it('weigert een rij met een rare code of zonder sportschool', () => {
    expect(lidToegangUitRij({ ...rij, code: '../x' })).toBeNull()
    expect(lidToegangUitRij({ ...rij, user_id: null })).toBeNull()
    expect(lidToegangUitRij(null)).toBeNull()
  })
})

describe('linkStaat', () => {
  it('verse link zonder pincode: kiezen', () => {
    expect(linkStaat(toegang(), NU)).toBe('kiezen')
  })
  it('na de kiestermijn is een ongebruikte link ongeldig', () => {
    const oud = new Date(NU.getTime() - (LINK_KIES_DAGEN + 1) * DAG).toISOString()
    expect(linkStaat(toegang({ codeGemaaktOp: oud }), NU)).toBe('ongeldig')
  })
  it('met pincode: inloggen, ook na de kiestermijn', () => {
    const oud = new Date(NU.getTime() - 100 * DAG).toISOString()
    expect(linkStaat(toegang({ pinHash: 'x', codeGemaaktOp: oud }), NU)).toBe('inloggen')
  })
  it('ingetrokken of dicht na te veel blokkades: ongeldig', () => {
    expect(linkStaat(toegang({ actief: false, pinHash: 'x' }), NU)).toBe('ongeldig')
    expect(linkStaat(toegang({ blokkades: 6, pinHash: 'x' }), NU)).toBe('ongeldig')
  })
})

describe('beoordeelLidSessie', () => {
  const sessie = (verloopt: number, laatst: number) => ({
    verloopt_op: new Date(NU.getTime() + verloopt).toISOString(),
    laatst_gebruikt_op: new Date(NU.getTime() - laatst).toISOString(),
    aangemaakt_op: new Date(NU.getTime() - laatst).toISOString(),
  })
  it('vers: geldig; na een uur: aanraken', () => {
    expect(beoordeelLidSessie(sessie(DAG, 1000), NU)).toBe('geldig')
    expect(beoordeelLidSessie(sessie(DAG, 2 * 3600_000), NU)).toBe('aanraken')
  })
  it('verlopen na de harde grens of lang niet gebruikt', () => {
    expect(beoordeelLidSessie(sessie(-1, 0), NU)).toBe('verlopen')
    expect(beoordeelLidSessie(sessie(LID_SESSIE_DAGEN * DAG, (LID_INACTIEF_DAGEN + 1) * DAG), NU)).toBe('verlopen')
    expect(beoordeelLidSessie({ verloopt_op: 'onzin', laatst_gebruikt_op: null, aangemaakt_op: NU.toISOString() }, NU)).toBe('verlopen')
  })
})

describe('sessiePastBij', () => {
  const s = { toegang_id: ID, user_id: GYM, lid_id: LID }
  it('alleen als toegang, sportschool en lid alle drie kloppen', () => {
    expect(sessiePastBij(s, toegang())).toBe(true)
    expect(sessiePastBij({ ...s, user_id: 'be000000-0000-4000-8000-0000000000b2' }, toegang())).toBe(false)
    expect(sessiePastBij({ ...s, lid_id: ID }, toegang())).toBe(false)
  })
})

describe('linkOverzicht', () => {
  it('nooit de pin-hash, en de juiste staat', () => {
    const o = linkOverzicht(toegang({ pinHash: 'geheim' }), 2, NU)
    expect(o).toEqual({ code: 'abcdefghijklmnopqrstuvwx', staat: 'actief', laatstIngelogdOp: null, toestellen: 2 })
    expect(JSON.stringify(o)).not.toContain('geheim')
    expect(linkOverzicht(null, 0, NU).staat).toBe('geen')
    expect(linkOverzicht(toegang({ actief: false }), 3, NU)).toMatchObject({ code: null, staat: 'ingetrokken', toestellen: 0 })
    expect(linkOverzicht(toegang({ blokkades: 6, pinHash: 'x' }), 0, NU).staat).toBe('dicht')
  })
})

describe('kleine helpers', () => {
  it('startPad, linkBasis en leesLinkActie', () => {
    expect(startPad('abc_-x')).toBe('/mijn/start/abc_-x')
    expect(linkBasis('gym', true, 'aiyourgym.com')).toBe('https://gym.aiyourgym.com')
    expect(linkBasis('gym', false, 'aiyourgym.com')).toBeNull()
    expect(linkBasis(null, true, 'aiyourgym.com')).toBeNull()
    expect(leesLinkActie({ actie: 'maak' })).toBe('maak')
    expect(leesLinkActie({ actie: 'wis-alles' })).toBeNull()
  })
})

describe('isZwakkePin', () => {
  it('weigert voor de hand liggende pincodes', () => {
    for (const pin of ['000000', '111111', '123456', '654321', '890123', '121212', '123123', '12345', 'abcdef']) expect(isZwakkePin(pin)).toBe(true)
  })
  it('laat een gewone pincode door', () => {
    for (const pin of ['482915', '730264', '190837']) expect(isZwakkePin(pin)).toBe(false)
  })
})

describe('tabsUitVoor', () => {
  const org = (uit: string[], tabsUit: string[] = []) => ({
    uit: uit as never,
    instellingen: orgInstellingenUitRij({ ledenapp: { tabs_uit: tabsUit } }, ONDERDEEL_SLEUTELS),
  })
  it('zelf uitgezette tabs en tabs van uitgezette onderdelen; Home nooit', () => {
    expect(tabsUitVoor(org([]))).toEqual([])
    expect(tabsUitVoor(org(['rooster', 'training']))).toEqual(['lessen', 'schema', 'voeding'])
    expect(tabsUitVoor(org(['afspraken'], ['voortgang']))).toEqual(['afspraken', 'voortgang'])
  })
})
