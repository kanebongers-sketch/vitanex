// ─── Club, ledenlogin: opslag (SERVER-ONLY) ─────────────────────────────────
// Een uitnodiging gebruiken (e-mailadres bevestigen en wachtwoord kiezen),
// inloggen met e-mail en wachtwoord (met bruteforce-rem in de database),
// sessies, en het beheer van de uitnodiging vanaf de ledenkaart. Dezelfde
// wachtwoord-hashing als de beheerders (kern/wachtwoord.ts) en dezelfde
// blokkaderegels als de pincodes (kern/pin.ts). Elke query filtert op de
// sportschool (user_id); die komt altijd van de server, nooit van de pagina.

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, nieuwSessieToken, tokenHash } from '@/lib/club/kern/pin'
import { hashWachtwoord, normaalEmail, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import {
  LID_CODE, LID_SESSIE_DAGEN, LID_TOEGANG_KOLOMMEN, MAX_LID_SESSIES, beoordeelLidSessie, kanInloggen, linkBruikbaar, linkOverzicht, lidToegangUitRij,
  sessiePastBij, sessieToegestaan, type LidLinkOverzicht, type LidSessieRij, type LidToegangRij,
} from './regels'

const TABEL = 'club_lid_toegang'
const SESSIES = 'club_lid_sessies'
const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const
/** Postgres: unieke index geschonden (e-mailadres al in gebruik binnen de sportschool). */
const UNIEK = '23505'
/** Hooguit zoveel accounts met hetzelfde adres worden bij inloggen bekeken. */
export const MAX_KANDIDATEN = 5

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/ledenlogin] ${wat} mislukt`, fout.message)
}

/** De toegang achter een uitnodiging. Onbekend of ingetrokken: null (zelfde antwoord). */
export async function vindLidToegang(admin: SupabaseClient, code: string): Promise<LidToegangRij | null> {
  if (!LID_CODE.test(code)) return null
  const { data, error } = await admin.from(TABEL).select(LID_TOEGANG_KOLOMMEN).eq('code', code).maybeSingle()
  log('toegang lezen', error)
  const t = error ? null : lidToegangUitRij(data)
  return t && t.actief ? t : null
}

export type Sessie = { token: string; verlooptOp: Date }

// ─── Uitnodiging gebruiken: e-mailadres bevestigen en wachtwoord kiezen ─────

export type ActiveerUitkomst = { staat: 'ok'; sessie: Sessie } | { staat: 'email_bezet' } | { staat: 'ongeldig' } | { staat: 'db' }

/**
 * Met een bruikbare uitnodiging een e-mailadres en wachtwoord vastleggen (de
 * eerste keer, of opnieuw na "wachtwoord vergeten"). De compare-and-set op de
 * code en code_gebruikt_op maakt de link eenmalig, ook als twee toestellen
 * tegelijk proberen. Een oude pincode verdwijnt, alle toestellen worden
 * uitgelogd en dit toestel is meteen ingelogd. De route controleert vooraf de
 * sterkte van het wachtwoord en of het lid de app mag gebruiken.
 */
export async function activeerLid(admin: SupabaseClient, t: LidToegangRij, email: string, wachtwoord: string, nu: Date): Promise<ActiveerUitkomst> {
  if (!linkBruikbaar(t, nu) || normaalEmail(email) !== email) return { staat: 'ongeldig' }
  const tijd = nu.toISOString()
  const { data, error } = await admin
    .from(TABEL)
    .update({
      email, wachtwoord_hash: await hashWachtwoord(wachtwoord), wachtwoord_gekozen_op: tijd, code_gebruikt_op: tijd,
      pin_hash: null, ...TELLERS_SCHOON, laatst_ingelogd_op: tijd, gewijzigd_op: tijd,
    })
    .eq('id', t.id)
    .eq('user_id', t.userId)
    .eq('code', t.code)
    .eq('actief', true)
    .is('code_gebruikt_op', null)
    .select('id')
  if (error) {
    if (error.code === UNIEK) return { staat: 'email_bezet' }
    log('wachtwoord kiezen', error)
    return { staat: 'db' }
  }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'ongeldig' }
  if (!(await wisSessies(admin, t.userId, t.lidId))) return { staat: 'db' }
  const sessie = await maakSessie(admin, t, nu)
  return sessie ? { staat: 'ok', sessie } : { staat: 'db' }
}

export type InAppUitkomst = { staat: 'ok' } | { staat: 'al_gekozen' } | { staat: 'email_bezet' } | { staat: 'db' }

/**
 * Een lid dat nog met een oude pincode-sessie binnen is, kiest in de app een
 * e-mailadres en wachtwoord. Alleen zolang er nog geen wachtwoord is; de
 * huidige sessie blijft, de pincode verdwijnt.
 */
export async function kiesWachtwoordInApp(admin: SupabaseClient, t: LidToegangRij, email: string, wachtwoord: string, nu: Date): Promise<InAppUitkomst> {
  if (t.wachtwoordHash) return { staat: 'al_gekozen' }
  if (normaalEmail(email) !== email) return { staat: 'db' }
  const tijd = nu.toISOString()
  const { data, error } = await admin
    .from(TABEL)
    .update({ email, wachtwoord_hash: await hashWachtwoord(wachtwoord), wachtwoord_gekozen_op: tijd, pin_hash: null, gewijzigd_op: tijd })
    .eq('id', t.id)
    .eq('user_id', t.userId)
    .eq('lid_id', t.lidId)
    .eq('actief', true)
    .is('wachtwoord_hash', null)
    .select('id')
  if (error) {
    if (error.code === UNIEK) return { staat: 'email_bezet' }
    log('wachtwoord kiezen in de app', error)
    return { staat: 'db' }
  }
  return Array.isArray(data) && data.length === 1 ? { staat: 'ok' } : { staat: 'al_gekozen' }
}

// ─── Inloggen met e-mail en wachtwoord ──────────────────────────────────────

/**
 * De accounts met dit e-mailadres die kunnen inloggen; met `sportschool` alleen
 * die van die sportschool. Hooguit MAX_KANDIDATEN. Een leesfout: geen.
 */
export async function vindInlogKandidaten(admin: SupabaseClient, ruw: unknown, sportschool: string | null): Promise<LidToegangRij[]> {
  const email = normaalEmail(ruw)
  if (!email) return []
  let vraag = admin.from(TABEL).select(LID_TOEGANG_KOLOMMEN).eq('email', email).eq('actief', true).not('wachtwoord_hash', 'is', null)
  if (sportschool) vraag = vraag.eq('user_id', sportschool)
  const { data, error } = await vraag.order('user_id').limit(MAX_KANDIDATEN)
  log('accounts op e-mail lezen', error)
  if (error || !Array.isArray(data)) return []
  return data.map(lidToegangUitRij).filter((t): t is LidToegangRij => t !== null && t.email === email && kanInloggen(t))
}

export type ControleUitkomst =
  | { staat: 'goed' }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'dicht' }
  | { staat: 'db' }

/**
 * Het wachtwoord van een account controleren, met de rem in de database: na
 * MAX_POGINGEN (5) fouten een blokkade van 15 minuten die elke keer verdubbelt;
 * na MAX_BLOKKADES gaat het account dicht en worden alle toestellen uitgelogd
 * (weer open met een nieuwe uitnodiging). Goed: de tellers terug naar nul. De
 * route remt daarnaast per IP en per e-mailadres.
 */
export async function controleerWachtwoord(admin: SupabaseClient, t: LidToegangRij, wachtwoord: string, nu: Date): Promise<ControleUitkomst> {
  if (!kanInloggen(t)) return { staat: 'dicht' }
  if (t.geblokkeerdTot && new Date(t.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: t.geblokkeerdTot }

  // Eerst een poging reserveren (compare-and-set op de teller), dan pas het
  // wachtwoord checken: parallelle verzoeken kunnen zo niet allemaal "poging 1" zijn.
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

  if (!(await wachtwoordKlopt(wachtwoord, t.wachtwoordHash))) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    return blokkeer(admin, t, nu)
  }
  const { error } = await admin.from(TABEL).update({ ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() }).eq('id', t.id).eq('user_id', t.userId)
  log('tellers wissen', error)
  return { staat: 'goed' }
}

async function blokkeer(admin: SupabaseClient, t: LidToegangRij, nu: Date): Promise<ControleUitkomst> {
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
    return { staat: 'dicht' }
  }
  return { staat: 'geblokkeerd', totOp: totOp as string }
}

// ─── Sessies ────────────────────────────────────────────────────────────────

/** Een nieuwe sessie voor dit toestel (na een goede controle of een gebruikte uitnodiging). */
export async function maakSessie(admin: SupabaseClient, t: LidToegangRij, nu: Date): Promise<Sessie | null> {
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
 * toegang, dit lid en deze sportschool hoort, en het account nog actief is
 * (met een wachtwoord, of nog een oude pincode). Anders null.
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
  if (!toegang || !sessiePastBij(sessie, toegang) || !sessieToegestaan(toegang)) return null
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

// ─── Beheer vanaf de ledenkaart en uitnodigingen ────────────────────────────

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

/** Hoe staat de ledenapp van dit lid ervoor? undefined bij een leesfout. */
export async function haalLinkOverzicht(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LidLinkOverzicht | undefined> {
  const t = await haalToegangVanLid(admin, userId, lidId)
  if (t === undefined) return undefined
  if (!t || !t.actief) return linkOverzicht(t, 0, nu)
  const { count, error } = await admin.from(SESSIES).select('token_hash', { count: 'exact', head: true }).eq('user_id', userId).eq('toegang_id', t.id).gt('verloopt_op', nu.toISOString())
  log('toestellen tellen', error)
  return linkOverzicht(t, count ?? 0, nu)
}

/**
 * Opnieuw beginnen voor dit lid (de knop "Nieuwe link" op de ledenkaart): een
 * nieuwe uitnodiging, het wachtwoord en een oude pincode gewist en alle
 * toestellen uitgelogd. Het lid kiest met de nieuwe link een nieuw wachtwoord.
 * Het lid moet al bij deze sportschool horen (dat controleert de route).
 */
export async function maakLidLink(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<boolean> {
  const bestaand = await haalToegangVanLid(admin, userId, lidId)
  if (bestaand === undefined) return false
  const velden = {
    code: nieuweLidCode(), code_gemaakt_op: nu.toISOString(), code_gebruikt_op: null, actief: true,
    wachtwoord_hash: null, wachtwoord_gekozen_op: null, pin_hash: null, pin_gekozen_op: null, ...TELLERS_SCHOON, gewijzigd_op: nu.toISOString(),
  }
  const { error } = bestaand
    ? await admin.from(TABEL).update(velden).eq('id', bestaand.id).eq('user_id', userId).eq('lid_id', lidId)
    : await admin.from(TABEL).insert({ ...velden, user_id: userId, lid_id: lidId })
  if (error) {
    log('link maken', error)
    return false
  }
  return wisSessies(admin, userId, lidId)
}

/** De toegang intrekken: geen uitnodiging, geen inloggen meer en alle toestellen uitgelogd. */
export async function trekLidLinkIn(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<boolean> {
  const { error } = await admin
    .from(TABEL)
    .update({ actief: false, wachtwoord_hash: null, pin_hash: null, ...TELLERS_SCHOON, gewijzigd_op: nu.toISOString() })
    .eq('user_id', userId)
    .eq('lid_id', lidId)
  if (error) {
    log('link intrekken', error)
    return false
  }
  return wisSessies(admin, userId, lidId)
}

export type UitnodigingCode = { staat: 'ok'; code: string } | { staat: 'ingetrokken' } | { staat: 'db' }

/**
 * Een werkende uitnodigingscode voor de mail (uitnodiging of zelf aangevraagd,
 * ook bij "wachtwoord vergeten"). Werkt de huidige nog, dan die; anders een
 * nieuwe code. Raakt nooit het wachtwoord of de sessies: wie een link aanvraagt
 * voor andermans adres, kan dat account zo niet dichtzetten of uitloggen. Een
 * ingetrokken toegang krijgt geen uitnodiging.
 */
export async function geefUitnodigingCode(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<UitnodigingCode> {
  const bestaand = await haalToegangVanLid(admin, userId, lidId)
  if (bestaand === undefined) return { staat: 'db' }
  if (bestaand && !bestaand.actief) return { staat: 'ingetrokken' }
  if (bestaand && linkBruikbaar(bestaand, nu)) return { staat: 'ok', code: bestaand.code }
  const code = nieuweLidCode()
  const velden = { code, code_gemaakt_op: nu.toISOString(), code_gebruikt_op: null, gewijzigd_op: nu.toISOString() }
  const { error } = bestaand
    ? await admin.from(TABEL).update(velden).eq('id', bestaand.id).eq('user_id', userId).eq('lid_id', lidId).eq('actief', true)
    : await admin.from(TABEL).insert({ ...velden, actief: true, user_id: userId, lid_id: lidId })
  if (error) {
    log('uitnodiging maken', error)
    return { staat: 'db' }
  }
  return { staat: 'ok', code }
}
