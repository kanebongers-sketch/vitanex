import { describe, expect, it } from 'vitest'
import { controleCode, hashPin, tokenHash } from '@/lib/club/kern/pin'
import type { Beheerder } from './beheerder'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { beheerderVanSessie, beoordeelBeheerder, haalBeheerders, kiesBeheerderWachtwoord, logInMetWachtwoord, nieuweBeheerderCode, vindBeheerder, vindBeheerderOpEmail } from './beheerder-opslag'
import { heeftFilter, nepSupabase, type Antwoord, type Vraag } from './nep-supabase'

const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const ID = '11111111-1111-4111-8111-111111111111'
const NU = new Date('2026-10-17T12:00:00Z')
const PIN = '482915'

const rij = (extra: Record<string, unknown> = {}) => ({
  id: ID, organisatie_id: GYM_A, naam: 'Sanne', email: null, rol: 'eigenaar', code: 'abcdefghijklmnopqrstuvwx', actief: true,
  pin_hash: null, pin_status: 'geen', mislukt: 0, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null, ...extra,
})

const beheerder = (extra: Partial<Beheerder> = {}): Beheerder => ({
  id: ID, organisatieId: GYM_A, naam: 'Sanne', email: null, rol: 'eigenaar', code: 'abcdefghijklmnopqrstuvwx', actief: true,
  pinStatus: 'actief', pinHash: hashPin(PIN), wachtwoordHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
})

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij: Antwoord = ok([{ id: ID }])

describe('vindBeheerder', () => {
  it('een ongeldige code vraagt de database niet eens', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await vindBeheerder(admin, '../etc')).toBeNull()
    expect(vragen).toHaveLength(0)
  })
  it('een gestopte beheerder telt niet', async () => {
    const { admin } = nepSupabase(() => ok(rij({ actief: false })))
    expect(await vindBeheerder(admin, 'abcdefghijklmnopqrstuvwx')).toBeNull()
  })
})

describe('uitnodiging: een keer een wachtwoord kiezen', () => {
  const uitgenodigd = (extra: Partial<Beheerder> = {}) => beheerder({ email: 'sanne@gym.nl', pinStatus: 'geen', pinHash: null, wachtwoordHash: null, ...extra })
  it('slaat de hash op (compare-and-set) en logt meteen in', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await kiesBeheerderWachtwoord(admin, uitgenodigd(), 's2:hash', NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.tabel === 'club_beheerders' && v.actie === 'update')
    expect((update?.waarde as Record<string, unknown>).wachtwoord_hash).toBe('s2:hash')
    expect(update && update.filters.some(([op, k]) => op === 'is' && k === 'wachtwoord_hash')).toBe(true)
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'insert')).toBe(true)
  })
  it('al gekozen, gestopt of zonder e-mail: niet, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect((await kiesBeheerderWachtwoord(admin, uitgenodigd({ wachtwoordHash: 's2:x' }), 's2:hash', NU)).staat).toBe('al_gekozen')
    expect((await kiesBeheerderWachtwoord(admin, uitgenodigd({ actief: false }), 's2:hash', NU)).staat).toBe('al_gekozen')
    expect((await kiesBeheerderWachtwoord(admin, uitgenodigd({ email: null }), 's2:hash', NU)).staat).toBe('al_gekozen')
    expect(vragen).toHaveLength(0)
  })
  it('e-mailadres al in gebruik (unieke index): email_bezet', async () => {
    const { admin } = nepSupabase(() => ({ data: null, error: { code: '23505', message: 'dubbel' } }))
    expect((await kiesBeheerderWachtwoord(admin, uitgenodigd(), 's2:hash', NU)).staat).toBe('email_bezet')
  })
})

const WW_HASH = await hashWachtwoord('Blauwe-kat-rent-7')

describe('inloggen met e-mail en wachtwoord', () => {
  const WW = 'Blauwe-kat-rent-7'
  const metWw = (extra: Partial<Beheerder> = {}) => beheerder({ email: 'mark@gym.nl', pinStatus: 'geen', pinHash: null, wachtwoordHash: WW_HASH, ...extra })
  it('goed wachtwoord: een sessie; fout: telt af met dezelfde rem als de pincode', async () => {
    const { admin } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    expect((await logInMetWachtwoord(admin, metWw(), WW, NU)).staat).toBe('ok')
    expect(await logInMetWachtwoord(admin, metWw(), 'Fout-wachtwoord-99', NU)).toEqual({ staat: 'fout', over: 4 })
    expect((await logInMetWachtwoord(admin, metWw({ mislukt: 4 }), 'Fout-wachtwoord-99', NU)).staat).toBe('geblokkeerd')
  })
  it('zonder wachtwoord of gestopt: niet actief, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect((await logInMetWachtwoord(admin, metWw({ wachtwoordHash: null }), WW, NU)).staat).toBe('niet_actief')
    expect((await logInMetWachtwoord(admin, metWw({ actief: false }), WW, NU)).staat).toBe('niet_actief')
    expect(vragen).toHaveLength(0)
  })
  it('op e-mail: alleen een geldig adres, in kleine letters, en alleen als er precies een is', async () => {
    const { admin, vragen } = nepSupabase(() => ok([rij({ email: 'mark@gym.nl', wachtwoord_hash: 's2:x' })]))
    expect((await vindBeheerderOpEmail(admin, ' Mark@Gym.nl '))?.id).toBe(ID)
    expect(heeftFilter(vragen[0], 'email', 'mark@gym.nl')).toBe(true)
    expect(await vindBeheerderOpEmail(admin, 'geen-adres')).toBeNull()
    const twee = nepSupabase(() => ok([rij({ email: 'mark@gym.nl', wachtwoord_hash: 's2:x' }), rij({ id: '22222222-2222-4222-8222-222222222222', email: 'mark@gym.nl', wachtwoord_hash: 's2:x' })]))
    expect(await vindBeheerderOpEmail(twee.admin, 'mark@gym.nl')).toBeNull()
  })
})

describe('beheerderVanSessie', () => {
  const sessie = { beheerder_id: ID, verloopt_op: '2026-11-01T00:00:00Z', laatst_gebruikt_op: '2026-10-17T11:30:00Z', aangemaakt_op: '2026-10-10T00:00:00Z' }
  const db = (b: unknown) => (v: Vraag) => (v.tabel === 'club_beheerder_sessies' ? ok(sessie) : ok(b))
  it('geldige sessie en actieve beheerder met wachtwoord', async () => {
    const { admin } = nepSupabase(db(rij({ wachtwoord_hash: 's2:x' })))
    expect((await beheerderVanSessie(admin, 'token', NU))?.organisatieId).toBe(GYM_A)
  })
  it('gestopt of nieuwe uitnodiging (wachtwoord weg): geen toegang meer', async () => {
    expect(await beheerderVanSessie(nepSupabase(db(rij({ wachtwoord_hash: 's2:x', actief: false }))).admin, 'token', NU)).toBeNull()
    expect(await beheerderVanSessie(nepSupabase(db(rij({ pin_status: 'geen' }))).admin, 'token', NU)).toBeNull()
  })
  it('geen of een te lang token: null zonder database', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await beheerderVanSessie(admin, undefined, NU)).toBeNull()
    expect(await beheerderVanSessie(admin, 'x'.repeat(101), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
})

describe('beheer door Kane blijft binnen de sportschool', () => {
  it('lijst filtert op de organisatie en geeft nooit een hash', async () => {
    const { admin, vragen } = nepSupabase(() => ok([rij({ wachtwoord_hash: 's2:geheim' })]))
    const lijst = await haalBeheerders(admin, GYM_A)
    expect(heeftFilter(vragen[0], 'organisatie_id', GYM_A)).toBe(true)
    expect(JSON.stringify(lijst)).not.toContain('s2:geheim')
    expect(lijst?.[0]?.heeftWachtwoord).toBe(true)
  })
  it('elke actie filtert op id EN organisatie; een beheerder van een andere sportschool: niet gevonden', async () => {
    const { admin, vragen } = nepSupabase((v) => (heeftFilter(v, 'organisatie_id', GYM_B) ? ok([]) : eenRij))
    expect(await beoordeelBeheerder(admin, GYM_B, ID, { actie: 'stoppen' })).toBe('niet_gevonden')
    expect(heeftFilter(vragen[0], 'id', ID)).toBe(true)
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
  it('stoppen en nieuwe uitnodiging: wachtwoord weg en alle toestellen uit; een nieuwe uitnodiging krijgt een nieuwe link', async () => {
    for (const actie of ['stoppen', 'reset'] as const) {
      const { admin, vragen } = nepSupabase(() => eenRij)
      expect(await beoordeelBeheerder(admin, GYM_A, ID, { actie })).toBe('ok')
      const waarde = vragen[0].waarde as Record<string, unknown>
      expect(waarde.wachtwoord_hash).toBeNull()
      expect(actie === 'reset' ? typeof waarde.code : waarde.actief).toBe(actie === 'reset' ? 'string' : false)
      expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'delete' && heeftFilter(v, 'beheerder_id', ID))).toBe(true)
    }
  })
})

describe('nieuweBeheerderCode', () => {
  it('24 tekens en elke keer anders', () => {
    const a = nieuweBeheerderCode()
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(nieuweBeheerderCode()).not.toBe(a)
  })
})
