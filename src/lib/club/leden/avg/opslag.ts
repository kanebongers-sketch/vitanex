// ─── Club, AVG: lezen en verwijderen in de database (SERVER-ONLY) ───────────
// Alles filtert op de sportschool (user_id) en het lid. Het definitieve
// verwijderen zit in de database-functie (migratie 429), niet hier.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExportRuw, Rij } from './export'
import { verzoekUitRij, type Verwijderverzoek } from './verwijderen'

type Uitslag = { ok: true; ruw: ExportRuw; medewerkers: Map<string, string> } | { ok: false; fout: string }

/** Tabel, kolommen en het lid-filter per onderdeel van de export. */
export const AVG_BRONNEN: Record<Exclude<keyof ExportRuw, 'lid' | 'leadHistorie'>, { tabel: string; select: string; volgorde?: string }> = {
  bezoeken: { tabel: 'club_checkins', select: 'op, vestiging, bron', volgorde: 'op' },
  lesboekingen: { tabel: 'club_reserveringen', select: 'status, wachtpositie, bron, geboekt_op, geannuleerd_op, te_laat, club_lessen(start_op, vestiging, club_lestypen(naam))', volgorde: 'geboekt_op' },
  afspraken: { tabel: 'club_afspraken', select: 'start_op, eind_op, vestiging, medewerker_id, status, notitie, geboekt_door, geannuleerd_op, club_afspraak_typen(naam)', volgorde: 'start_op' },
  intakes: { tabel: 'club_intakes', select: 'datum, medewerker_id, antwoorden, metingen, toestemming_gezondheid, notitie, aangemaakt_op', volgorde: 'datum' },
  metingen: { tabel: 'club_metingen', select: '*', volgorde: 'datum' },
  schemas: {
    tabel: 'club_schemas',
    select: 'naam, doel, niveau, weken, status, notitie, dag_titels, medewerker_id, aangemaakt_op, bijgewerkt_op, club_schema_oefeningen(dag, volgorde, sets, herhalingen, tijd_sec, gewicht_kg, rpe, rir, tempo, groep, rust_sec, notitie, club_oefeningen(naam))',
    volgorde: 'aangemaakt_op',
  },
  trainingen: { tabel: 'club_trainingslog', select: 'op, dag, duur_sec, uitgevoerd', volgorde: 'op' },
  // Per set wat het lid in de ledenapp invulde (migratie 443).
  sets: { tabel: 'club_set_logs', select: 'op, set_nr, herhalingen, gewicht_kg, tijd_sec, club_oefeningen(naam)', volgorde: 'op' },
  voeding: { tabel: 'club_voedingsplannen', select: '*' },
  notities: { tabel: 'club_notities', select: 'tekst, auteur, vastgepind, aangemaakt_op', volgorde: 'aangemaakt_op' },
  challenges: { tabel: 'club_challenge_deelnemers', select: 'ingeschreven_op, club_challenges(titel)', volgorde: 'ingeschreven_op' },
  opvolgtaken: { tabel: 'club_opvolgtaken', select: 'regel, reden, status, medewerker_id, notitie, afgehandeld_door, afgehandeld_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  meldingen: { tabel: 'club_meldingen', select: 'soort, kanaal, onderwerp, inhoud, status, gepland_op, verstuurd_op, gelezen_op', volgorde: 'gepland_op' },
  meldingVoorkeuren: { tabel: 'club_meldingen_voorkeuren', select: 'herinneringen_per_mail, mails, push, gewijzigd_op' },
  // Nooit het endpoint of de sleutels: alleen welk toestel en wanneer.
  pushToestellen: { tabel: 'club_push_abonnementen', select: 'user_agent, aangemaakt_op, laatst_gebruikt_op', volgorde: 'aangemaakt_op' },
  // Nooit de code, wachtwoord_hash, pin_hash of token_hash: alleen wat het lid mag weten.
  ledenapp: { tabel: 'club_lid_toegang', select: 'actief, email, wachtwoord_gekozen_op, pin_gekozen_op, laatst_ingelogd_op, aangemaakt_op' },
  sessies: { tabel: 'club_lid_sessies', select: 'aangemaakt_op, laatst_gebruikt_op, verloopt_op', volgorde: 'aangemaakt_op' },
  leads: { tabel: 'club_leads', select: 'id, naam, email, telefoon, vestiging, bron, interesse, status, proefles_op, verloren_reden, toestemming_contact, aangemaakt_op', volgorde: 'aangemaakt_op' },
  verwijderverzoek: { tabel: 'club_lid_verwijderingen', select: 'aangevraagd_op, definitief_op' },
  communityGroepen: { tabel: 'club_community_groepsleden', select: 'status, toegevoegd_door, aangemaakt_op, club_community_groepen(naam)', volgorde: 'aangemaakt_op' },
  communityBerichten: { tabel: 'club_community_berichten', select: 'tekst, status, aangemaakt_op, club_community_groepen(naam)', volgorde: 'aangemaakt_op' },
  communityReacties: { tabel: 'club_community_reacties', select: 'soort, aangemaakt_op', volgorde: 'aangemaakt_op' },
  communityMeldingen: { tabel: 'club_community_meldingen', select: 'reden, toelichting, status, aangemaakt_op', volgorde: 'aangemaakt_op' },
  communityVoorkeur: { tabel: 'club_community_voorkeuren', select: 'op_ranglijst, gewijzigd_op' },
  // Betalen (migratie 439): nooit Stripe-kenmerken of de platformfee.
  aankopen: { tabel: 'club_betalen_verkopen', select: 'product_naam, type, bedrag_cent, btw_procent, status, betaald_op, terugbetaald_cent, terugbetaald_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  tegoeden: { tabel: 'club_betalen_tegoeden', select: 'product_naam, soort, totaal, saldo, geldig_tot, aangemaakt_op', volgorde: 'aangemaakt_op' },
  tegoedMutaties: { tabel: 'club_betalen_mutaties', select: 'aantal, reden, door, op', volgorde: 'op' },
  // Lidgeld (migratie 460 en 461): nooit stripe_*-kolommen, hashes of pdf-paden.
  betaalklant: { tabel: 'club_betalen_klanten', select: 'aangemaakt_op' },
  betaalmethoden: { tabel: 'club_betalen_mandaten', select: 'type, laatste4, status, is_standaard, bron, machtiging_kenmerk, ondertekend_op, laatste_incasso_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  contracten: {
    tabel: 'club_betalen_contracten',
    select: 'plan_naam, status, interval_soort, bedrag_cent, btw_procent, contract_maanden, opzegtermijn_dagen, startdatum, einddatum, opgezegd_op, opzeg_einddatum, voorwaarden_versie, akkoord_op, notitie, aangemaakt_op',
    volgorde: 'aangemaakt_op',
  },
  contractPauzes: { tabel: 'club_betalen_pauzes', select: 'van, tot, status, reden, verrekening_cent, aangemaakt_op', volgorde: 'van' },
  facturen: {
    tabel: 'club_betalen_facturen',
    select: 'nummer, soort, status, uitgegeven_op, vervaldatum, periode_van, periode_tot, subtotaal_excl_cent, btw_cent, totaal_cent, betaald_cent, betaald_op, klant_naam, klant_adres, klant_email, club_betalen_factuurregels(volgorde, omschrijving, aantal, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)',
    volgorde: 'aangemaakt_op',
  },
  betalingen: { tabel: 'club_betalen_betalingen', select: 'soort, poging, bedrag_cent, status, fout_categorie, aangeboden_op, verwerkt_op, mislukt_op, gestorneerd_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  terugbetalingen: { tabel: 'club_betalen_terugbetalingen', select: 'bedrag_cent, status, reden_code, toelichting, aangemaakt_op, verwerkt_op', volgorde: 'aangemaakt_op' },
  geschillen: { tabel: 'club_betalen_geschillen', select: 'bedrag_cent, status, reden_code, toelichting, aangemaakt_op, gesloten_op', volgorde: 'aangemaakt_op' },
  betaalherinneringen: { tabel: 'club_betalen_herinneringen', select: 'stap, kanaal, status, gepland_op, verstuurd_op', volgorde: 'gepland_op' },
  kasboek: { tabel: 'club_betalen_boekingen', select: 'soort, bedrag_cent, boekdatum, aangemaakt_op', volgorde: 'aangemaakt_op' },
  betaalopdrachten: { tabel: 'club_betalen_opdrachten', select: 'soort, status, aangemaakt_op, klaar_op', volgorde: 'aangemaakt_op' },
  // Health-apps (migratie 463): nooit tokens_versleuteld, cursor of het id bij de leverancier.
  healthToestemmingen: { tabel: 'club_health_toestemmingen', select: 'delen, trainer_zien, trainer_bronnen, tekst_versie, gegeven_op, ingetrokken_op', volgorde: 'gegeven_op' },
  healthKoppelingen: { tabel: 'club_health_koppelingen', select: 'bron, status, laatste_sync_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  healthMetingen: { tabel: 'club_health_metingen', select: 'gemeten_op, soort, waarde, training, bron', volgorde: 'gemeten_op' },
  // Voedingsdagboek (migratie 466).
  voedingKeuzes: { tabel: 'club_voeding_instellingen', select: 'gestart_op, tekst_versie, trainer_zien, trainer_zien_op, kcal, eiwit_g, koolhydraten_g, vet_g' },
  voedingDagboek: { tabel: 'club_voeding_logs', select: 'datum, maaltijd, naam, merk, gram, maat, aantal, kcal, eiwit_g, koolhydraten_g, vet_g, vezels_g, bron, aangemaakt_op', volgorde: 'datum' },
  voedingProducten: { tabel: 'club_voeding_producten', select: 'naam, merk, barcode, kcal_100g, eiwit_100g, koolhydraten_100g, vet_100g, vezels_100g, portie_gram, aangemaakt_op', volgorde: 'aangemaakt_op' },
  voedingFavorieten: { tabel: 'club_voeding_favorieten', select: 'naam, merk, portie_gram, aangemaakt_op', volgorde: 'aangemaakt_op' },
  // Profielfoto (migratie 473): nooit het pad in de opslag.
  profielfoto: { tabel: 'club_profielfotos', select: 'bron, toegevoegd_door, toestemming_op, toestemming_tekst_versie, aangemaakt_op', volgorde: 'aangemaakt_op' },
}

const MAX_RIJEN = 10_000

async function leesAlles(admin: SupabaseClient, userId: string, lidId: string, bron: (typeof AVG_BRONNEN)[keyof typeof AVG_BRONNEN]): Promise<Rij[] | null> {
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
  const sleutels = Object.keys(AVG_BRONNEN) as (keyof typeof AVG_BRONNEN)[]
  const [delen, medewerkers] = await Promise.all([Promise.all(sleutels.map((s) => leesAlles(admin, userId, lidId, AVG_BRONNEN[s]))), leesMedewerkers(admin, userId)])
  if (delen.some((d) => d === null) || !medewerkers) return { ok: false, fout: 'lezen mislukt' }
  const per = Object.fromEntries(sleutels.map((s, i) => [s, delen[i] as Rij[]])) as Record<keyof typeof AVG_BRONNEN, Rij[]>
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
