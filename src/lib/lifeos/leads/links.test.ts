// Tests voor pincode-inlog en sessies (links.ts). De invarianten die tellen:
//   - foute pogingen tellen via compare-and-set, blokkades verdubbelen, en na
//     MAX_BLOKKADES is de link dicht tot Kane reset;
//   - een beheerderslink kent geen pincode: niet kiezen, niet inloggen, niet resetten;
//   - een sessie verloopt hard (90 d) én zacht (30 d ongebruikt), er blijven
//     hooguit 8 toestellen per persoon, en alleen de hash staat in de database.
// We bootsen de supabase-querybuilder minimaal na; de echte database is niet nodig.

import { beforeEach, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beoordeelPin, kiesPin, logIn, sessieGeldig, startBeheerSessie, type LeadLink } from './links'
import { MAX_BLOKKADES, MAX_POGINGEN, MAX_SESSIES_PER_PERSOON, controleCode, hashPin, tokenHash } from './pin'

type Rij = Record<string, unknown>
type Filter = (r: Rij) => boolean
const tabellen: Record<string, Rij[]> = {}

/** Minimale nabootsing van de supabase-querybuilder (select/insert/update/delete + filters). */
function bouwer(tabel: string) {
  let op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  let waarden: Rij | Rij[] = {}
  const filters: Filter[] = []
  let sorteer: { kolom: string; oplopend: boolean } | null = null
  let bereik: [number, number] | null = null
  let enkel = false
  const rijen = () => (tabellen[tabel] ??= [])
  const uitvoeren = () => {
    const raak = rijen().filter((r) => filters.every((f) => f(r)))
    if (op === 'insert') {
      rijen().push(...(Array.isArray(waarden) ? waarden : [waarden]).map((w) => ({ aangemaakt_op: new Date(2026, 0, 1).toISOString(), ...w })))
      return []
    }
    if (op === 'update') raak.forEach((r) => Object.assign(r, waarden))
    if (op === 'delete') tabellen[tabel] = rijen().filter((r) => !raak.includes(r))
    let uit = [...raak]
    if (sorteer) uit.sort((a, b) => String(a[sorteer!.kolom]).localeCompare(String(b[sorteer!.kolom])) * (sorteer!.oplopend ? 1 : -1))
    if (bereik) uit = uit.slice(bereik[0], bereik[1] + 1)
    return uit
  }
  const b = {
    select: () => b,
    insert: (w: Rij | Rij[]) => ((op = 'insert'), (waarden = w), b),
    update: (w: Rij) => ((op = 'update'), (waarden = w), b),
    delete: () => ((op = 'delete'), b),
    eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
    neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), b),
    lt: (k: string, v: string) => (filters.push((r) => String(r[k]) < v), b),
    in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), b),
    order: (k: string, o: { ascending: boolean }) => ((sorteer = { kolom: k, oplopend: o.ascending }), b),
    range: (van: number, tot: number) => ((bereik = [van, tot]), b),
    limit: () => b,
    maybeSingle: () => ((enkel = true), b),
    then: (ok: (v: { data: unknown; error: null }) => unknown) => {
      const uit = uitvoeren()
      return Promise.resolve(ok({ data: enkel ? (uit[0] ?? null) : uit, error: null }))
    },
  }
  return b
}
const admin = { from: bouwer } as unknown as SupabaseClient

const USER = 'u-1'
const JOEY = '22222222-2222-4222-8222-222222222222'
const KANE = '11111111-1111-4111-8111-111111111111'
const PIN = '482915'
const NU = new Date('2026-10-09T10:00:00Z')
const later = (dagen: number, uren = 0) => new Date(NU.getTime() + (dagen * 24 + uren) * 3_600_000)

const joey = (over: Partial<LeadLink> = {}): LeadLink => ({
  rol: 'pt', userId: USER, persoonId: JOEY, code: 'joey', naam: 'Joey', pinStatus: 'actief', pinHash: hashPin(PIN),
  mislukt: 0, geblokkeerdTot: null, blokkades: 0, ...over,
})
const kane = (): LeadLink => ({ ...joey(), rol: 'beheerder', persoonId: KANE, code: 'kane', naam: 'Kane', pinHash: null })
const linkRij = (l: LeadLink): Rij => ({
  rol: l.rol, user_id: l.userId, persoon_id: l.persoonId, code: l.code, actief: true, pin_hash: l.pinHash,
  pin_status: l.pinStatus, mislukt: l.mislukt, geblokkeerd_tot: l.geblokkeerdTot, blokkades: l.blokkades,
})
const rij = (persoonId: string) => tabellen.pt_lead_links.find((r) => r.persoon_id === persoonId)!
const sessies = (persoonId: string) => tabellen.pt_lead_sessies.filter((r) => r.persoon_id === persoonId)
/** Joey's link in een bepaalde staat — in de database én als geladen `LeadLink` (zoals `vindLink` 'm geeft). */
function joeyMet(over: Partial<LeadLink>): LeadLink {
  const l = joey(over)
  Object.assign(rij(JOEY), linkRij(l))
  return l
}

beforeEach(() => {
  tabellen.pt_lead_links = [linkRij(joey()), linkRij(kane())]
  tabellen.pt_lead_sessies = []
})

describe('logIn', () => {
  it('foute pin: telt op, zegt hoeveel er over zijn', async () => {
    expect(await logIn(admin, joey(), '000000', NU)).toEqual({ staat: 'fout', over: MAX_POGINGEN - 1 })
    expect(rij(JOEY).mislukt).toBe(1)
  })
  it('compare-and-set: een verloren race krijgt geen pincheck', async () => {
    rij(JOEY).mislukt = 3 // iemand anders was ons voor
    expect(await logIn(admin, joey({ mislukt: 2 }), PIN, NU)).toEqual({ staat: 'fout', over: 2 })
    expect(sessies(JOEY)).toHaveLength(0)
  })
  it('vijfde foute poging: eerste blokkade van 15 minuten, teller terug naar 0', async () => {
    const uit = await logIn(admin, joeyMet({ mislukt: MAX_POGINGEN - 1 }), '000000', NU)
    expect(uit).toEqual({ staat: 'geblokkeerd', totOp: new Date(NU.getTime() + 15 * 60_000).toISOString() })
    expect(rij(JOEY)).toMatchObject({ mislukt: 0, blokkades: 1 })
  })
  it('blokkades verdubbelen: de derde duurt een uur', async () => {
    const uit = await logIn(admin, joeyMet({ mislukt: MAX_POGINGEN - 1, blokkades: 2 }), '000000', NU)
    expect(uit).toEqual({ staat: 'geblokkeerd', totOp: new Date(NU.getTime() + 60 * 60_000).toISOString() })
    expect(rij(JOEY).blokkades).toBe(3)
  })
  it('na de laatste blokkade is de link dicht, ook met de goede pin', async () => {
    const uit = await logIn(admin, joeyMet({ mislukt: MAX_POGINGEN - 1, blokkades: MAX_BLOKKADES - 1 }), '000000', NU)
    expect(uit).toEqual({ staat: 'gesloten' })
    expect(rij(JOEY)).toMatchObject({ blokkades: MAX_BLOKKADES, geblokkeerd_tot: null })
    expect(await logIn(admin, joeyMet({ blokkades: MAX_BLOKKADES }), PIN, later(30))).toEqual({ staat: 'gesloten' })
    expect(sessies(JOEY)).toHaveLength(0)
  })
  it('tijdens een blokkade wordt de pin niet eens gecheckt', async () => {
    const tot = later(0, 1).toISOString()
    expect(await logIn(admin, joey({ geblokkeerdTot: tot }), PIN, NU)).toEqual({ staat: 'geblokkeerd', totOp: tot })
    expect(sessies(JOEY)).toHaveLength(0)
  })
  it('goede pin: sessie met alleen de hash, tellers schoon, 90 dagen geldig', async () => {
    const uit = await logIn(admin, joeyMet({ mislukt: 2, blokkades: 2 }), PIN, NU)
    if (uit.staat !== 'ok') throw new Error(`verwacht ok, kreeg ${uit.staat}`)
    expect(uit.verlooptOp).toEqual(later(90))
    expect(sessies(JOEY)).toEqual([expect.objectContaining({ token_hash: tokenHash(uit.token) })])
    expect(JSON.stringify(tabellen.pt_lead_sessies)).not.toContain(uit.token)
    expect(rij(JOEY)).toMatchObject({ mislukt: 0, blokkades: 0, geblokkeerd_tot: null })
  })
  it('meer dan 8 toestellen: het oudste wordt uitgelogd', async () => {
    for (let i = 0; i < MAX_SESSIES_PER_PERSOON + 2; i++) {
      const uit = await logIn(admin, joey(), PIN, later(i))
      expect(uit.staat).toBe('ok')
    }
    expect(sessies(JOEY)).toHaveLength(MAX_SESSIES_PER_PERSOON)
  })
  it('pin nog niet goedgekeurd → niet_actief; beheerderslink → geen_pincode', async () => {
    expect(await logIn(admin, joey({ pinStatus: 'wacht' }), PIN, NU)).toEqual({ staat: 'niet_actief' })
    expect(await logIn(admin, kane(), PIN, NU)).toEqual({ staat: 'geen_pincode' })
    expect(sessies(KANE)).toHaveLength(0)
  })
})

describe('kiesPin', () => {
  it('alleen zonder pin, nooit op een beheerderslink', async () => {
    expect(await kiesPin(admin, joey({ pinStatus: 'actief' }), PIN, NU)).toEqual({ staat: 'al_gekozen' })
    const gekozen = await kiesPin(admin, joeyMet({ pinStatus: 'geen', pinHash: null }), PIN, NU)
    expect(gekozen.staat).toBe('ok')
    expect(rij(JOEY).pin_status).toBe('wacht')
    // De controlecode hoort bij déze keuze: Kane ziet dezelfde, afgeleid van de opgeslagen hash.
    expect(gekozen.staat === 'ok' && gekozen.controle).toBe(controleCode(String(rij(JOEY).pin_hash)))
    rij(KANE).pin_status = 'geen'
    expect(await kiesPin(admin, { ...kane(), pinStatus: 'geen' }, PIN, NU)).toEqual({ staat: 'geen_pincode' })
    expect(rij(KANE)).toMatchObject({ pin_status: 'geen', pin_hash: null })
  })
})

describe('sessieGeldig', () => {
  async function ingelogd(nu = NU): Promise<string> {
    const uit = await logIn(admin, joey(), PIN, nu)
    if (uit.staat !== 'ok') throw new Error('verwacht ok')
    return uit.token
  }
  it('geldig token op de eigen link; niet op een andere link, niet met rommel', async () => {
    const token = await ingelogd()
    expect(await sessieGeldig(admin, joey(), token, later(1))).toBe(true)
    expect(await sessieGeldig(admin, kane(), token, later(1))).toBe(false)
    expect(await sessieGeldig(admin, joey(), 'x'.repeat(101), later(1))).toBe(false)
    expect(await sessieGeldig(admin, joey(), undefined, later(1))).toBe(false)
    expect(await sessieGeldig(admin, joey({ pinStatus: 'geen' }), token, later(1))).toBe(false)
  })
  it('hard verlopen na 90 dagen: rij verdwijnt', async () => {
    const token = await ingelogd()
    expect(await sessieGeldig(admin, joey(), token, later(90))).toBe(false)
    expect(sessies(JOEY)).toHaveLength(0)
  })
  it('zacht verlopen na 30 dagen niet gebruikt; gebruik binnen die tijd houdt \'m levend', async () => {
    const a = await ingelogd()
    expect(await sessieGeldig(admin, joey(), a, later(31))).toBe(false)
    const b = await ingelogd()
    expect(await sessieGeldig(admin, joey(), b, later(20))).toBe(true)
    expect(await sessieGeldig(admin, joey(), b, later(45))).toBe(true)
    expect(await sessieGeldig(admin, joey(), b, later(76))).toBe(false)
  })
  it('"laatst gebruikt" wordt hooguit één keer per uur bijgewerkt', async () => {
    const token = await ingelogd()
    const eerst = sessies(JOEY)[0].laatst_gebruikt_op
    await sessieGeldig(admin, joey(), token, later(0, 0.5))
    expect(sessies(JOEY)[0].laatst_gebruikt_op).toBe(eerst)
    await sessieGeldig(admin, joey(), token, later(0, 2))
    expect(sessies(JOEY)[0].laatst_gebruikt_op).toBe(later(0, 2).toISOString())
  })
})

describe('beoordeelPin', () => {
  it('goedkeuren alleen vanuit wacht; resetten wist pin, tellers én alle toestellen', async () => {
    expect(await beoordeelPin(admin, USER, JOEY, 'goedkeuren')).toBe('niet_gevonden')
    rij(JOEY).pin_status = 'wacht'
    expect(await beoordeelPin(admin, USER, JOEY, 'goedkeuren')).toBe('ok')
    expect(rij(JOEY).pin_status).toBe('actief')
    await logIn(admin, joey(), PIN, NU)
    rij(JOEY).blokkades = MAX_BLOKKADES
    expect(await beoordeelPin(admin, USER, JOEY, 'resetten')).toBe('ok')
    expect(rij(JOEY)).toMatchObject({ pin_status: 'geen', pin_hash: null, blokkades: 0 })
    expect(sessies(JOEY)).toHaveLength(0)
  })
  it('een beheerderslink valt er altijd buiten (ook voor Kane zelf)', async () => {
    expect(await beoordeelPin(admin, USER, KANE, 'resetten')).toBe('niet_gevonden')
    expect(await beoordeelPin(admin, USER, KANE, 'afwijzen')).toBe('niet_gevonden')
    expect(rij(KANE).pin_status).toBe('actief')
  })
  it('alleen binnen het eigen account', async () => {
    rij(JOEY).pin_status = 'wacht'
    expect(await beoordeelPin(admin, 'ander', JOEY, 'goedkeuren')).toBe('niet_gevonden')
  })
})

describe('startBeheerSessie', () => {
  it('sessie op de beheerderslink, alleen als die actief is', async () => {
    const s = await startBeheerSessie(admin, USER, NU)
    expect(s?.code).toBe('kane')
    expect(sessies(KANE)).toEqual([expect.objectContaining({ token_hash: tokenHash(s!.token) })])
    expect(await sessieGeldig(admin, kane(), s!.token, later(0, 11))).toBe(true)
    // Korter dan een PT-sessie: na 12 uur moet Kane via zijn hoofdaccount opnieuw binnenkomen.
    expect(await sessieGeldig(admin, kane(), s!.token, later(0, 13))).toBe(false)
    rij(KANE).pin_status = 'geen'
    expect(await startBeheerSessie(admin, USER, NU)).toBeNull()
    expect(await startBeheerSessie(admin, 'ander', NU)).toBeNull()
  })
})
