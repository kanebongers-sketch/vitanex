// ─── Club, ledenlogin: opslag (SERVER-ONLY) ─────────────────────────────────
// Pincode kiezen, inloggen (met bruteforce-rem in de database), sessies, en het
// beheer van de link vanaf de ledenkaart. Dezelfde hashing en blokkaderegels
// als de beheerders en de PT-app (lifeos/leads/pin.ts). Elke query filtert op
// de sportschool (user_id); die komt altijd van de server, nooit van de pagina.

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, hashPin, nieuwSessieToken, pinKlopt, tokenHash } from '@/lib/club/kern/pin'
import {
  LID_CODE, LID_SESSIE_DAGEN, LID_TOEGANG_KOLOMMEN, MAX_LID_SESSIES, beoordeelLidSessie, linkOverzicht, linkStaat, lidToegangUitRij, sessiePastBij,
  type LidLinkOverzicht, type LidSessieRij, type LidToegangRij,
} from './regels'

const TABEL = 'club_lid_toegang'
const SESSIES = 'club_lid_sessies'
const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/ledenlogin] ${wat} mislukt`, fout.message)
}

/** De toegang achter een link. Onbekend, ingetrokken of ongeldig: null (zelfde antwoord). */
export async function vindLidToegang(admin: SupabaseClient, code: string): Promise<LidToegangRij | null> {
  if (!LID_CODE.test(code)) return null
  const { data, error } = await admin.from(TABEL).select(LID_TOEGANG_KOLOMMEN).eq('code', code).maybeSingle()
  log('toegang lezen', error)
  const t = error ? null : lidToegangUitRij(data)
  return t && t.actief ? t : null
}

export type Sessie = { token: string; verlooptOp: Date }

// ─── Pincode kiezen ─────────────────────────────────────────────────────────

export type KiesUitkomst = { staat: 'ok'; sessie: Sessie } | { staat: 'al_gekozen' } | { staat: 'ongeldig' } | { staat: 'db' }

/**
 * Een pincode kiezen kan alleen op een verse link zonder pincode. De compare-
 * and-set op pin_hash is null voorkomt dat twee toestellen tegelijk kiezen.
 * Daarna is dit toestel meteen ingelogd.
 */
export async function kiesLidPin(admin: SupabaseClient, t: LidToegangRij, pin: string, nu: Date): Promise<KiesUitkomst> {
  const staat = linkStaat(t, nu)
  if (staat === 'inloggen') return { staat: 'al_gekozen' }
  if (staat === 'ongeldig') return { staat: 'ongeldig' }
  const { data, error } = await admin
    .from(TABEL)
    .update({ pin_hash: hashPin(pin), pin_gekozen_op: nu.toISOString(), ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString(), gewijzigd_op: nu.toISOString() })
    .eq('id', t.id)
    .eq('user_id', t.userId)
    .eq('code', t.code)
    .eq('actief', true)
    .is('pin_hash', null)
    .select('id')
  if (error) {
    log('pincode kiezen', error)
    return { staat: 'db' }
  }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'al_gekozen' }
  const sessie = await maakSessie(admin, t, nu)
  return sessie ? { staat: 'ok', sessie } : { staat: 'db' }
}

// ─── Inloggen ───────────────────────────────────────────────────────────────

export type InlogUitkomst =
  | { staat: 'ok'; sessie: Sessie }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'ongeldig' }
  | { staat: 'db' }

/**
 * Pincode controleren. Na MAX_POGINGEN (5) fouten een blokkade van 15 minuten
 * die elke keer verdubbelt; na MAX_BLOKKADES gaat de link dicht tot de
 * sportschool een nieuwe maakt. De route remt daarnaast per IP.
 */
export async function logInLid(admin: SupabaseClient, t: LidToegangRij, pin: string, nu: Date): Promise<InlogUitkomst> {
  if (linkStaat(t, nu) !== 'inloggen') return { staat: 'ongeldig' }
  if (t.geblokkeerdTot && new Date(t.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: t.geblokkeerdTot }

  // Eerst een poging reserveren (compare-and-set op de teller), dan pas de pin
  // checken: parallelle verzoeken kunnen zo niet allemaal "poging 1" zijn.
  const poging = t.mislukt + 1
  const { data: gereserveerd, error: resFout } = await admin
    .from(TABEL)
    .update({ mislukt: poging })
    .eq('id', t.id)
    .eq('user_id', t.userId)
    .eq('mislukt', t.mislukt)
    .select('id')
  if (resFout) {
    log('poging reserveren', resFout)
    return { staat: 'db' }
  }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }

  if (!pinKlopt(pin, t.pinHash)) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    return blokkeer(admin, t, nu)
  }
  const sessie = await maakSessie(admin, t, nu)
  if (!sessie) return { staat: 'db' }
  const { error } = await admin.from(TABEL).update({ ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() }).eq('id', t.id).eq('user_id', t.userId)
  log('tellers wissen', error)
  return { staat: 'ok', sessie }
}

async function blokkeer(admin: SupabaseClient, t: LidToegangRij, nu: Date): Promise<InlogUitkomst> {
  const blokkades = t.blokkades + 1
  const dicht = blokkades >= MAX_BLOKKADES
  const totOp = dicht ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin.from(TABEL).update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades }).eq('id', t.id).eq('user_id', t.userId)
  if (error) {
    log('blokkeren', error)
    return { staat: 'db' }
  }
  if (dicht) {
    await wisSessies(admin, t.userId, t.lidId)
    return { staat: 'ongeldig' }
  }
  return { staat: 'geblokkeerd', totOp: totOp as string }
}

// ─── Sessies ────────────────────────────────────────────────────────────────

async function maakSessie(admin: SupabaseClient, t: LidToegangRij, nu: Date): Promise<Sessie | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + LID_SESSIE_DAGEN * 24 * 60 * 60 * 1000)
  const { error } = await admin.from(SESSIES).insert({
    token_hash: tokenHash(token),
    toegang_id: t.id,
    user_id: t.userId,
    lid_id: t.lidId,
    verloopt_op: verlooptOp.toISOString(),
    laatst_gebruikt_op: nu.toISOString(),
  })
  if (error) {
    log('sessie maken', error)
    return null
  }
  await snoeiSessies(admin, t, nu)
  return { token, verlooptOp }
}

/** Verlopen sessies weg; daarna hooguit MAX_LID_SESSIES van de nieuwste. */
async function snoeiSessies(admin: SupabaseClient, t: LidToegangRij, nu: Date): Promise<void> {
  await admin.from(SESSIES).delete().eq('toegang_id', t.id).eq('user_id', t.userId).lt('verloopt_op', nu.toISOString())
  const { data } = await admin
    .from(SESSIES)
    .select('token_hash')
    .eq('toegang_id', t.id)
    .eq('user_id', t.userId)
    .order('aangemaakt_op', { ascending: false })
    .range(MAX_LID_SESSIES, MAX_LID_SESSIES + 99)
  const teVeel = (Array.isArray(data) ? (data as { token_hash: string }[]) : []).map((r) => r.token_hash)
  if (teVeel.length > 0) await admin.from(SESSIES).delete().eq('user_id', t.userId).in('token_hash', teVeel)
}

export interface LidSessie {
  toegang: LidToegangRij
  /** De sha256 van het token, voor "dit toestel uitloggen". */
  tokenHash: string
}

/**
 * De toegang achter een sessietoken, alleen als de sessie geldig is, bij deze
 * toegang, dit lid en deze sportschool hoort, en de link nog actief is met een
 * pincode. Anders null.
 */
export async function lidVanSessie(admin: SupabaseClient, token: string | undefined, nu: Date): Promise<LidSessie | null> {
  if (!token || token.length > 100) return null
  const hash = tokenHash(token)
  const { data: ruw, error } = await admin
    .from(SESSIES)
    .select('toegang_id, user_id, lid_id, verloopt_op, laatst_gebruikt_op, aangemaakt_op')
    .eq('token_hash', hash)
    .maybeSingle()
  log('sessie lezen', error)
  if (error || !ruw) return null
  const sessie = ruw as LidSessieRij
  const oordeel = beoordeelLidSessie(sessie, nu)
  if (oordeel === 'verlopen') {
    await admin.from(SESSIES).delete().eq('token_hash', hash)
    return null
  }
  const { data, error: tFout } = await admin.from(TABEL).select(LID_TOEGANG_KOLOMMEN).eq('id', sessie.toegang_id).eq('user_id', sessie.user_id).maybeSingle()
  log('toegang lezen', tFout)
  const toegang = tFout ? null : lidToegangUitRij(data)
  if (!toegang || !sessiePastBij(sessie, toegang) || linkStaat(toegang, nu) !== 'inloggen') return null
  if (oordeel === 'aanraken') await admin.from(SESSIES).update({ laatst_gebruikt_op: nu.toISOString() }).eq('token_hash', hash)
  return { toegang, tokenHash: hash }
}

/** Dit toestel uitloggen. False als het wissen in de database mislukte. */
export async function logUitLid(admin: SupabaseClient, token: string): Promise<boolean> {
  if (token.length > 100) return true
  const { error } = await admin.from(SESSIES).delete().eq('token_hash', tokenHash(token))
  log('uitloggen', error)
  return !error
}

/** Alle toestellen van dit lid uitloggen. */
export async function wisSessies(admin: SupabaseClient, userId: string, lidId: string): Promise<boolean> {
  const { error } = await admin.from(SESSIES).delete().eq('user_id', userId).eq('lid_id', lidId)
  log('sessies wissen', error)
  return !error
}

// ─── Beheer vanaf de ledenkaart ─────────────────────────────────────────────

export function nieuweLidCode(): string {
  return randomBytes(18).toString('base64url')
}

async function haalToegangVanLid(admin: SupabaseClient, userId: string, lidId: string): Promise<LidToegangRij | null | undefined> {
  const { data, error } = await admin.from(TABEL).select(LID_TOEGANG_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    log('toegang van lid lezen', error)
    return undefined
  }
  return lidToegangUitRij(data)
}

/** Hoe staat de link van dit lid ervoor? undefined bij een leesfout. */
export async function haalLinkOverzicht(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LidLinkOverzicht | undefined> {
  const t = await haalToegangVanLid(admin, userId, lidId)
  if (t === undefined) return undefined
  if (!t || !t.actief) return linkOverzicht(t, 0, nu)
  const { count, error } = await admin.from(SESSIES).select('token_hash', { count: 'exact', head: true }).eq('user_id', userId).eq('toegang_id', t.id).gt('verloopt_op', nu.toISOString())
  log('toestellen tellen', error)
  return linkOverzicht(t, count ?? 0, nu)
}

/**
 * Een nieuwe link voor dit lid. Bestond er al een, dan wordt die ongeldig: een
 * nieuwe code, de pincode gewist en alle toestellen uitgelogd. Het lid moet al
 * bij deze sportschool horen (dat controleert de route).
 */
export async function maakLidLink(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<boolean> {
  const bestaand = await haalToegangVanLid(admin, userId, lidId)
  if (bestaand === undefined) return false
  const velden = { code: nieuweLidCode(), code_gemaakt_op: nu.toISOString(), actief: true, pin_hash: null, pin_gekozen_op: null, ...TELLERS_SCHOON, gewijzigd_op: nu.toISOString() }
  const { error } = bestaand
    ? await admin.from(TABEL).update(velden).eq('id', bestaand.id).eq('user_id', userId).eq('lid_id', lidId)
    : await admin.from(TABEL).insert({ ...velden, user_id: userId, lid_id: lidId })
  if (error) {
    log('link maken', error)
    return false
  }
  return wisSessies(admin, userId, lidId)
}

/** De link intrekken: niet meer bruikbaar en alle toestellen uitgelogd. */
export async function trekLidLinkIn(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<boolean> {
  const { error } = await admin.from(TABEL).update({ actief: false, pin_hash: null, ...TELLERS_SCHOON, gewijzigd_op: nu.toISOString() }).eq('user_id', userId).eq('lid_id', lidId)
  if (error) {
    log('link intrekken', error)
    return false
  }
  return wisSessies(admin, userId, lidId)
}
