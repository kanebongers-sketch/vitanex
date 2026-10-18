// ─── Club, AVG: lezen en verwijderen in de database (SERVER-ONLY) ───────────
// Alles filtert op de sportschool (user_id) en het lid. Het definitieve
// verwijderen zit in de database-functie (migratie 429), niet hier.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExportRuw, Rij } from './export'
import { verzoekUitRij, type Verwijderverzoek } from './verwijderen'

type Uitslag = { ok: true; ruw: ExportRuw; medewerkers: Map<string, string> } | { ok: false; fout: string }

/** Tabel, kolommen en het lid-filter per onderdeel van de export. */
const BRONNEN: Record<Exclude<keyof ExportRuw, 'lid' | 'leadHistorie'>, { tabel: string; select: string; volgorde?: string }> = {
  bezoeken: { tabel: 'club_checkins', select: 'op, vestiging, bron', volgorde: 'op' },
  lesboekingen: { tabel: 'club_reserveringen', select: 'status, wachtpositie, bron, geboekt_op, geannuleerd_op, te_laat, club_lessen(start_op, vestiging, club_lestypen(naam))', volgorde: 'geboekt_op' },
  afspraken: { tabel: 'club_afspraken', select: 'start_op, eind_op, vestiging, medewerker_id, status, notitie, geboekt_door, geannuleerd_op, club_afspraak_typen(naam)', volgorde: 'start_op' },
  intakes: { tabel: 'club_intakes', select: 'datum, medewerker_id, antwoorden, metingen, toestemming_gezondheid, notitie, aangemaakt_op', volgorde: 'datum' },
  metingen: { tabel: 'club_metingen', select: '*', volgorde: 'datum' },
  schemas: {
    tabel: 'club_schemas',
    select: 'naam, doel, niveau, weken, status, notitie, dag_titels, medewerker_id, aangemaakt_op, bijgewerkt_op, club_schema_oefeningen(dag, volgorde, sets, herhalingen, gewicht_kg, rust_sec, notitie, club_oefeningen(naam))',
    volgorde: 'aangemaakt_op',
  },
  trainingen: { tabel: 'club_trainingslog', select: 'op, dag, uitgevoerd', volgorde: 'op' },
  voeding: { tabel: 'club_voedingsplannen', select: '*' },
  notities: { tabel: 'club_notities', select: 'tekst, auteur, vastgepind, aangemaakt_op', volgorde: 'aangemaakt_op' },
  challenges: { tabel: 'club_challenge_deelnemers', select: 'ingeschreven_op, club_challenges(titel)', volgorde: 'ingeschreven_op' },
  opvolgtaken: { tabel: 'club_opvolgtaken', select: 'regel, reden, status, medewerker_id, notitie, afgehandeld_door, afgehandeld_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  meldingen: { tabel: 'club_meldingen', select: 'soort, kanaal, onderwerp, inhoud, status, gepland_op, verstuurd_op, gelezen_op', volgorde: 'gepland_op' },
  meldingVoorkeuren: { tabel: 'club_meldingen_voorkeuren', select: 'herinneringen_per_mail, mails, gewijzigd_op' },
  // Nooit de code, pin_hash of token_hash: alleen wat het lid mag weten.
  ledenapp: { tabel: 'club_lid_toegang', select: 'actief, pin_gekozen_op, laatst_ingelogd_op, aangemaakt_op' },
  sessies: { tabel: 'club_lid_sessies', select: 'aangemaakt_op, laatst_gebruikt_op, verloopt_op', volgorde: 'aangemaakt_op' },
  leads: { tabel: 'club_leads', select: 'id, naam, email, telefoon, vestiging, bron, interesse, status, proefles_op, verloren_reden, toestemming_contact, aangemaakt_op', volgorde: 'aangemaakt_op' },
  verwijderverzoek: { tabel: 'club_lid_verwijderingen', select: 'aangevraagd_op, definitief_op' },
}

const MAX_RIJEN = 10_000

async function leesAlles(admin: SupabaseClient, userId: string, lidId: string, bron: (typeof BRONNEN)[keyof typeof BRONNEN]): Promise<Rij[] | null> {
  const uit: Rij[] = []
  for (let van = 0; van < MAX_RIJEN; van += 1000) {
    let q = admin.from(bron.tabel).select(bron.select).eq('user_id', userId).eq('lid_id', lidId)
    if (bron.volgorde) q = q.order(bron.volgorde)
    const { data, error } = await q.range(van, van + 999)
    if (error) {
      console.error(`[club/avg] ${bron.tabel} lezen mislukt`, error.message)
      return null
    }
    const rijen = (data ?? []) as unknown as Rij[]
    uit.push(...rijen)
    if (rijen.length < 1000) break
  }
  return uit
}

async function leesLeadHistorie(admin: SupabaseClient, userId: string, leadIds: string[]): Promise<Rij[] | null> {
  if (leadIds.length === 0) return []
  const { data, error } = await admin.from('club_lead_historie').select('soort, tekst, auteur, op').eq('user_id', userId).in('lead_id', leadIds).order('op').limit(MAX_RIJEN)
  if (error) {
    console.error('[club/avg] lead-historie lezen mislukt', error.message)
    return null
  }
  return (data ?? []) as unknown as Rij[]
}

async function leesMedewerkers(admin: SupabaseClient, userId: string): Promise<Map<string, string> | null> {
  const { data, error } = await admin.from('club_medewerkers').select('id, naam').eq('user_id', userId).limit(2000)
  if (error) {
    console.error('[club/avg] medewerkers lezen mislukt', error.message)
    return null
  }
  return new Map((data ?? []).filter((m) => typeof m.id === 'string' && typeof m.naam === 'string').map((m) => [m.id as string, m.naam as string]))
}

/** Alles wat Club over dit lid bewaart. Lukt een deel niet, dan geen half bestand maar een fout. */
export async function haalExportRuw(admin: SupabaseClient, userId: string, lidId: string): Promise<Uitslag> {
  const { data: lid, error } = await admin.from('club_leden').select('*').eq('user_id', userId).eq('id', lidId).maybeSingle()
  if (error) return { ok: false, fout: 'lezen mislukt' }
  if (!lid) return { ok: false, fout: 'niet gevonden' }
  const sleutels = Object.keys(BRONNEN) as (keyof typeof BRONNEN)[]
  const [delen, medewerkers] = await Promise.all([Promise.all(sleutels.map((s) => leesAlles(admin, userId, lidId, BRONNEN[s]))), leesMedewerkers(admin, userId)])
  if (delen.some((d) => d === null) || !medewerkers) return { ok: false, fout: 'lezen mislukt' }
  const per = Object.fromEntries(sleutels.map((s, i) => [s, delen[i] as Rij[]])) as Record<keyof typeof BRONNEN, Rij[]>
  const leadIds = per.leads.map((l) => l.id).filter((id): id is string => typeof id === 'string')
  const leadHistorie = await leesLeadHistorie(admin, userId, leadIds)
  if (!leadHistorie) return { ok: false, fout: 'lezen mislukt' }
  return { ok: true, ruw: { lid: lid as Rij, ...per, leadHistorie }, medewerkers }
}

/** Het lopende verzoek tot verwijderen van dit lid; undefined bij een leesfout. */
export async function haalVerwijderverzoek(admin: SupabaseClient, userId: string, lidId: string): Promise<Verwijderverzoek | null | undefined> {
  const { data, error } = await admin.from('club_lid_verwijderingen').select('aangevraagd_op, definitief_op, aangevraagd_door').eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    console.error('[club/avg] verzoek lezen mislukt', error.message)
    return undefined
  }
  return verzoekUitRij(data)
}

/** Stap 1: aanvragen. Geeft de datum van definitief verwijderen, of de foutcode van de database. */
export async function vraagVerwijderenAan(admin: SupabaseClient, userId: string, lidId: string, door: string): Promise<{ ok: true; definitiefOp: string } | { ok: false; code?: string }> {
  const { data, error } = await admin.rpc('club_lid_verwijderen_aanvragen', { p_user: userId, p_lid: lidId, p_door: door.slice(0, 80) })
  if (error) {
    console.error('[club/avg] verwijderen aanvragen mislukt', error.code, error.message)
    return { ok: false, code: error.code }
  }
  return typeof data === 'string' ? { ok: true, definitiefOp: data } : { ok: false }
}

/** Terugdraaien binnen de termijn. true = teruggedraaid, false = er liep geen verzoek, null = fout. */
export async function draaiVerwijderenTerug(admin: SupabaseClient, userId: string, lidId: string): Promise<boolean | null> {
  const { data, error } = await admin.rpc('club_lid_verwijderen_terugdraaien', { p_user: userId, p_lid: lidId })
  if (error) {
    console.error('[club/avg] terugdraaien mislukt', error.message)
    return null
  }
  return data === true
}
