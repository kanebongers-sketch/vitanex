// ─── Club: eigen login van medewerkers, opslag (SERVER-ONLY) ────────────────
// Uitnodigen, wachtwoord kiezen, inloggen met e-mailadres en wachtwoord (met
// bruteforce-rem), sessies, en het beheer door de eigenaar of clubmanager.
// Zelfde wachtwoordopslag (kern/wachtwoord.ts) en blokkaderegels (kern/pin.ts)
// als de beheerders. Beheerfuncties filteren altijd op de sportschool die nu
// open staat (user_id uit ClubToegang, nooit van de pagina).

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, nieuwSessieToken, tokenHash } from '@/lib/club/kern/pin'
import { hashWachtwoord, normaalEmail, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import {
  MAX_MEDEWERKER_SESSIES, MEDEWERKER_KOLOMMEN, MEDEWERKER_SESSIE_DAGEN, TOEGANG_KOLOMMEN, UITNODIGING_DAGEN, UITNODIGING_TOKEN,
  beoordeelMedewerkerSessie, loginStaat, magMedewerkerBinnen, medewerkerMetOrgUitRij, sessiePastBij, toegangUitRij,
  type LoginBeoordeling, type LoginOverzicht, type MedewerkerMetOrg, type MedewerkerSessieRij, type MedewerkerToegang,
} from './medewerker-login'

const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const
const PIN_LEEG = { pin_hash: null, pin_status: 'geen', pin_aangevraagd_op: null } as const
const UITNODIGING_LEEG = { uitnodiging_hash: null, uitnodiging_verloopt_op: null } as const
const DAG_MS = 24 * 60 * 60 * 1000

export interface MedewerkerMetToegang {
  toegang: MedewerkerToegang
  medewerker: MedewerkerMetOrg
}

type Sessie = { token: string; verlooptOp: Date }

function isUniekFout(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

async function haalMedewerker(admin: SupabaseClient, userId: string, id: string): Promise<MedewerkerMetOrg | null> {
  const { data, error } = await admin.from('club_medewerkers').select(MEDEWERKER_KOLOMMEN).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) console.error('[club] medewerker lezen mislukt', error.message)
  return error ? null : medewerkerMetOrgUitRij(data)
}

/** Login plus medewerker, alleen als de login actief is en de medewerker in dienst. */
async function metMedewerker(admin: SupabaseClient, rij: unknown): Promise<MedewerkerMetToegang | null> {
  const toegang = toegangUitRij(rij)
  if (!toegang || !toegang.actief) return null
  const medewerker = await haalMedewerker(admin, toegang.userId, toegang.medewerkerId)
  return medewerker && medewerker.actief ? { toegang, medewerker } : null
}

// ─── Uitnodiging aannemen: wachtwoord kiezen ────────────────────────────────

/** De login achter een uitnodigingslink, alleen als die nog geldig is en de medewerker in dienst. */
export async function vindUitnodiging(admin: SupabaseClient, token: string, nu: Date): Promise<MedewerkerMetToegang | null> {
  if (!UITNODIGING_TOKEN.test(token)) return null
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('uitnodiging_hash', tokenHash(token)).maybeSingle()
  if (error) {
    console.error('[club] uitnodiging lezen mislukt', error.message)
    return null
  }
  const gevonden = await metMedewerker(admin, data)
  if (!gevonden?.toegang.email) return null
  const tot = gevonden.toegang.uitnodigingVerlooptOp
  return tot && new Date(tot).getTime() > nu.getTime() ? gevonden : null
}

export type KiesUitkomst = ({ staat: 'ok' } & Sessie) | { staat: 'email_bezet' } | { staat: 'verlopen' } | { staat: 'db' }

/**
 * De medewerker kiest zijn wachtwoord (de route controleert of het sterk is).
 * Eenmalig: alleen zolang precies deze uitnodiging nog openstaat. De oude
 * pincode vervalt; daarna meteen een sessie voor dit toestel.
 */
export async function kiesWachtwoord(admin: SupabaseClient, { toegang: t }: MedewerkerMetToegang, token: string, wachtwoord: string, nu: Date): Promise<KiesUitkomst> {
  if (!t.email) return { staat: 'verlopen' }
  // Een e-mailadres hoort bij precies een account: een beheerder met dit adres gaat voor.
  if (await vindBeheerderOpEmail(admin, t.email)) return { staat: 'email_bezet' }
  const { data, error } = await admin
    .from('club_medewerker_toegang')
    .update({ wachtwoord_hash: hashWachtwoord(wachtwoord), ...UITNODIGING_LEEG, ...PIN_LEEG, ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString(), gewijzigd_op: nu.toISOString() })
    .eq('id', t.id)
    .eq('uitnodiging_hash', tokenHash(token))
    .eq('actief', true)
    .gt('uitnodiging_verloopt_op', nu.toISOString())
    .select('id')
  if (isUniekFout(error)) return { staat: 'email_bezet' }
  if (error) return { staat: 'db' }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'verlopen' }
  const sessie = await maakSessie(admin, t, nu)
  return sessie ? { staat: 'ok', ...sessie } : { staat: 'db' }
}

// ─── Inloggen met e-mailadres en wachtwoord ─────────────────────────────────

/** De actieve medewerkerlogin met dit e-mailadres en een wachtwoord, of null. */
export async function vindMedewerkerOpEmail(admin: SupabaseClient, ruw: unknown): Promise<MedewerkerMetToegang | null> {
  const email = normaalEmail(ruw)
  if (!email) return null
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('email', email).eq('actief', true).not('wachtwoord_hash', 'is', null).limit(2)
  if (error) {
    console.error('[club] medewerker op e-mail lezen mislukt', error.message)
    return null
  }
  const rijen = Array.isArray(data) ? data : []
  return rijen.length === 1 ? metMedewerker(admin, rijen[0]) : null
}

export type InlogUitkomst =
  | ({ staat: 'ok' } & Sessie)
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'niet_actief' }
  | { staat: 'db' }

/**
 * Wachtwoord controleren met dezelfde rem als bij beheerders: eerst een poging
 * reserveren (compare-and-set op de teller), dan pas checken. Na MAX_POGINGEN
 * fouten een blokkade die elke keer verdubbelt, na MAX_BLOKKADES dicht tot
 * een nieuwe uitnodiging. De route remt daarnaast per IP.
 */
export async function logInMedewerkerMetWachtwoord(admin: SupabaseClient, { toegang: t, medewerker }: MedewerkerMetToegang, wachtwoord: string, nu: Date): Promise<InlogUitkomst> {
  if (!t.wachtwoordHash || !magMedewerkerBinnen(t, medewerker)) return { staat: 'niet_actief' }
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

  if (!wachtwoordKlopt(wachtwoord, t.wachtwoordHash)) {
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
    // De login gaat dicht: ook elk toestel waar deze medewerker nog op ingelogd is (zoals bij leden).
    await wisSessiesVanMedewerker(admin, t.userId, t.medewerkerId)
    return { staat: 'gesloten' }
  }
  return { staat: 'geblokkeerd', totOp: totOp as string }
}

/** Alle sessies van een medewerker binnen zijn sportschool, ook die van een oudere login. */
async function wisSessiesVanMedewerker(admin: SupabaseClient, userId: string, medewerkerId: string): Promise<boolean> {
  const { error } = await admin.from('club_medewerker_sessies').delete().eq('user_id', userId).eq('medewerker_id', medewerkerId)
  if (error) console.error('[club] sessies van medewerker wissen mislukt', error.message)
  return !error
}

// ─── Sessies ────────────────────────────────────────────────────────────────

async function maakSessie(admin: SupabaseClient, t: MedewerkerToegang, nu: Date): Promise<Sessie | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + MEDEWERKER_SESSIE_DAGEN * DAG_MS)
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
 * de huidige login hoort, en de medewerker nog in dienst is met een wachtwoord
 * (of nog de oude goedgekeurde pincode).
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

export function nieuweUitnodigingToken(): string {
  return randomBytes(32).toString('base64url')
}

/** De logins van een sportschool, per medewerker. Null bij een fout. */
export async function haalMedewerkerLogins(admin: SupabaseClient, userId: string, nu: Date = new Date()): Promise<LoginOverzicht[] | null> {
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('user_id', userId)
  if (error) {
    console.error('[club] medewerkerlogins lezen mislukt', error.message)
    return null
  }
  return (data ?? [])
    .map(toegangUitRij)
    .filter((t): t is MedewerkerToegang => t !== null)
    .map((t) => {
      const staat = loginStaat(t, nu)
      return {
        medewerkerId: t.medewerkerId,
        email: t.actief ? t.email : null,
        staat,
        gesloten: staat !== 'geen' && t.blokkades >= MAX_BLOKKADES,
        uitnodigingTot: staat === 'uitgenodigd' || staat === 'verlopen' ? t.uitnodigingVerlooptOp : null,
        laatstIngelogdOp: t.laatstIngelogdOp,
      }
    })
}

export type BeheerUitkomst = { staat: 'ok'; token: string | null } | { staat: 'niet_gevonden' } | { staat: 'email_bezet' } | { staat: 'db' }

async function huidigeToegang(admin: SupabaseClient, userId: string, medewerkerId: string): Promise<MedewerkerToegang | null | 'db'> {
  const { data, error } = await admin.from('club_medewerker_toegang').select(TOEGANG_KOLOMMEN).eq('user_id', userId).eq('medewerker_id', medewerkerId).maybeSingle()
  return error ? 'db' : toegangUitRij(data)
}

/** Hoort dit adres al bij een ander account (een beheerder, of een andere medewerkerlogin met wachtwoord)? */
async function emailBijAnder(admin: SupabaseClient, email: string, eigenToegangId: string | null): Promise<boolean | 'db'> {
  if (await vindBeheerderOpEmail(admin, email)) return true
  const { data, error } = await admin.from('club_medewerker_toegang').select('id').eq('email', email).eq('actief', true).not('wachtwoord_hash', 'is', null).limit(2)
  if (error) return 'db'
  return (Array.isArray(data) ? (data as { id: unknown }[]) : []).some((r) => r.id !== eigenToegangId)
}

/**
 * Een (nieuwe) uitnodiging: nieuw eenmalig token, UITNODIGING_DAGEN geldig. De
 * vorige uitnodiging vervalt en een dichtgelopen login gaat weer open. Een
 * bestaand wachtwoord en de toestellen blijven tot de medewerker een nieuw
 * wachtwoord kiest; intrekken is daarvoor de knop.
 */
async function nodigUit(admin: SupabaseClient, userId: string, medewerkerId: string, email: string, nu: Date): Promise<BeheerUitkomst> {
  const m = await haalMedewerker(admin, userId, medewerkerId)
  if (!m || !m.actief) return { staat: 'niet_gevonden' }
  const huidig = await huidigeToegang(admin, userId, medewerkerId)
  if (huidig === 'db') return { staat: 'db' }
  const bezet = await emailBijAnder(admin, email, huidig?.actief ? huidig.id : null)
  if (bezet === 'db') return { staat: 'db' }
  if (bezet) return { staat: 'email_bezet' }

  const token = nieuweUitnodigingToken()
  const velden = {
    email,
    actief: true,
    uitnodiging_hash: tokenHash(token),
    uitnodiging_verloopt_op: new Date(nu.getTime() + UITNODIGING_DAGEN * DAG_MS).toISOString(),
    ...TELLERS_SCHOON,
    gewijzigd_op: nu.toISOString(),
  }
  const { error } = huidig
    ? await admin.from('club_medewerker_toegang').update(huidig.actief ? velden : { ...velden, wachtwoord_hash: null, ...PIN_LEEG }).eq('id', huidig.id).eq('user_id', userId)
    : await admin.from('club_medewerker_toegang').insert({ user_id: userId, medewerker_id: medewerkerId, code: nieuweMedewerkerCode(), ...velden })
  if (isUniekFout(error)) return { staat: 'email_bezet' }
  return error ? { staat: 'db' } : { staat: 'ok', token }
}

/** Intrekken: inloggen kan niet meer, e-mailadres, wachtwoord en uitnodiging weg, alle toestellen uit. */
async function trekIn(admin: SupabaseClient, userId: string, medewerkerId: string, nu: Date): Promise<BeheerUitkomst> {
  const huidig = await huidigeToegang(admin, userId, medewerkerId)
  if (huidig === 'db') return { staat: 'db' }
  if (!huidig || !huidig.actief) return { staat: 'niet_gevonden' }
  const { data, error } = await admin
    .from('club_medewerker_toegang')
    .update({ actief: false, email: null, wachtwoord_hash: null, ...UITNODIGING_LEEG, ...PIN_LEEG, ...TELLERS_SCHOON, gewijzigd_op: nu.toISOString() })
    .eq('id', huidig.id)
    .eq('user_id', userId)
    .select('id')
  if (error) return { staat: 'db' }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'niet_gevonden' }
  return (await wisSessiesVanMedewerker(admin, userId, medewerkerId)) ? { staat: 'ok', token: null } : { staat: 'db' }
}

/** De eigenaar of clubmanager nodigt een medewerker uit of trekt zijn login in. Altijd binnen de eigen sportschool. */
export async function beheerMedewerkerLogin(admin: SupabaseClient, userId: string, medewerkerId: string, actie: LoginBeoordeling, nu: Date): Promise<BeheerUitkomst> {
  return actie.actie === 'uitnodigen' ? nodigUit(admin, userId, medewerkerId, actie.email, nu) : trekIn(admin, userId, medewerkerId, nu)
}
