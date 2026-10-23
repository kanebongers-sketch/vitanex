// ─── Club: beheerders van een sportschool, opslag (SERVER-ONLY) ─────────────
// Uitnodiging (een keer een wachtwoord kiezen), inloggen met e-mailadres en
// wachtwoord (met bruteforce-rem), sessies, en het beheer door Kane of de
// eigenaar. Sinds 23-10-2026 geen pincode meer (besluit Kane).
// Kane-functies filteren altijd op de organisatie die nu open staat; die komt
// van de server (ClubToegang), nooit van de pagina.

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normaalEmail, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { MAX_BLOKKADES, MAX_POGINGEN, blokkadeDuurMin, nieuwSessieToken, tokenHash } from '@/lib/club/kern/pin'
import {
  BEHEERDER_CODE, BEHEERDER_KOLOMMEN, BEHEERDER_SESSIE_DAGEN, MAX_BEHEERDER_SESSIES, beheerderUitRij, beoordeelBeheerderSessie, magBinnen,
  type Beheerder, type BeheerderOverzicht, type Beoordeling, type BeheerderSessieRij, type NieuweBeheerder,
} from './beheerder'

const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const

/** De beheerder achter een link, alleen als die actief is. */
export async function vindBeheerder(admin: SupabaseClient, code: string): Promise<Beheerder | null> {
  if (!BEHEERDER_CODE.test(code)) return null
  const { data, error } = await admin.from('club_beheerders').select(BEHEERDER_KOLOMMEN).eq('code', code).maybeSingle()
  if (error) {
    console.error('[club] beheerder lezen mislukt', error.message)
    return null
  }
  const b = beheerderUitRij(data)
  return b && b.actief ? b : null
}

// ─── Inloggen ───────────────────────────────────────────────────────────────

export type InlogUitkomst =
  | { staat: 'ok'; token: string; verlooptOp: Date }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'niet_actief' }
  | { staat: 'db' }

/** Inloggen op aiyourgym.com met e-mailadres en wachtwoord; dezelfde rem als de pincode. */
export async function logInMetWachtwoord(admin: SupabaseClient, b: Beheerder, wachtwoord: string, nu: Date): Promise<InlogUitkomst> {
  if (!b.actief || !b.wachtwoordHash) return { staat: 'niet_actief' }
  return controleerEnStart(admin, b, () => wachtwoordKlopt(wachtwoord, b.wachtwoordHash), nu)
}

/** De actieve beheerder met dit e-mailadres en een wachtwoord, of null. */
export async function vindBeheerderOpEmail(admin: SupabaseClient, ruw: unknown): Promise<Beheerder | null> {
  const email = normaalEmail(ruw)
  if (!email) return null
  const { data, error } = await admin.from('club_beheerders').select(BEHEERDER_KOLOMMEN).eq('email', email).eq('actief', true).not('wachtwoord_hash', 'is', null).limit(2)
  if (error) {
    console.error('[club] beheerder op e-mail lezen mislukt', error.message)
    return null
  }
  const rijen = (data ?? []).map(beheerderUitRij).filter((b): b is Beheerder => b !== null && b.email?.toLowerCase() === email)
  return rijen.length === 1 ? rijen[0] : null
}

/** Een sessie zonder pin- of wachtwoordcontrole: alleen direct na een geslaagde aanmelding. */
export async function startSessie(admin: SupabaseClient, b: Beheerder, nu: Date): Promise<{ token: string; verlooptOp: Date } | null> {
  if (!magBinnen(b)) return null
  const sessie = await maakSessie(admin, b.id, nu)
  if (sessie) await admin.from('club_beheerders').update({ laatst_ingelogd_op: nu.toISOString() }).eq('id', b.id)
  return sessie
}

async function controleerEnStart(admin: SupabaseClient, b: Beheerder, klopt: () => boolean, nu: Date): Promise<InlogUitkomst> {
  if (b.blokkades >= MAX_BLOKKADES) return { staat: 'gesloten' }
  if (b.geblokkeerdTot && new Date(b.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: b.geblokkeerdTot }

  // Eerst een poging reserveren (compare-and-set op de teller), dan pas de pin
  // checken: parallelle verzoeken kunnen zo niet allemaal "poging 1" zijn.
  const poging = b.mislukt + 1
  const { data: gereserveerd, error: resFout } = await admin
    .from('club_beheerders')
    .update({ mislukt: poging })
    .eq('id', b.id)
    .eq('mislukt', b.mislukt)
    .select('id')
  if (resFout) return { staat: 'db' }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }

  if (!klopt()) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    return blokkeer(admin, b, nu)
  }

  const sessie = await maakSessie(admin, b.id, nu)
  if (!sessie) return { staat: 'db' }
  await admin.from('club_beheerders').update({ ...TELLERS_SCHOON, laatst_ingelogd_op: nu.toISOString() }).eq('id', b.id)
  return { staat: 'ok', ...sessie }
}

async function blokkeer(admin: SupabaseClient, b: Beheerder, nu: Date): Promise<InlogUitkomst> {
  const blokkades = b.blokkades + 1
  const gesloten = blokkades >= MAX_BLOKKADES
  const totOp = gesloten ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin.from('club_beheerders').update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades }).eq('id', b.id)
  if (error) return { staat: 'db' }
  return totOp ? { staat: 'geblokkeerd', totOp } : { staat: 'gesloten' }
}

// ─── Sessies ────────────────────────────────────────────────────────────────

async function maakSessie(admin: SupabaseClient, beheerderId: string, nu: Date): Promise<{ token: string; verlooptOp: Date } | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + BEHEERDER_SESSIE_DAGEN * 24 * 60 * 60 * 1000)
  const { error } = await admin.from('club_beheerder_sessies').insert({
    token_hash: tokenHash(token),
    beheerder_id: beheerderId,
    verloopt_op: verlooptOp.toISOString(),
    laatst_gebruikt_op: nu.toISOString(),
  })
  if (error) {
    console.error('[club] sessie maken mislukt', error.message)
    return null
  }
  await snoeiSessies(admin, beheerderId, nu)
  return { token, verlooptOp }
}

/** Verlopen sessies weg; daarna hooguit MAX_BEHEERDER_SESSIES van de nieuwste. */
async function snoeiSessies(admin: SupabaseClient, beheerderId: string, nu: Date): Promise<void> {
  await admin.from('club_beheerder_sessies').delete().eq('beheerder_id', beheerderId).lt('verloopt_op', nu.toISOString())
  const { data } = await admin
    .from('club_beheerder_sessies')
    .select('token_hash')
    .eq('beheerder_id', beheerderId)
    .order('aangemaakt_op', { ascending: false })
    .range(MAX_BEHEERDER_SESSIES, MAX_BEHEERDER_SESSIES + 99)
  const teVeel = (Array.isArray(data) ? (data as { token_hash: string }[]) : []).map((r) => r.token_hash)
  if (teVeel.length > 0) await admin.from('club_beheerder_sessies').delete().in('token_hash', teVeel)
}

/**
 * De beheerder achter een sessietoken, alleen als de sessie geldig is en de
 * beheerder nog actief is met een goedgekeurde pin. Anders null.
 */
export async function beheerderVanSessie(admin: SupabaseClient, token: string | undefined, nu: Date): Promise<Beheerder | null> {
  if (!token || token.length > 100) return null
  const hash = tokenHash(token)
  const { data: sessie } = await admin
    .from('club_beheerder_sessies')
    .select('beheerder_id, verloopt_op, laatst_gebruikt_op, aangemaakt_op')
    .eq('token_hash', hash)
    .maybeSingle()
  if (!sessie) return null
  const oordeel = beoordeelBeheerderSessie(sessie as BeheerderSessieRij, nu)
  if (oordeel === 'verlopen') {
    await admin.from('club_beheerder_sessies').delete().eq('token_hash', hash)
    return null
  }
  const { data, error } = await admin.from('club_beheerders').select(BEHEERDER_KOLOMMEN).eq('id', (sessie as BeheerderSessieRij).beheerder_id).maybeSingle()
  const b = error ? null : beheerderUitRij(data)
  if (!b || !magBinnen(b)) return null
  if (oordeel === 'aanraken') await admin.from('club_beheerder_sessies').update({ laatst_gebruikt_op: nu.toISOString() }).eq('token_hash', hash)
  return b
}

/** Dit toestel uitloggen: de sessie verdwijnt uit de database. False als dat mislukte. */
export async function logUitBeheerder(admin: SupabaseClient, token: string): Promise<boolean> {
  if (token.length > 100) return true
  const { error } = await admin.from('club_beheerder_sessies').delete().eq('token_hash', tokenHash(token))
  if (error) console.error('[club] uitloggen mislukt', error.message)
  return !error
}

// ─── Beheer door Kane ───────────────────────────────────────────────────────

export function nieuweBeheerderCode(): string {
  return randomBytes(18).toString('base64url')
}

function overzicht(b: Beheerder): BeheerderOverzicht {
  return {
    id: b.id,
    naam: b.naam,
    email: b.email,
    rol: b.rol,
    code: b.code,
    actief: b.actief,
    heeftWachtwoord: b.wachtwoordHash !== null,
    gesloten: b.blokkades >= MAX_BLOKKADES,
    laatstIngelogdOp: b.laatstIngelogdOp,
  }
}

/** De beheerders van een sportschool, voor het portaal van Kane. Null bij een fout. */
export async function haalBeheerders(admin: SupabaseClient, organisatieId: string): Promise<BeheerderOverzicht[] | null> {
  const { data, error } = await admin.from('club_beheerders').select(BEHEERDER_KOLOMMEN).eq('organisatie_id', organisatieId).order('aangemaakt_op')
  if (error) {
    console.error('[club] beheerders lezen mislukt', error.message)
    return null
  }
  return (data ?? []).map(beheerderUitRij).filter((b): b is Beheerder => b !== null).map(overzicht)
}

export async function maakBeheerder(admin: SupabaseClient, organisatieId: string, invoer: NieuweBeheerder, wachtwoordHash: string | null = null): Promise<{ id: string } | null> {
  const { data, error } = await admin
    .from('club_beheerders')
    .insert({ organisatie_id: organisatieId, naam: invoer.naam, email: invoer.email, rol: invoer.rol, code: nieuweBeheerderCode(), wachtwoord_hash: wachtwoordHash })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[club] beheerder aanmaken mislukt', error?.message)
    return null
  }
  return { id: String(data.id) }
}

export type BeoordeelUitkomst = 'ok' | 'niet_gevonden' | 'db'

/**
 * Kane of de eigenaar: een beheerder een nieuwe uitnodiging geven (vergeten
 * wachtwoord of dichtgelopen: wachtwoord weg, nieuwe link, de oude link werkt
 * niet meer) of stoppen. Beide loggen alle toestellen uit. Altijd binnen de
 * eigen sportschool.
 */
export async function beoordeelBeheerder(admin: SupabaseClient, organisatieId: string, id: string, { actie }: Beoordeling): Promise<BeoordeelUitkomst> {
  const leeg = { pin_hash: null, pin_status: 'geen', pin_aangevraagd_op: null, wachtwoord_hash: null, ...TELLERS_SCHOON }
  const wijziging = actie === 'reset' ? { ...leeg, code: nieuweBeheerderCode() } : { ...leeg, actief: false }
  const { data, error } = await admin.from('club_beheerders').update(wijziging).eq('id', id).eq('organisatie_id', organisatieId).select('id')
  if (error) return 'db'
  if (!Array.isArray(data) || data.length !== 1) return 'niet_gevonden'
  const { error: uitFout } = await admin.from('club_beheerder_sessies').delete().eq('beheerder_id', id)
  return uitFout ? 'db' : 'ok'
}

// ─── Uitnodiging: een keer een wachtwoord kiezen ────────────────────────────

export type WachtwoordKeuze = { staat: 'ok'; token: string; verlooptOp: Date } | { staat: 'al_gekozen' } | { staat: 'email_bezet' } | { staat: 'db' }

/**
 * Met de uitnodigingslink kiest de beheerder een keer een wachtwoord
 * (compare-and-set: twee verzoeken tegelijk kunnen er niet allebei een zetten),
 * en is daarna meteen ingelogd. Daarna werkt de link niet meer.
 */
export async function kiesBeheerderWachtwoord(admin: SupabaseClient, b: Beheerder, wachtwoordHash: string, nu: Date): Promise<WachtwoordKeuze> {
  if (b.wachtwoordHash || !b.actief || !b.email) return { staat: 'al_gekozen' }
  const { data, error } = await admin
    .from('club_beheerders')
    .update({ wachtwoord_hash: wachtwoordHash, pin_hash: null, pin_status: 'geen', ...TELLERS_SCHOON })
    .eq('id', b.id)
    .eq('actief', true)
    .is('wachtwoord_hash', null)
    .select('id')
  // Unieke index op e-mail: dit adres logt al ergens anders in.
  if (error) return error.code === '23505' ? { staat: 'email_bezet' } : { staat: 'db' }
  if (!Array.isArray(data) || data.length !== 1) return { staat: 'al_gekozen' }
  const sessie = await startSessie(admin, { ...b, wachtwoordHash }, nu)
  return sessie ? { staat: 'ok', ...sessie } : { staat: 'db' }
}
