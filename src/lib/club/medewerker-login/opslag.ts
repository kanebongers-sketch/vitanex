// ─── Club: eigen login van medewerkers, opslag (SERVER-ONLY) ────────────────
// Pincode kiezen, inloggen (met bruteforce-rem), sessies, en het beheer door
// de eigenaar of clubmanager. Zelfde hashing en blokkaderegels als de PT-app en
// de beheerders (lifeos/leads/pin.ts). Beheerfuncties filteren altijd op de
// sportschool die nu open staat (user_id uit ClubToegang, nooit van de pagina).

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, controleCode, hashPin, nieuwSessieToken, pinKlopt, tokenHash } from '@/lib/lifeos/leads/pin'
import {
  MAX_MEDEWERKER_SESSIES, MEDEWERKER_CODE, MEDEWERKER_KOLOMMEN, MEDEWERKER_SESSIE_DAGEN, TOEGANG_KOLOMMEN,
  beoordeelMedewerkerSessie, magMedewerkerBinnen, medewerkerMetOrgUitRij, sessiePastBij, toegangUitRij,
  type LoginBeoordeling, type LoginOverzicht, type MedewerkerMetOrg, type MedewerkerSessieRij, type MedewerkerToegang,
} from './medewerker-login'

const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const
const PIN_LEEG = { pin_hash: null, pin_status: 'geen', pin_aangevraagd_op: null, ...TELLERS_SCHOON } as const

export interface MedewerkerMetToegang {
  toegang: MedewerkerToegang
  medewerker: MedewerkerMetOrg
}

async function haalMedewerker(admin: SupabaseClient, userId: string, id: string): Promise<MedewerkerMetOrg | null> {
  const { data, error } = await admin.from('club_medewerkers').select(MEDEWERKER_KOLOMMEN).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) console.error('[club] medewerker lezen mislukt', error.message)
  return error ? null : medewerkerMetOrgUitRij(data)
}

/** De link en medewerker achter een code, alleen als de link actief is en de medewerker in dienst. */
export async function vindMedewerkerLink(admin: SupabaseClient, code: string): Promise<MedewerkerMetToegang | null> {
  if (!MEDEWERKER_CODE.test(code)) return null
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('code', code).maybeSingle()
  if (error) {
    console.error('[club] medewerkerlink lezen mislukt', error.message)
    return null
  }
  const toegang = toegangUitRij(data)
  if (!toegang || !toegang.actief) return null
  const medewerker = await haalMedewerker(admin, toegang.userId, toegang.medewerkerId)
  return medewerker && medewerker.actief ? { toegang, medewerker } : null
}

// ─── Pincode kiezen ─────────────────────────────────────────────────────────

export type KiesUitkomst = { staat: 'ok'; controle: string } | { staat: 'al_gekozen' } | { staat: 'db' }

/** Alleen als er nog geen pin is (of na een reset). Daarna wacht hij op de eigenaar of clubmanager. */
export async function kiesMedewerkerPin(admin: SupabaseClient, t: MedewerkerToegang, pin: string, nu: Date): Promise<KiesUitkomst> {
  if (t.pinStatus !== 'geen') return { staat: 'al_gekozen' }
  const hash = hashPin(pin)
  const { data, error } = await admin
    .from('club_medewerker_toegang')
    .update({ pin_hash: hash, pin_status: 'wacht', pin_aangevraagd_op: nu.toISOString(), gewijzigd_op: nu.toISOString(), ...TELLERS_SCHOON })
    .eq('id', t.id)
    .eq('pin_status', 'geen')
    .eq('actief', true)
    .select('id')
  if (error) return { staat: 'db' }
  return Array.isArray(data) && data.length === 1 ? { staat: 'ok', controle: controleCode(hash) } : { staat: 'al_gekozen' }
}

// ─── Inloggen ───────────────────────────────────────────────────────────────

export type InlogUitkomst =
  | { staat: 'ok'; token: string; verlooptOp: Date }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'niet_actief' }
  | { staat: 'db' }

/** Pin controleren met dezelfde rem als bij beheerders: poging eerst reserveren, dan pas checken. */
export async function logInMedewerker(admin: SupabaseClient, t: MedewerkerToegang, pin: string, nu: Date): Promise<InlogUitkomst> {
  if (t.pinStatus !== 'actief') return { staat: 'niet_actief' }
  if (t.blokkades >= MAX_BLOKKADES) return { staat: 'gesloten' }
  if (t.geblokkeerdTot && new Date(t.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: t.geblokkeerdTot }

  const poging = t.mislukt + 1
  const { data: gereserveerd, error: resFout } = await admin
    .from('club_medewerker_toegang')
    .update({ mislukt: poging })
    .eq('id', t.id)
    .eq('mislukt', t.mislukt)
    .select('id')
  if (resFout) return { staat: 'db' }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }

  if (!pinKlopt(pin, t.pinHash)) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    return blokkeer(admin, t, nu)
  }

  const sessie = await maakSessie(admin, t, nu)
  if (!sessie) return { staat: 'db' }
  await admin.from('club_medewerker_toegang').update({ ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() }).eq('id', t.id)
  return { staat: 'ok', ...sessie }
}

async function blokkeer(admin: SupabaseClient, t: MedewerkerToegang, nu: Date): Promise<InlogUitkomst> {
  const blokkades = t.blokkades + 1
  const dicht = blokkades >= MAX_BLOKKADES
  const totOp = dicht ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin.from('club_medewerker_toegang').update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades }).eq('id', t.id)
  if (error) return { staat: 'db' }
  if (dicht) {
    // De link gaat dicht: ook elk toestel waar deze medewerker nog op ingelogd is (zoals bij leden).
    await wisSessiesVanMedewerker(admin, t.userId, t.medewerkerId)
    return { staat: 'gesloten' }
  }
  return { staat: 'geblokkeerd', totOp: totOp as string }
}

/** Alle sessies van een medewerker binnen zijn sportschool, ook die van een oudere link. */
async function wisSessiesVanMedewerker(admin: SupabaseClient, userId: string, medewerkerId: string): Promise<boolean> {
  const { error } = await admin.from('club_medewerker_sessies').delete().eq('user_id', userId).eq('medewerker_id', medewerkerId)
  if (error) console.error('[club] sessies van medewerker wissen mislukt', error.message)
  return !error
}

// ─── Sessies ────────────────────────────────────────────────────────────────

async function maakSessie(admin: SupabaseClient, t: MedewerkerToegang, nu: Date): Promise<{ token: string; verlooptOp: Date } | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + MEDEWERKER_SESSIE_DAGEN * 24 * 60 * 60 * 1000)
  const { error } = await admin.from('club_medewerker_sessies').insert({
    token_hash: tokenHash(token),
    toegang_id: t.id,
    medewerker_id: t.medewerkerId,
    user_id: t.userId,
    verloopt_op: verlooptOp.toISOString(),
    laatst_gebruikt_op: nu.toISOString(),
  })
  if (error) {
    console.error('[club] medewerkersessie maken mislukt', error.message)
    return null
  }
  await snoeiSessies(admin, t.id, nu)
  return { token, verlooptOp }
}

/** Verlopen sessies weg; daarna hooguit MAX_MEDEWERKER_SESSIES van de nieuwste. */
async function snoeiSessies(admin: SupabaseClient, toegangId: string, nu: Date): Promise<void> {
  await admin.from('club_medewerker_sessies').delete().eq('toegang_id', toegangId).lt('verloopt_op', nu.toISOString())
  const { data } = await admin
    .from('club_medewerker_sessies')
    .select('token_hash')
    .eq('toegang_id', toegangId)
    .order('aangemaakt_op', { ascending: false })
    .range(MAX_MEDEWERKER_SESSIES, MAX_MEDEWERKER_SESSIES + 99)
  const teVeel = (Array.isArray(data) ? (data as { token_hash: string }[]) : []).map((r) => r.token_hash)
  if (teVeel.length > 0) await admin.from('club_medewerker_sessies').delete().in('token_hash', teVeel)
}

/**
 * De medewerker achter een sessietoken, alleen als de sessie geldig is, bij
 * de huidige link hoort, en de medewerker nog in dienst is met een goedgekeurde pin.
 */
export async function medewerkerVanSessie(admin: SupabaseClient, token: string | undefined, nu: Date): Promise<MedewerkerMetToegang | null> {
  if (!token || token.length > 100) return null
  const hash = tokenHash(token)
  const { data: ruw } = await admin
    .from('club_medewerker_sessies')
    .select('toegang_id, medewerker_id, user_id, verloopt_op, laatst_gebruikt_op, aangemaakt_op')
    .eq('token_hash', hash)
    .maybeSingle()
  if (!ruw) return null
  const sessie = ruw as MedewerkerSessieRij
  const oordeel = beoordeelMedewerkerSessie(sessie, nu)
  if (oordeel === 'verlopen') {
    await admin.from('club_medewerker_sessies').delete().eq('token_hash', hash)
    return null
  }
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('id', sessie.toegang_id).maybeSingle()
  const toegang = error ? null : toegangUitRij(data)
  if (!toegang || !sessiePastBij(sessie, toegang)) return null
  const medewerker = await haalMedewerker(admin, toegang.userId, toegang.medewerkerId)
  if (!medewerker || !magMedewerkerBinnen(toegang, medewerker)) return null
  if (oordeel === 'aanraken') await admin.from('club_medewerker_sessies').update({ laatst_gebruikt_op: nu.toISOString() }).eq('token_hash', hash)
  return { toegang, medewerker }
}

/** Dit toestel uitloggen. False als het wissen mislukte. */
export async function logUitMedewerker(admin: SupabaseClient, token: string): Promise<boolean> {
  if (token.length > 100) return true
  const { error } = await admin.from('club_medewerker_sessies').delete().eq('token_hash', tokenHash(token))
  if (error) console.error('[club] medewerker uitloggen mislukt', error.message)
  return !error
}

// ─── Beheer door de eigenaar of clubmanager ─────────────────────────────────

export function nieuweMedewerkerCode(): string {
  return randomBytes(18).toString('base64url')
}

/** De inloglinks van een sportschool, per medewerker. Null bij een fout. */
export async function haalMedewerkerLogins(admin: SupabaseClient, userId: string): Promise<LoginOverzicht[] | null> {
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('user_id', userId)
  if (error) {
    console.error('[club] medewerkerlinks lezen mislukt', error.message)
    return null
  }
  return (data ?? [])
    .map(toegangUitRij)
    .filter((t): t is MedewerkerToegang => t !== null)
    .map((t) => ({ medewerkerId: t.medewerkerId, code: t.code, actief: t.actief, pinStatus: t.pinStatus, gesloten: t.blokkades >= MAX_BLOKKADES, laatstIngelogdOp: t.laatstIngelogdOp }))
}

export type BeheerUitkomst = 'ok' | 'niet_gevonden' | 'controle_fout' | 'db'

async function huidigeToegang(admin: SupabaseClient, userId: string, medewerkerId: string): Promise<MedewerkerToegang | null | 'db'> {
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('user_id', userId).eq('medewerker_id', medewerkerId).maybeSingle()
  return error ? 'db' : toegangUitRij(data)
}

/** Een nieuwe link, of de oude vervangen: nieuwe code, pincode weg, alle toestellen uit. */
async function maakLink(admin: SupabaseClient, userId: string, medewerkerId: string, nu: Date): Promise<BeheerUitkomst> {
  const m = await haalMedewerker(admin, userId, medewerkerId)
  if (!m || !m.actief) return 'niet_gevonden'
  const huidig = await huidigeToegang(admin, userId, medewerkerId)
  if (huidig === 'db') return 'db'
  const velden = { code: nieuweMedewerkerCode(), actief: true, ...PIN_LEEG, gewijzigd_op: nu.toISOString() }
  if (!huidig) {
    const { error } = await admin.from('club_medewerker_toegang').insert({ user_id: userId, medewerker_id: medewerkerId, ...velden })
    return error ? 'db' : 'ok'
  }
  const { error } = await admin.from('club_medewerker_toegang').update(velden).eq('id', huidig.id).eq('user_id', userId)
  if (error) return 'db'
  return wisSessies(admin, huidig.id)
}

async function wisSessies(admin: SupabaseClient, toegangId: string): Promise<BeheerUitkomst> {
  const { error } = await admin.from('club_medewerker_sessies').delete().eq('toegang_id', toegangId)
  return error ? 'db' : 'ok'
}

/**
 * De eigenaar of clubmanager beheert de link van een medewerker: maken (of
 * opnieuw maken), een gekozen pin goedkeuren (alleen met de controlecode en
 * gebonden aan precies die pin) of afwijzen, resetten, of intrekken. Afwijzen,
 * resetten en intrekken loggen alle toestellen uit. Altijd binnen de eigen sportschool.
 */
export async function beheerMedewerkerLogin(admin: SupabaseClient, userId: string, medewerkerId: string, { actie, controle }: LoginBeoordeling, nu: Date): Promise<BeheerUitkomst> {
  if (actie === 'maken') return maakLink(admin, userId, medewerkerId, nu)
  const huidig = await huidigeToegang(admin, userId, medewerkerId)
  if (huidig === 'db') return 'db'
  if (!huidig || !huidig.actief) return 'niet_gevonden'
  const basis = admin.from('club_medewerker_toegang')
  let query
  if (actie === 'goedkeuren') {
    if (huidig.pinStatus !== 'wacht' || !huidig.pinHash) return 'niet_gevonden'
    if (controle === null || controleCode(huidig.pinHash) !== controle) return 'controle_fout'
    query = basis.update({ pin_status: 'actief', gewijzigd_op: nu.toISOString(), ...TELLERS_SCHOON }).eq('pin_status', 'wacht').eq('pin_hash', huidig.pinHash)
  } else if (actie === 'afwijzen') {
    query = basis.update({ ...PIN_LEEG, gewijzigd_op: nu.toISOString() }).eq('pin_status', 'wacht')
  } else {
    query = basis.update({ ...PIN_LEEG, actief: actie !== 'intrekken', gewijzigd_op: nu.toISOString() })
  }
  const { data, error } = await query.eq('id', huidig.id).eq('user_id', userId).select('id')
  if (error) return 'db'
  if (!Array.isArray(data) || data.length !== 1) return 'niet_gevonden'
  return actie === 'goedkeuren' ? 'ok' : wisSessies(admin, huidig.id)
}
