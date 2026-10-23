import { describe, expect, it } from 'vitest'
import {
  LID_INACTIEF_DAGEN, LID_SESSIE_DAGEN, LINK_KIES_DAGEN, beoordeelLidSessie, kanInloggen, leesLinkActie, lidApparaatCookie, lidCookie, lidToegangUitRij,
  linkBasis, linkBruikbaar, linkOverzicht, sessiePastBij, sessieToegestaan, startPad, type LidToegangRij,
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
  email: null, wachtwoordHash: null, pinHash: null, codeGebruiktOp: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
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
    expect(lidToegangUitRij(rij)).toMatchObject({ id: ID, userId: GYM, lidId: LID, pinHash: 'x', mislukt: 2, email: null, wachtwoordHash: null, codeGebruiktOp: null })
    expect(lidToegangUitRij({ ...rij, email: 'a@b.nl', wachtwoord_hash: 's2:x', code_gebruikt_op: NU.toISOString() })).toMatchObject({ email: 'a@b.nl', wachtwoordHash: 's2:x', codeGebruiktOp: NU.toISOString() })
  })
  it('weigert een rij met een rare code of zonder sportschool', () => {
    expect(lidToegangUitRij({ ...rij, code: '../x' })).toBeNull()
    expect(lidToegangUitRij({ ...rij, user_id: null })).toBeNull()
    expect(lidToegangUitRij(null)).toBeNull()
  })
})

describe('linkBruikbaar (de uitnodiging)', () => {
  it('verse, ongebruikte link: bruikbaar', () => {
    expect(linkBruikbaar(toegang(), NU)).toBe(true)
  })
  it('na 7 dagen of na gebruik: niet meer (eenmalig)', () => {
    const oud = new Date(NU.getTime() - (LINK_KIES_DAGEN + 1) * DAG).toISOString()
    expect(linkBruikbaar(toegang({ codeGemaaktOp: oud }), NU)).toBe(false)
    expect(linkBruikbaar(toegang({ codeGebruiktOp: NU.toISOString() }), NU)).toBe(false)
    expect(linkBruikbaar(toegang({ codeGemaaktOp: 'onzin' }), NU)).toBe(false)
  })
  it('ingetrokken: niet; een dicht account mag via een verse uitnodiging weer open', () => {
    expect(linkBruikbaar(toegang({ actief: false }), NU)).toBe(false)
    expect(linkBruikbaar(toegang({ blokkades: 6, wachtwoordHash: 's2:x' }), NU)).toBe(true)
  })
})

describe('kanInloggen en sessieToegestaan', () => {
  it('inloggen alleen met e-mail en wachtwoord, nooit met alleen een pincode', () => {
    expect(kanInloggen(toegang({ email: 'a@b.nl', wachtwoordHash: 's2:x' }))).toBe(true)
    expect(kanInloggen(toegang({ email: 'a@b.nl', pinHash: 'x' }))).toBe(false)
    expect(kanInloggen(toegang({ email: null, wachtwoordHash: 's2:x' }))).toBe(false)
    expect(kanInloggen(toegang({ email: 'a@b.nl', wachtwoordHash: 's2:x', blokkades: 6 }))).toBe(false)
    expect(kanInloggen(toegang({ email: 'a@b.nl', wachtwoordHash: 's2:x', actief: false }))).toBe(false)
  })
  it('bestaande sessies van een oude pincode blijven geldig; ingetrokken of dicht niet', () => {
    expect(sessieToegestaan(toegang({ pinHash: 'x' }))).toBe(true)
    expect(sessieToegestaan(toegang({ wachtwoordHash: 's2:x' }))).toBe(true)
    expect(sessieToegestaan(toegang())).toBe(false)
    expect(sessieToegestaan(toegang({ pinHash: 'x', actief: false }))).toBe(false)
    expect(sessieToegestaan(toegang({ wachtwoordHash: 's2:x', blokkades: 6 }))).toBe(false)
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
  const gebruikt = NU.toISOString()
  const oud = new Date(NU.getTime() - 30 * DAG).toISOString()
  it('nooit een hash of het e-mailadres, en de juiste staat', () => {
    const o = linkOverzicht(toegang({ wachtwoordHash: 'geheim', email: 'geheim@x.nl', codeGebruiktOp: gebruikt }), 2, NU)
    expect(o).toEqual({ code: null, staat: 'actief', laatstIngelogdOp: null, toestellen: 2 })
    expect(JSON.stringify(o)).not.toContain('geheim')
    expect(linkOverzicht(null, 0, NU).staat).toBe('geen')
    expect(linkOverzicht(toegang({ actief: false }), 3, NU)).toMatchObject({ code: null, staat: 'ingetrokken', toestellen: 0 })
    expect(linkOverzicht(toegang({ blokkades: 6, wachtwoordHash: 'x' }), 0, NU).staat).toBe('dicht')
  })
  it('uitgenodigd: de code alleen zolang de uitnodiging werkt', () => {
    expect(linkOverzicht(toegang(), 0, NU)).toMatchObject({ code: 'abcdefghijklmnopqrstuvwx', staat: 'kiezen' })
    expect(linkOverzicht(toegang({ codeGemaaktOp: oud }), 0, NU)).toMatchObject({ code: null, staat: 'verlopen' })
    // Wachtwoord vergeten: een verse uitnodiging naast een bestaand wachtwoord.
    expect(linkOverzicht(toegang({ wachtwoordHash: 'x' }), 1, NU)).toMatchObject({ code: 'abcdefghijklmnopqrstuvwx', staat: 'actief' })
  })
  it('nog met een oude pincode binnen: pincode; zonder toestel: verlopen', () => {
    expect(linkOverzicht(toegang({ pinHash: 'x', codeGemaaktOp: oud }), 1, NU).staat).toBe('pincode')
    expect(linkOverzicht(toegang({ pinHash: 'x', codeGemaaktOp: oud }), 0, NU).staat).toBe('verlopen')
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
