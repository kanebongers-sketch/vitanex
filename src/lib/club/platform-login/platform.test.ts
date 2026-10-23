import { describe, expect, it } from 'vitest'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { heeftFilter, nepSupabase, type Antwoord } from '@/lib/club/beheerders/nep-supabase'
import { kiesPlatformWachtwoord, logInPlatform, vindPlatformOpEmail } from './opslag'
import { linkStand, platformAccountUitRij, type PlatformAccount } from './platform'

const NU = new Date('2026-10-23T12:00:00Z')
const ID = '11111111-1111-4111-8111-111111111111'
const BEHEERDER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const WW = 'Blauwe-kat-rent-7'
const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij = ok([{ id: ID }])

const account = (extra: Partial<PlatformAccount> = {}): PlatformAccount => ({
  id: ID, naam: 'Kane', email: 'kane@voorbeeld.nl', beheerderId: BEHEERDER, actief: true, pinHash: null, wachtwoordHash: null,
  linkKiezenTot: '2026-10-24T12:00:00Z', mislukt: 0, geblokkeerdTot: null, blokkades: 0, ...extra,
})

describe('platform-account', () => {
  it('uit een rij: e-mail in kleine letters, zonder e-mail geen account', () => {
    const rij = { id: ID, naam: 'Kane', email: ' Kane@Voorbeeld.nl', beheerder_id: BEHEERDER, actief: true, wachtwoord_hash: 's2:x' }
    expect(platformAccountUitRij(rij)?.email).toBe('kane@voorbeeld.nl')
    expect(platformAccountUitRij(rij)?.wachtwoordHash).toBe('s2:x')
    expect(platformAccountUitRij({ ...rij, email: undefined })).toBeNull()
  })
  it('startlink: kiezen zolang er geen wachtwoord is en binnen 24 uur; daarna weg', () => {
    expect(linkStand(account(), NU)).toBe('kiezen')
    expect(linkStand(account({ linkKiezenTot: '2026-10-23T11:00:00Z' }), NU)).toBe('verlopen')
    expect(linkStand(account({ wachtwoordHash: 's2:x' }), NU)).toBe('verlopen')
    expect(linkStand(account({ linkKiezenTot: null }), NU)).toBe('verlopen')
  })
})

describe('wachtwoord kiezen met de startlink', () => {
  it('slaat alleen de hash op, wist pincode en link, en logt in', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await kiesPlatformWachtwoord(admin, account(), WW, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.tabel === 'club_platform_accounts' && v.actie === 'update')
    const waarde = update?.waarde as Record<string, unknown>
    expect(String(waarde.wachtwoord_hash)).toMatch(/^s2:/)
    expect(JSON.stringify(waarde)).not.toContain(WW)
    expect(waarde.pin_hash).toBeNull()
    expect(waarde.link_hash).toBeNull()
  })
  it('te laat of al gekozen: niet mogelijk, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect((await kiesPlatformWachtwoord(admin, account({ wachtwoordHash: 's2:x' }), WW, NU)).staat).toBe('niet_mogelijk')
    expect(vragen).toHaveLength(0)
  })
})

describe('inloggen met e-mail en wachtwoord', () => {
  it('goed: een sessie; fout: telt af; zonder wachtwoord: geen toegang', async () => {
    const { admin } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const met = account({ wachtwoordHash: hashWachtwoord(WW) })
    expect((await logInPlatform(admin, met, WW, NU)).staat).toBe('ok')
    expect(await logInPlatform(admin, met, 'Fout-wachtwoord-99', NU)).toEqual({ staat: 'fout', over: 4 })
    expect((await logInPlatform(admin, account({ pinHash: 'oud' }), WW, NU)).staat).toBe('geen_wachtwoord')
  })
  it('op e-mail: in kleine letters, een ongeldig adres vraagt de database niet', async () => {
    const { admin, vragen } = nepSupabase(() => ok({ id: ID, naam: 'Kane', email: 'kane@voorbeeld.nl', beheerder_id: BEHEERDER, actief: true }))
    expect((await vindPlatformOpEmail(admin, ' Kane@Voorbeeld.NL '))?.id).toBe(ID)
    expect(heeftFilter(vragen[0], 'email', 'kane@voorbeeld.nl')).toBe(true)
    expect(await vindPlatformOpEmail(admin, 'geen adres')).toBeNull()
    expect(vragen).toHaveLength(1)
  })
})
