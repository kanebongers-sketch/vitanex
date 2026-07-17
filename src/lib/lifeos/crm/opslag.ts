// ─── LifeOS — CRM: personen in de database ──────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor het mensen-bord staat hier; de routes
// doen auth, validatie en het antwoord.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek — zie `admin.ts`.
//
// ─── TIJDLIJN & ATOMICITEIT (eerlijk) ───────────────────────────────────────
// Elke betekenisvolle persoon-actie schrijft óók een `crm_historie`-regel, zodat
// de popup-tijdlijn klopt. De Supabase-JS-client kent geen makkelijke multi-
// statement-transactie, dus persoon-schrijven en historie-schrijven zijn twee
// losse calls. De keuze: de persoon-actie is de bron van waarheid en slaagt of
// faalt op zichzelf; het historie-logje is best-effort. Faalt alléén het logje,
// dan is de persoon correct opgeslagen — we geven 'm terug en loggen de misser
// server-side (niet stil inslikken), i.p.v. een 502 op een geslaagde actie of een
// weduwe-persoon zonder begin-regel. Single-tenant (alleen Kane) maakt de kans
// op een losse-log-fout klein en het gevolg klein.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isGroep,
  type Groep,
  type NieuwePersoon,
  type Persoon,
  type PersoonWijziging,
} from './crm'
import { vertaalFout, type Reden, type Uitkomst } from './fout'
import { logGebeurtenis, type Gebeurtenis } from './historie'

export const PERSOON_KOLOMMEN =
  'id, naam, groep, status, sortering, follow_up_datum, telefoon, email, bijzonderheden, laatste_contact_op, aangemaakt_op'

/**
 * De stap tussen twee opeenvolgende posities in een kolom. Ruim genoeg om er nog
 * tussen te kunnen slepen (de UI neemt het gemiddelde van de buren). Een nieuwe
 * persoon landt onderaan zijn kolom: hoogste sortering + deze stap.
 */
const SORTERING_STAP = 1000

// ─── Lezen ──────────────────────────────────────────────────────────────────

/**
 * De personen van één groep, of — zonder `groep` — álle personen (elke groep).
 * Vlakke lijst, geordend op groep → status → sortering: de UI bucket zelf per
 * statuskolom (die kent de kolomvolgorde uit `crm.ts`), dus de server hoeft alleen
 * bínnen een status op sleepvolgorde te sorteren. De bord-index dekt precies deze
 * volgorde. Ongefilterd teruggeven i.p.v. per groep groeperen houdt de vorm gelijk
 * voor beide aanroepen — de UI groepeert client-side.
 */
export async function haalPersonen(
  admin: SupabaseClient,
  userId: string,
  groep?: Groep,
): Promise<Uitkomst<Persoon[]>> {
  let query = admin.from('crm_personen').select(PERSOON_KOLOMMEN).eq('user_id', userId)
  if (groep !== undefined) query = query.eq('groep', groep)

  const { data, error } = await query
    .order('groep', { ascending: true })
    .order('status', { ascending: true })
    .order('sortering', { ascending: true })
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: personenVanRijen(Array.isArray(data) ? data : []) }
}

// ─── Aanmaken ─────────────────────────────────────────────────────────────────

/**
 * Nieuwe persoon, onderaan zijn kolom. Schrijft meteen een begin-regel
 * (`status_wijziging`, naar de begin-status) zodat de tijdlijn bij het begin
 * begint. Zie de kop over atomiciteit: het logje is best-effort.
 */
export async function maakPersoon(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuwePersoon,
): Promise<Uitkomst<Persoon>> {
  const volgende = await volgendeSortering(admin, userId, nieuw.groep, nieuw.status)
  if (!volgende.ok) return volgende

  const { data, error } = await admin
    .from('crm_personen')
    .insert({
      user_id: userId,
      naam: nieuw.naam,
      groep: nieuw.groep,
      status: nieuw.status,
      sortering: volgende.waarde,
      follow_up_datum: nieuw.followUpDatum,
      telefoon: nieuw.telefoon,
      email: nieuw.email,
      bijzonderheden: nieuw.bijzonderheden,
    })
    .select(PERSOON_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const persoon = persoonVanRij(data)
  if (!persoon) return { ok: false, reden: 'db' }

  const log = await logGebeurtenis(admin, userId, persoon.id, {
    soort: 'status_wijziging',
    vanStatus: null,
    naarStatus: persoon.status,
  })
  if (!log.ok) meldLogFout('status_wijziging', log.reden)

  return { ok: true, waarde: persoon }
}

/** De sortering voor een nieuwe tegel onderaan de kolom (hoogste + stap). */
async function volgendeSortering(
  admin: SupabaseClient,
  userId: string,
  groep: Groep,
  status: string,
): Promise<Uitkomst<number>> {
  const { data, error } = await admin
    .from('crm_personen')
    .select('sortering')
    .eq('user_id', userId)
    .eq('groep', groep)
    .eq('status', status)
    .order('sortering', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const hoogste = isObject(data) ? getal(data.sortering) : null
  return { ok: true, waarde: hoogste === null ? 0 : hoogste + SORTERING_STAP }
}

// ─── Wijzigen ─────────────────────────────────────────────────────────────────

/**
 * Wijzigt alleen de meegestuurde velden. KRITIEK: bij een status-wissel schrijven
 * we een `status_wijziging`-regel met van/naar. Om `van_status` te weten lezen we
 * de huidige status éérst — alleen als de status daadwerkelijk mee-verandert
 * (slepen bínnen een kolom raakt alleen `sortering` en leest dus niks extra).
 *
 * Eerlijke prijs — de race: tussen het lezen van de oude status en de update kan
 * een andere request de status wijzigen, waardoor `van_status` in het log net
 * achterloopt. Voor single-tenant (alleen Kane, geen twee gelijktijdige handen op
 * hetzelfde bord) is dat verwaarloosbaar; een transactie ervoor optuigen is meer
 * machinerie dan het waard is.
 */
export async function wijzigPersoon(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: PersoonWijziging,
): Promise<Uitkomst<Persoon>> {
  let vanStatus: string | null = null
  if (wijziging.status !== undefined) {
    const huidig = await huidigeStatus(admin, userId, id)
    if (!huidig.ok) return huidig
    vanStatus = huidig.waarde
  }

  const { data, error } = await admin
    .from('crm_personen')
    .update(veldenVanWijziging(wijziging))
    .eq('id', id)
    .eq('user_id', userId)
    .select(PERSOON_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const persoon = persoonVanRij(data)
  if (!persoon) return { ok: false, reden: 'db' }

  await logWijzigingen(admin, userId, persoon, wijziging, vanStatus)
  return { ok: true, waarde: persoon }
}

/** De wijziging (camelCase) → de DB-kolommen (snake_case). Alleen aanwezige velden. */
function veldenVanWijziging(wijziging: PersoonWijziging): Record<string, unknown> {
  const velden: Record<string, unknown> = {}
  if (wijziging.naam !== undefined) velden.naam = wijziging.naam
  if (wijziging.status !== undefined) velden.status = wijziging.status
  if (wijziging.sortering !== undefined) velden.sortering = wijziging.sortering
  if (wijziging.followUpDatum !== undefined) velden.follow_up_datum = wijziging.followUpDatum
  if (wijziging.telefoon !== undefined) velden.telefoon = wijziging.telefoon
  if (wijziging.email !== undefined) velden.email = wijziging.email
  if (wijziging.bijzonderheden !== undefined) velden.bijzonderheden = wijziging.bijzonderheden
  if (wijziging.laatsteContactOp !== undefined) velden.laatste_contact_op = wijziging.laatsteContactOp
  return velden
}

/** De huidige status van een persoon lezen — voor de `van_status` in het log. */
async function huidigeStatus(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<string | null>> {
  const { data, error } = await admin
    .from('crm_personen')
    .select('status')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: isObject(data) ? tekst(data.status) : null }
}

/**
 * De historie-regels die uit een wijziging volgen. Best-effort (zie kop):
 * een status-wissel (als de status écht anders werd), en optioneel een contact-
 * of follow-up-regel als die velden gezet (niet gewist) werden.
 */
async function logWijzigingen(
  admin: SupabaseClient,
  userId: string,
  persoon: Persoon,
  wijziging: PersoonWijziging,
  vanStatus: string | null,
): Promise<void> {
  const gebeurtenissen: Gebeurtenis[] = []
  if (wijziging.status !== undefined && vanStatus !== persoon.status) {
    gebeurtenissen.push({ soort: 'status_wijziging', vanStatus, naarStatus: persoon.status })
  }
  if (isGezet(wijziging.laatsteContactOp)) gebeurtenissen.push({ soort: 'contact_gelegd' })
  if (isGezet(wijziging.followUpDatum)) gebeurtenissen.push({ soort: 'follow_up_gezet' })

  for (const gebeurtenis of gebeurtenissen) {
    const uit = await logGebeurtenis(admin, userId, persoon.id, gebeurtenis)
    if (!uit.ok) meldLogFout(gebeurtenis.soort, uit.reden)
  }
}

/** Gezet = een niet-lege waarde meegestuurd (null = gewist, telt niet als "gezet"). */
function isGezet(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * Het historie-logje faalde terwijl de persoon-actie slaagde. Niet stil inslikken
 * (server-log), maar ook geen 502 op een geslaagde actie — zie de kop.
 */
function meldLogFout(soort: string, reden: Reden): void {
  console.error(`[lifeos/crm] historie '${soort}' loggen mislukt (${reden})`)
}

// ─── Verwijderen ────────────────────────────────────────────────────────────

/**
 * Weg ermee. De historie cascadet via de FK (`on delete cascade`).
 *
 * `.eq('user_id', ...)` staat er ook al gaat dit via de service-role-client (die
 * RLS omzeilt): zonder die filter zou een geraden id de persoon van een ander
 * verwijderen. Single-tenant maakt dat vandaag theoretisch — maar dit is de regel
 * die je niet één keer mag vergeten.
 */
export async function verwijderPersoon(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('crm_personen')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Eindig getal, of null — nooit NaN, nooit een string die op een getal lijkt. */
function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Eén rij → `Persoon` (snake_case → camelCase). Geen cast: een rij zonder de
 * identiteits-velden (id/naam/status/aangemaakt_op) of met een onbekende groep is
 * kapot en wordt overgeslagen, de rest houden we. Een onleesbare `sortering` valt
 * terug op 0 (de DB-default), want "geen sleepvolgorde" is geen reden om de hele
 * persoon te laten verdwijnen. Zelfde conventie als `taakVanRij`.
 */
export function persoonVanRij(rij: unknown): Persoon | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const naam = tekst(rij.naam)
  const status = tekst(rij.status)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || naam === null || status === null || aangemaaktOp === null) return null
  if (!isGroep(rij.groep)) return null

  return {
    id,
    naam,
    groep: rij.groep,
    status,
    sortering: getal(rij.sortering) ?? 0,
    followUpDatum: tekst(rij.follow_up_datum),
    telefoon: tekst(rij.telefoon),
    email: tekst(rij.email),
    bijzonderheden: tekst(rij.bijzonderheden),
    laatsteContactOp: tekst(rij.laatste_contact_op),
    aangemaaktOp,
  }
}

export function personenVanRijen(rijen: readonly unknown[]): Persoon[] {
  return rijen.map(persoonVanRij).filter((p): p is Persoon => p !== null)
}
