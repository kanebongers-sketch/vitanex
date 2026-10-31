// ─── AI Your Gym: tweestapsverificatie, opslag (SERVER-ONLY) ────────────────
// Instellen (geheim versleuteld bewaren, bevestigen met een code, tien
// herstelcodes), een code controleren met een eigen rem (zelfde blokkaderegels
// als de inlogs, kern/pin.ts), uitzetten, en de wachtstap tussen wachtwoord en
// code. Nu alleen voor het platform-account (master account); de tabel heeft al
// kolommen voor andere soorten accounts (migratie 484).
// Geheimen, codes en hashes komen nooit in een log of in de browser.

import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, nieuwSessieToken, tokenHash } from '@/lib/club/kern/pin'
import {
  base32Codeer, controleerTotp, herstelHash, leesHerstelcode, leesTotpCode, nieuweHerstelcodes, nieuwGeheim,
} from './totp'
import { ontsleutelGeheim, versleutelGeheim, type AccountSleutel } from './versleutelen'

const TABEL = 'club_tweestaps'
const WACHT = 'club_tweestaps_wacht'
const KOLOMMEN = 'id, aan, geheim, bevestigd_op, herstel_hashes, laatste_stap, mislukt, geblokkeerd_tot, blokkades'
const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const

/** Zo lang mag de stap tussen goed wachtwoord en code duren. */
export const WACHT_MINUTEN = 5

export interface TweestapsRij {
  id: string
  aan: boolean
  /** SERVER-ONLY: versleuteld geheim. */
  geheim: string
  bevestigdOp: string | null
  herstelHashes: string[]
  laatsteStap: number | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
}

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

/** Systeemgrens: een databaserij naar een TweestapsRij, of null. */
export function tweestapsUitRij(rij: unknown): TweestapsRij | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.geheim !== 'string') return null
  const stap = typeof r.laatste_stap === 'number' ? r.laatste_stap : typeof r.laatste_stap === 'string' && /^\d+$/.test(r.laatste_stap) ? Number(r.laatste_stap) : null
  return {
    id: r.id,
    aan: r.aan === true,
    geheim: r.geheim,
    bevestigdOp: typeof r.bevestigd_op === 'string' ? r.bevestigd_op : null,
    herstelHashes: Array.isArray(r.herstel_hashes) ? r.herstel_hashes.filter((h): h is string => typeof h === 'string') : [],
    laatsteStap: stap,
    mislukt: getal(r.mislukt),
    geblokkeerdTot: typeof r.geblokkeerd_tot === 'string' ? r.geblokkeerd_tot : null,
    blokkades: getal(r.blokkades),
  }
}

/** De tabel bestaat nog niet (migratie 484 niet uitgevoerd). */
function geenTabel(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function platform(id: string): AccountSleutel {
  return { soort: 'platform', id }
}

export type Lezing = { staat: 'ok'; rij: TweestapsRij | null } | { staat: 'geen_tabel' } | { staat: 'db' }

/** De tweestapsrij van een platform-account (null = nooit ingesteld). */
export async function leesPlatformTweestaps(admin: SupabaseClient, accountId: string): Promise<Lezing> {
  const { data, error } = await admin.from(TABEL).select(KOLOMMEN).eq('platform_account_id', accountId).maybeSingle()
  if (geenTabel(error)) return { staat: 'geen_tabel' }
  if (error) {
    console.error('[club] tweestaps lezen mislukt', error.code ?? '')
    return { staat: 'db' }
  }
  return { staat: 'ok', rij: tweestapsUitRij(data) }
}

/**
 * Bij het inloggen: moet er een tweede stap volgen? Zonder migratie 484 (geen
 * tabel) staat het uit, zodat inloggen blijft werken. Een andere leesfout:
 * 'db' (dan geen sessie, liever dicht dan open).
 */
export async function tweestapsNodig(admin: SupabaseClient, accountId: string): Promise<'aan' | 'uit' | 'db'> {
  const l = await leesPlatformTweestaps(admin, accountId)
  if (l.staat === 'geen_tabel') return 'uit'
  if (l.staat === 'db') return 'db'
  return l.rij?.aan ? 'aan' : 'uit'
}

// ─── Instellen ──────────────────────────────────────────────────────────────

export type StartUitkomst = { staat: 'ok'; geheim: string } | { staat: 'al_aan' } | { staat: 'geen_tabel' } | { staat: 'db' }

/**
 * Een nieuw geheim (nog niet aan). Opnieuw beginnen maakt een nieuw geheim; de
 * vorige QR-code werkt dan niet meer. Kan niet als het al aan staat (eerst uitzetten).
 */
export async function beginInstellen(admin: SupabaseClient, accountId: string, sleutel: Uint8Array): Promise<StartUitkomst> {
  const l = await leesPlatformTweestaps(admin, accountId)
  if (l.staat !== 'ok') return l
  if (l.rij?.aan) return { staat: 'al_aan' }
  const geheim = nieuwGeheim()
  const rij = {
    account_soort: 'platform',
    platform_account_id: accountId,
    geheim: versleutelGeheim(geheim, sleutel, platform(accountId)),
    aan: false,
    bevestigd_op: null,
    herstel_hashes: [],
    laatste_stap: null,
    ...TELLERS_SCHOON,
    bijgewerkt_op: new Date().toISOString(),
  }
  const { error } = l.rij
    ? await admin.from(TABEL).update(rij).eq('id', l.rij.id).eq('platform_account_id', accountId).eq('aan', false)
    : await admin.from(TABEL).insert(rij)
  if (error) {
    console.error('[club] tweestaps instellen mislukt', error.code ?? '')
    return { staat: 'db' }
  }
  return { staat: 'ok', geheim: base32Codeer(geheim) }
}

// ─── Een code controleren (met rem) ─────────────────────────────────────────

export type CodeUitkomst =
  | { staat: 'ok'; herstel: boolean; herstelOver: number }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'geen_sleutel' }
  | { staat: 'db' }

async function blokkeer(admin: SupabaseClient, rij: TweestapsRij, nu: Date): Promise<CodeUitkomst> {
  const blokkades = rij.blokkades + 1
  const gesloten = blokkades >= MAX_BLOKKADES
  const totOp = gesloten ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin.from(TABEL).update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades }).eq('id', rij.id)
  if (error) return { staat: 'db' }
  return totOp ? { staat: 'geblokkeerd', totOp } : { staat: 'gesloten' }
}

/** Een code uit de app: klopt hij en is de stap nieuw, dan wordt de stap vastgelegd (een code werkt maar een keer). */
async function probeerTotp(admin: SupabaseClient, rij: TweestapsRij, geheim: Uint8Array, invoer: unknown, nu: Date, extra: Record<string, unknown>): Promise<boolean | 'db'> {
  const code = leesTotpCode(invoer)
  const stap = code ? controleerTotp(geheim, code, nu.getTime(), rij.laatsteStap) : null
  if (stap === null) return false
  let q = admin.from(TABEL).update({ ...extra, laatste_stap: stap, ...TELLERS_SCHOON, bijgewerkt_op: nu.toISOString() }).eq('id', rij.id)
  q = rij.laatsteStap === null ? q.is('laatste_stap', null) : q.eq('laatste_stap', rij.laatsteStap)
  const { data, error } = await q.select('id')
  if (error) return 'db'
  return Array.isArray(data) && data.length === 1
}

/** Een herstelcode: klopt hij, dan verdwijnt hij uit de lijst (compare-and-set op de lijst). */
async function probeerHerstel(admin: SupabaseClient, rij: TweestapsRij, invoer: unknown, nu: Date): Promise<number | null | 'db'> {
  const code = leesHerstelcode(invoer)
  const hash = code ? herstelHash(code) : null
  if (!hash || !rij.herstelHashes.includes(hash)) return null
  const over = rij.herstelHashes.filter((h) => h !== hash)
  const { data, error } = await admin
    .from(TABEL)
    .update({ herstel_hashes: over, ...TELLERS_SCHOON, bijgewerkt_op: nu.toISOString() })
    .eq('id', rij.id)
    .contains('herstel_hashes', [hash])
    .select('id')
  if (error) return 'db'
  return Array.isArray(data) && data.length === 1 ? over.length : null
}

/**
 * Een code van de app of een herstelcode controleren, met een rem: eerst een
 * poging reserveren (compare-and-set op de teller), na MAX_POGINGEN fouten een
 * blokkade die elke keer verdubbelt, na MAX_BLOKKADES dicht (noodherstel met de
 * SQL-functie club_platform_tweestaps_uit). Alleen voor een rij die aan staat.
 */
export async function controleerCode(admin: SupabaseClient, accountId: string, rij: TweestapsRij, invoer: unknown, sleutel: Uint8Array | null, nu: Date): Promise<CodeUitkomst> {
  if (!sleutel) return { staat: 'geen_sleutel' }
  if (rij.blokkades >= MAX_BLOKKADES) return { staat: 'gesloten' }
  if (rij.geblokkeerdTot && new Date(rij.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: rij.geblokkeerdTot }
  const geheim = ontsleutelGeheim(rij.geheim, sleutel, platform(accountId))
  if (!geheim) return { staat: 'geen_sleutel' }

  const poging = rij.mislukt + 1
  const { data: gereserveerd, error } = await admin.from(TABEL).update({ mislukt: poging }).eq('id', rij.id).eq('mislukt', rij.mislukt).select('id')
  if (error) return { staat: 'db' }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }
  const bijgewerkt = { ...rij, mislukt: poging }

  const totp = await probeerTotp(admin, bijgewerkt, geheim, invoer, nu, {})
  if (totp === 'db') return { staat: 'db' }
  if (totp) return { staat: 'ok', herstel: false, herstelOver: rij.herstelHashes.length }
  const herstel = await probeerHerstel(admin, bijgewerkt, invoer, nu)
  if (herstel === 'db') return { staat: 'db' }
  if (herstel !== null) return { staat: 'ok', herstel: true, herstelOver: herstel }

  return poging < MAX_POGINGEN ? { staat: 'fout', over: MAX_POGINGEN - poging } : blokkeer(admin, bijgewerkt, nu)
}

export type BevestigUitkomst = { staat: 'ok'; herstelcodes: string[] } | { staat: 'niet_bezig' } | Exclude<CodeUitkomst, { staat: 'ok' }>

/**
 * Het instellen afronden met een code uit de app. Goed: aan, met tien nieuwe
 * herstelcodes (alleen gehasht bewaard; de codes zelf gaan een keer terug).
 * Een fout telt mee voor de rem, net als bij het inloggen.
 */
export async function bevestigInstellen(admin: SupabaseClient, accountId: string, invoer: unknown, sleutel: Uint8Array | null, nu: Date): Promise<BevestigUitkomst> {
  if (!sleutel) return { staat: 'geen_sleutel' }
  const l = await leesPlatformTweestaps(admin, accountId)
  if (l.staat === 'geen_tabel') return { staat: 'niet_bezig' }
  if (l.staat === 'db') return { staat: 'db' }
  const rij = l.rij
  if (!rij || rij.aan) return { staat: 'niet_bezig' }
  if (rij.geblokkeerdTot && new Date(rij.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: rij.geblokkeerdTot }
  const geheim = ontsleutelGeheim(rij.geheim, sleutel, platform(accountId))
  if (!geheim) return { staat: 'geen_sleutel' }

  const herstelcodes = nieuweHerstelcodes()
  const extra = { aan: true, bevestigd_op: nu.toISOString(), herstel_hashes: herstelcodes.map(herstelHash) }
  const goed = await probeerTotp(admin, rij, geheim, invoer, nu, extra)
  if (goed === 'db') return { staat: 'db' }
  if (goed) return { staat: 'ok', herstelcodes }
  const poging = rij.mislukt + 1
  if (poging >= MAX_POGINGEN) {
    const b = await blokkeer(admin, rij, nu)
    return b.staat === 'ok' ? { staat: 'db' } : b
  }
  const { error } = await admin.from(TABEL).update({ mislukt: poging }).eq('id', rij.id).eq('mislukt', rij.mislukt)
  return error ? { staat: 'db' } : { staat: 'fout', over: MAX_POGINGEN - poging }
}

export type UitzetUitkomst = { staat: 'ok' } | { staat: 'niet_aan' } | Exclude<CodeUitkomst, { staat: 'ok' }>

/** Uitzetten kan alleen met een geldige code (app of herstelcode). Daarna is de rij weg. */
export async function zetTweestapsUit(admin: SupabaseClient, accountId: string, invoer: unknown, sleutel: Uint8Array | null, nu: Date): Promise<UitzetUitkomst> {
  const l = await leesPlatformTweestaps(admin, accountId)
  if (l.staat === 'geen_tabel') return { staat: 'niet_aan' }
  if (l.staat === 'db') return { staat: 'db' }
  if (!l.rij?.aan) return { staat: 'niet_aan' }
  const uit = await controleerCode(admin, accountId, l.rij, invoer, sleutel, nu)
  if (uit.staat !== 'ok') return uit
  const { error } = await admin.from(TABEL).delete().eq('id', l.rij.id).eq('platform_account_id', accountId)
  if (error) return { staat: 'db' }
  await admin.from(WACHT).delete().eq('platform_account_id', accountId)
  return { staat: 'ok' }
}

// ─── De wachtstap tussen wachtwoord en code ─────────────────────────────────

export interface Wacht {
  token: string
  verlooptOp: Date
}

/** Na een goed wachtwoord: een wachttoken (vijf minuten). Een eerdere wachtstap van dit account vervalt. */
export async function maakWacht(admin: SupabaseClient, accountId: string, nu: Date): Promise<Wacht | null> {
  await admin.from(WACHT).delete().eq('platform_account_id', accountId)
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + WACHT_MINUTEN * 60_000)
  const { error } = await admin.from(WACHT).insert({ token_hash: tokenHash(token), account_soort: 'platform', platform_account_id: accountId, verloopt_op: verlooptOp.toISOString() })
  if (error) {
    console.error('[club] tweestaps wachtstap maken mislukt', error.code ?? '')
    return null
  }
  return { token, verlooptOp }
}

/** Het platform-account achter een wachttoken, of null (onbekend of verlopen; verlopen wordt meteen gewist). */
export async function vindWacht(admin: SupabaseClient, token: string | undefined, nu: Date): Promise<string | null> {
  if (!token || token.length > 100) return null
  const hash = tokenHash(token)
  const { data, error } = await admin.from(WACHT).select('platform_account_id, verloopt_op').eq('token_hash', hash).maybeSingle()
  if (error || !data) return null
  const r = data as { platform_account_id: unknown; verloopt_op: unknown }
  const tot = typeof r.verloopt_op === 'string' ? new Date(r.verloopt_op).getTime() : Number.NaN
  if (!Number.isFinite(tot) || tot <= nu.getTime() || typeof r.platform_account_id !== 'string') {
    await admin.from(WACHT).delete().eq('token_hash', hash)
    return null
  }
  return r.platform_account_id
}

/** De wachtstap is klaar (of afgebroken). */
export async function verwijderWacht(admin: SupabaseClient, token: string): Promise<void> {
  if (token.length > 100) return
  const { error } = await admin.from(WACHT).delete().eq('token_hash', tokenHash(token))
  if (error) console.error('[club] tweestaps wachtstap wissen mislukt', error.code ?? '')
}
