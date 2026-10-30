// ─── Club, nieuwe leden: aanmelden via een link (SERVER-ONLY) ───────────────
// Stap 1 (start): gegevens plus akkoord. We leggen een aanmelding vast en
// maken de mail klaar: een code van 6 cijfers, of (als het adres al bij een
// lid van deze sportschool hoort) een mail dat er al een account is. Het
// antwoord is in beide gevallen hetzelfde. Laatste stap (afronden): de code
// uit de mail plus een wachtwoord. Dan wordt het lid een proeflid, kiest het
// (misschien) een lidmaatschapsvorm, en is dit toestel meteen ingelogd.
// De sportschool komt altijd uit de link (de code), nooit van de pagina.

import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalEigenOrganisatie } from '@/lib/club/toegang'
import { moduleAan, type Organisatie } from '@/lib/club/kern/organisatie'
import { remSleutel } from '@/lib/club/kern/rem-hash'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { exactPatroon } from '@/lib/club/app-uitnodigen/regels'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { LID_TOEGANG_KOLOMMEN, lidToegangUitRij } from '@/lib/club/ledenlogin/regels'
import { maakSessie, nieuweLidCode, type Sessie } from '@/lib/club/ledenlogin/opslag'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { gebruikLink, vindLink } from './links-opslag'
import { alLidMail, codeMail, type AanmeldMail } from './mail'
import {
  CODE_MINUTEN, MAX_VERSTUURD, TOESTEMMING_VERSIE, codeOordeel, kiesVorm, linkStaat, remAanmelden, vormenVoorVestiging,
  type Aanmeldlink, type AanmeldAfronden, type AanmeldGegevens,
} from './regels'

const AANMELDINGEN = 'club_aanmeldingen'
const UNIEK = '23505'
const UUR_MS = 3_600_000

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/nieuwe-leden] ${wat} mislukt`, fout.message)
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function codeHash(tokenHashWaarde: string, code: string): string {
  return remSleutel('club-aanmeld-code', `${tokenHashWaarde}|${code}`)
}

function zesCijfers(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function gelijk(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export interface OpenLink {
  link: Aanmeldlink
  organisatie: Organisatie
}

/**
 * Een link waarmee je je nu kunt aanmelden: open, de ledenapp staat aan, de
 * vestiging bestaat nog. Anders null (de pagina geeft dan een 404 en laat
 * niets van de sportschool zien).
 */
export async function openLink(admin: SupabaseClient, code: string, nu: Date): Promise<OpenLink | null> {
  if (!CLUB_LEDEN_LOGIN) return null
  const link = await vindLink(admin, code)
  if (!link || linkStaat(link, nu) !== 'open') return null
  const [{ organisatie }, vest] = await Promise.all([
    haalEigenOrganisatie(admin, link.userId),
    admin.from('club_vestigingen').select('vestiging').eq('user_id', link.userId).eq('vestiging', link.vestiging).maybeSingle(),
  ])
  if (!organisatie || organisatie.id !== link.userId || !moduleAan(organisatie, 'app') || vest.error || !vest.data) return null
  return { link, organisatie }
}

/** Hoort dit adres al bij een lid (met of zonder app) van deze sportschool? Bij twijfel: ja (dan geen nieuw lid). */
async function adresBekend(admin: SupabaseClient, userId: string, email: string): Promise<boolean> {
  const [toegang, leden] = await Promise.all([
    admin.from('club_lid_toegang').select('id').eq('user_id', userId).eq('email', email).limit(1),
    admin.from('club_leden').select('id').eq('user_id', userId).ilike('email', exactPatroon(email)).limit(1),
  ])
  if (toegang.error || leden.error) {
    log('adres controleren', toegang.error ?? leden.error)
    return true
  }
  return (toegang.data ?? []).length > 0 || (leden.data ?? []).length > 0
}

async function tel(admin: SupabaseClient, kolom: 'ip_hash' | 'email_hash' | 'link_id', waarde: string, sinds: string): Promise<number | null> {
  const { count, error } = await admin.from(AANMELDINGEN).select('id', { count: 'exact', head: true }).eq(kolom, waarde).gte('aangemaakt_op', sinds)
  log('rem lezen', error)
  return error ? null : count ?? 0
}

function adressen(org: Organisatie): { inloggen: string; aanvragen: string } {
  const basis = org.slug ? sportschoolUrl(org.slug, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1') : ''
  return { inloggen: `${basis}/mijn/inloggen`, aanvragen: `${basis}/mijn/aanvragen` }
}

export type StartUitkomst =
  | { staat: 'ok'; token: string; mail: AanmeldMail | null }
  | { staat: 'link' | 'netwerk' | 'teVeelLink' | 'db' }

/**
 * Stap 1. Altijd hetzelfde antwoord voor een bekend en een onbekend adres;
 * de mail (code of "al lid") stuurt de route na het antwoord (after).
 */
export async function startAanmelding(
  admin: SupabaseClient,
  g: AanmeldGegevens,
  ipHash: string,
  taal: Taal,
  nu: Date,
): Promise<StartUitkomst> {
  const open = await openLink(admin, g.code, nu)
  if (!open) return { staat: 'link' }
  const { link, organisatie: org } = open
  const emailHash = remSleutel('club-aanmelden|email', g.email)
  const sinds = new Date(nu.getTime() - UUR_MS).toISOString()
  const [perIp, perEmail, perLink, bekend] = await Promise.all([
    tel(admin, 'ip_hash', ipHash, sinds),
    tel(admin, 'email_hash', emailHash, sinds),
    tel(admin, 'link_id', link.id, sinds),
    adresBekend(admin, link.userId, g.email),
  ])
  // Bij een leesfout van de rem: dicht (liever geen mail dan een open deur).
  const rem = perIp === null || perEmail === null || perLink === null ? 'netwerk' : remAanmelden(perIp, perEmail, perLink)
  if (rem === 'netwerk') return { staat: 'netwerk' }
  if (rem === 'link') return { staat: 'teVeelLink' }

  const token = randomBytes(32).toString('base64url')
  const th = tokenHash(token)
  const code = zesCijfers()
  const { error } = await admin.from(AANMELDINGEN).insert({
    user_id: link.userId, link_id: link.id, token_hash: th, email: g.email, email_hash: emailHash, ip_hash: ipHash,
    voornaam: g.voornaam, achternaam: g.achternaam, telefoon: g.telefoon, geboortedatum: g.geboortedatum,
    code_hash: bekend ? null : codeHash(th, code), pogingen: 0, verstuurd: rem === 'stil' ? 0 : 1,
    toestemming_op: nu.toISOString(), toestemming_versie: TOESTEMMING_VERSIE,
    verloopt_op: new Date(nu.getTime() + CODE_MINUTEN * 60_000).toISOString(), aangemaakt_op: nu.toISOString(),
  })
  if (error) {
    log('aanmelding vastleggen', error)
    return { staat: 'db' }
  }
  if (rem === 'stil') return { staat: 'ok', token, mail: null }
  const mail = bekend ? alLidMail(g.email, g.voornaam, org.naam, adressen(org), taal) : codeMail(g.email, g.voornaam, org.naam, code, taal)
  return { staat: 'ok', token, mail }
}

interface AanmeldRij {
  id: string
  user_id: string
  link_id: string
  email: string
  voornaam: string
  achternaam: string
  telefoon: string | null
  geboortedatum: string | null
  code_hash: string | null
  pogingen: number
  verstuurd: number
  verloopt_op: string
  afgerond_op: string | null
  toestemming_versie: string
}

const RIJ_KOLOMMEN = 'id, user_id, link_id, email, voornaam, achternaam, telefoon, geboortedatum, code_hash, pogingen, verstuurd, verloopt_op, afgerond_op, toestemming_versie'

async function vindAanmelding(admin: SupabaseClient, token: string): Promise<AanmeldRij | null> {
  const { data, error } = await admin.from(AANMELDINGEN).select(RIJ_KOLOMMEN).eq('token_hash', tokenHash(token)).maybeSingle()
  log('aanmelding lezen', error)
  return error || !data ? null : (data as AanmeldRij)
}

/**
 * Een nieuwe code mailen (hooguit MAX_VERSTUURD keer per aanmelding). Altijd
 * hetzelfde antwoord; een aanmelding voor een bekend adres krijgt geen code.
 */
export async function nieuweCode(admin: SupabaseClient, token: string, taal: Taal, nu: Date): Promise<AanmeldMail | null> {
  const a = await vindAanmelding(admin, token)
  if (!a || a.afgerond_op || !a.code_hash || a.verstuurd >= MAX_VERSTUURD) return null
  const th = tokenHash(token)
  const code = zesCijfers()
  const { data, error } = await admin
    .from(AANMELDINGEN)
    .update({ code_hash: codeHash(th, code), pogingen: 0, verstuurd: a.verstuurd + 1, verloopt_op: new Date(nu.getTime() + CODE_MINUTEN * 60_000).toISOString() })
    .eq('id', a.id)
    .eq('user_id', a.user_id)
    .eq('verstuurd', a.verstuurd)
    .is('afgerond_op', null)
    .select('id')
  log('nieuwe code', error)
  if (error || !Array.isArray(data) || data.length !== 1) return null
  const { organisatie } = await haalEigenOrganisatie(admin, a.user_id)
  return organisatie ? codeMail(a.email, a.voornaam, organisatie.naam, code, taal) : null
}

export type AfrondUitkomst =
  | { staat: 'ok'; sessie: Sessie; lidId: string }
  | { staat: 'code' | 'codeOp' | 'verlopen' | 'link' | 'db' }

/** Een poging reserveren (compare-and-set), zodat parallelle verzoeken niet allemaal poging 1 zijn. */
async function reserveerPoging(admin: SupabaseClient, a: AanmeldRij): Promise<boolean> {
  const { data, error } = await admin.from(AANMELDINGEN).update({ pogingen: a.pogingen + 1 }).eq('id', a.id).eq('user_id', a.user_id).eq('pogingen', a.pogingen).select('id')
  log('poging reserveren', error)
  return !error && Array.isArray(data) && data.length === 1
}

async function lidMaken(admin: SupabaseClient, a: AanmeldRij, link: Aanmeldlink, vormNaam: string | null, nu: Date): Promise<string | null> {
  const { data, error } = await admin
    .from('club_leden')
    .insert({
      user_id: a.user_id, vestiging: link.vestiging, voornaam: a.voornaam, achternaam: a.achternaam, email: a.email,
      telefoon: a.telefoon, geboortedatum: a.geboortedatum, status: 'proef', lid_sinds: dagSleutelNl(nu), abonnement: vormNaam,
      aangemeld_via: link.id, aanmelding_op: nu.toISOString(), aanmelding_toestemming_versie: a.toestemming_versie,
    })
    .select('id')
    .single()
  log('lid maken', error)
  const id = (data as { id?: unknown } | null)?.id
  return !error && typeof id === 'string' ? id : null
}

async function toegangMaken(admin: SupabaseClient, a: AanmeldRij, lidId: string, wachtwoord: string, nu: Date) {
  const tijd = nu.toISOString()
  const { data, error } = await admin
    .from('club_lid_toegang')
    .insert({
      user_id: a.user_id, lid_id: lidId, code: nieuweLidCode(), code_gemaakt_op: tijd, code_gebruikt_op: tijd, actief: true,
      email: a.email, wachtwoord_hash: hashWachtwoord(wachtwoord), wachtwoord_gekozen_op: tijd, laatst_ingelogd_op: tijd, gewijzigd_op: tijd,
    })
    .select(LID_TOEGANG_KOLOMMEN)
    .single()
  if (error && error.code !== UNIEK) log('toegang maken', error)
  return error ? null : lidToegangUitRij(data)
}

/**
 * De laatste stap. De route controleert vooraf de sterkte van het wachtwoord.
 * Volgorde: aanmelding en link nog geldig, poging reserveren, code controleren,
 * link een keer gebruiken, aanmelding afronden, lid en toegang maken, sessie.
 * Mislukt het maken van de toegang, dan gaat het net gemaakte lid weer weg.
 */
export async function rondAanmeldingAf(admin: SupabaseClient, i: AanmeldAfronden, nu: Date): Promise<AfrondUitkomst> {
  const a = await vindAanmelding(admin, i.token)
  if (!a) return { staat: 'verlopen' }
  const { data: linkRij } = await admin.from('club_aanmeldlinks').select('code').eq('id', a.link_id).eq('user_id', a.user_id).maybeSingle()
  const code = (linkRij as { code?: unknown } | null)?.code
  const open = typeof code === 'string' ? await openLink(admin, code, nu) : null
  if (!open || open.link.userId !== a.user_id) return { staat: 'link' }

  const verwacht = a.code_hash
  const klopt = verwacht !== null && gelijk(codeHash(tokenHash(i.token), i.mailCode), verwacht)
  const oordeel = codeOordeel({ pogingen: a.pogingen, verlooptOp: a.verloopt_op, afgerondOp: a.afgerond_op, codeHash: verwacht }, klopt, nu)
  if (oordeel === 'verlopen') return { staat: 'verlopen' }
  if (oordeel === 'op') return { staat: 'codeOp' }
  if (!(await reserveerPoging(admin, a))) return { staat: 'code' }
  if (oordeel === 'fout') return { staat: 'code' }

  const vormen = await haalVormen(admin, a.user_id)
  const kiesbaar = vormenVoorVestiging(vormen ?? [], open.link.vestiging)
  const vormId = kiesVorm(open.link.vormId, i.vormId, kiesbaar.map((v) => v.id))
  const vormNaam = (vormen ?? []).find((v) => v.id === vormId)?.naam ?? null

  if (!(await gebruikLink(admin, open.link))) return { staat: 'link' }
  const { data: af, error: afFout } = await admin.from(AANMELDINGEN).update({ afgerond_op: nu.toISOString() }).eq('id', a.id).eq('user_id', a.user_id).is('afgerond_op', null).select('id')
  log('aanmelding afronden', afFout)
  if (afFout || !Array.isArray(af) || af.length !== 1) return { staat: 'verlopen' }

  const lidId = await lidMaken(admin, a, open.link, vormNaam, nu)
  if (!lidId) return { staat: 'db' }
  const toegang = await toegangMaken(admin, a, lidId, i.wachtwoord, nu)
  if (!toegang) {
    await admin.from('club_leden').delete().eq('user_id', a.user_id).eq('id', lidId)
    return { staat: 'db' }
  }
  const sessie = await maakSessie(admin, toegang, nu)
  return sessie ? { staat: 'ok', sessie, lidId } : { staat: 'db' }
}

/** Opruimen: aanmeldingen ouder dan een dag (persoonsgegevens kort bewaren). Gooit nooit. */
export async function ruimAanmeldingenOp(admin: SupabaseClient, nu: Date): Promise<void> {
  const { error } = await admin.from(AANMELDINGEN).delete().lt('aangemaakt_op', new Date(nu.getTime() - 24 * UUR_MS).toISOString())
  log('oude aanmeldingen opruimen', error)
}
