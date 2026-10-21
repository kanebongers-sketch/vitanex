// ─── AI Your Gym: inlog van de platform-eigenaar, opslag (SERVER-ONLY) ──────
// Link opzoeken (alleen via de sha256 van de code), pincode kiezen (een keer,
// binnen 24 uur), inloggen met een rem in drie lagen, sessies. Zelfde hashing
// en blokkaderegels als de andere inlogs van AI Your Gym (kern/pin.ts).

import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, hashPin, nieuwSessieToken, pinKlopt, tokenHash } from '@/lib/club/kern/pin'
import {
  MAX_PLATFORM_SESSIES, PLATFORM_CODE, PLATFORM_KOLOMMEN, PLATFORM_SESSIE_DAGEN, beoordeelPlatformSessie, linkStand, platformAccountUitRij,
  type PlatformAccount, type PlatformSessieRij,
} from './platform'

const TABEL = 'club_platform_accounts'
const SESSIES = 'club_platform_sessies'
const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const

/** Het account achter een link, alleen als het actief is. */
export async function vindPlatformAccount(admin: SupabaseClient, code: string): Promise<PlatformAccount | null> {
  if (!PLATFORM_CODE.test(code)) return null
  const { data, error } = await admin.from(TABEL).select(PLATFORM_KOLOMMEN).eq('link_hash', tokenHash(code)).maybeSingle()
  if (error) {
    console.error('[club] platform-account lezen mislukt', error.code ?? '')
    return null
  }
  const a = platformAccountUitRij(data)
  return a && a.actief ? a : null
}

// ─── Sessies ────────────────────────────────────────────────────────────────

export interface NieuweSessie {
  token: string
  verlooptOp: Date
}

/** Verlopen sessies weg; daarna hooguit MAX_PLATFORM_SESSIES van de nieuwste. */
async function snoeiSessies(admin: SupabaseClient, accountId: string, nu: Date): Promise<void> {
  await admin.from(SESSIES).delete().eq('account_id', accountId).lt('verloopt_op', nu.toISOString())
  const { data } = await admin
    .from(SESSIES)
    .select('token_hash')
    .eq('account_id', accountId)
    .order('aangemaakt_op', { ascending: false })
    .range(MAX_PLATFORM_SESSIES, MAX_PLATFORM_SESSIES + 99)
  const teVeel = (Array.isArray(data) ? (data as { token_hash: string }[]) : []).map((r) => r.token_hash)
  if (teVeel.length > 0) await admin.from(SESSIES).delete().in('token_hash', teVeel)
}

async function maakSessie(admin: SupabaseClient, accountId: string, nu: Date): Promise<NieuweSessie | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + PLATFORM_SESSIE_DAGEN * 24 * 60 * 60 * 1000)
  const { error } = await admin.from(SESSIES).insert({
    token_hash: tokenHash(token),
    account_id: accountId,
    verloopt_op: verlooptOp.toISOString(),
    laatst_gebruikt_op: nu.toISOString(),
  })
  if (error) {
    console.error('[club] platform-sessie maken mislukt', error.code ?? '')
    return null
  }
  await snoeiSessies(admin, accountId, nu)
  return { token, verlooptOp }
}

// ─── Pincode kiezen (een keer, met de startlink) ────────────────────────────

export type KiesUitkomst = ({ staat: 'ok' } & NieuweSessie) | { staat: 'niet_mogelijk' } | { staat: 'db' }

/**
 * De pincode kiezen kan alleen zolang er geen is en de link nog binnen 24 uur
 * is (compare-and-set: twee verzoeken tegelijk kunnen er niet allebei een
 * zetten). Daarna meteen ingelogd op dit toestel.
 */
export async function kiesPlatformPin(admin: SupabaseClient, a: PlatformAccount, pin: string, nu: Date): Promise<KiesUitkomst> {
  if (linkStand(a, nu) !== 'kiezen') return { staat: 'niet_mogelijk' }
  const { data, error } = await admin
    .from(TABEL)
    .update({ pin_hash: hashPin(pin), link_kiezen_tot: null, ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() })
    .eq('id', a.id)
    .eq('actief', true)
    .is('pin_hash', null)
    .gt('link_kiezen_tot', nu.toISOString())
    .select('id')
  if (error) return { staat: 'db' }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'niet_mogelijk' }
  const sessie = await maakSessie(admin, a.id, nu)
  return sessie ? { staat: 'ok', ...sessie } : { staat: 'db' }
}

// ─── Inloggen ───────────────────────────────────────────────────────────────

export type InlogUitkomst =
  | ({ staat: 'ok' } & NieuweSessie)
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'geen_pin' }
  | { staat: 'db' }

async function blokkeer(admin: SupabaseClient, a: PlatformAccount, nu: Date): Promise<InlogUitkomst> {
  const blokkades = a.blokkades + 1
  const gesloten = blokkades >= MAX_BLOKKADES
  const totOp = gesloten ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin.from(TABEL).update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades }).eq('id', a.id)
  if (error) return { staat: 'db' }
  return totOp ? { staat: 'geblokkeerd', totOp } : { staat: 'gesloten' }
}

/**
 * Pin controleren; goed: een nieuwe sessie voor dit toestel. Rem in drie lagen:
 * na MAX_POGINGEN fouten een blokkade die elke keer verdubbelt, na MAX_BLOKKADES
 * dicht tot er een nieuwe link komt (SQL), en de route remt daarnaast per IP.
 */
export async function logInPlatform(admin: SupabaseClient, a: PlatformAccount, pin: string, nu: Date): Promise<InlogUitkomst> {
  if (!a.pinHash) return { staat: 'geen_pin' }
  if (a.blokkades >= MAX_BLOKKADES) return { staat: 'gesloten' }
  if (a.geblokkeerdTot && new Date(a.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: a.geblokkeerdTot }

  // Eerst een poging reserveren (compare-and-set op de teller), dan pas de pin checken.
  const poging = a.mislukt + 1
  const { data: gereserveerd, error: resFout } = await admin.from(TABEL).update({ mislukt: poging }).eq('id', a.id).eq('mislukt', a.mislukt).select('id')
  if (resFout) return { staat: 'db' }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }

  if (!pinKlopt(pin, a.pinHash)) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    return blokkeer(admin, a, nu)
  }

  const sessie = await maakSessie(admin, a.id, nu)
  if (!sessie) return { staat: 'db' }
  await admin.from(TABEL).update({ ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() }).eq('id', a.id)
  return { staat: 'ok', ...sessie }
}

/**
 * Het account achter een sessietoken, alleen als de sessie geldig is en het
 * account actief is met een pincode. Anders null.
 */
export async function platformVanSessie(admin: SupabaseClient, token: string | undefined, nu: Date): Promise<PlatformAccount | null> {
  if (!token || token.length > 100) return null
  const hash = tokenHash(token)
  const { data: sessie } = await admin.from(SESSIES).select('account_id, verloopt_op, laatst_gebruikt_op, aangemaakt_op').eq('token_hash', hash).maybeSingle()
  if (!sessie) return null
  const oordeel = beoordeelPlatformSessie(sessie as PlatformSessieRij, nu)
  if (oordeel === 'verlopen') {
    await admin.from(SESSIES).delete().eq('token_hash', hash)
    return null
  }
  const { data, error } = await admin.from(TABEL).select(PLATFORM_KOLOMMEN).eq('id', (sessie as PlatformSessieRij).account_id).maybeSingle()
  const a = error ? null : platformAccountUitRij(data)
  if (!a || !a.actief || !a.pinHash) return null
  if (oordeel === 'aanraken') await admin.from(SESSIES).update({ laatst_gebruikt_op: nu.toISOString() }).eq('token_hash', hash)
  return a
}

/** Dit toestel uitloggen: de sessie verdwijnt uit de database. False als dat mislukte. */
export async function logUitPlatform(admin: SupabaseClient, token: string): Promise<boolean> {
  if (token.length > 100) return true
  const { error } = await admin.from(SESSIES).delete().eq('token_hash', tokenHash(token))
  if (error) console.error('[club] platform uitloggen mislukt', error.code ?? '')
  return !error
}
