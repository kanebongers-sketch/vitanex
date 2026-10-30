// ─── Club, training: eigen schema's van een lid lezen en schrijven (SERVER) ─
// Elke query filtert op de sportschool (user_id) EN op het lid uit de sessie
// (lid_id). Een schema van een ander lid bestaat voor dit lid niet. Fouten
// worden gelogd zonder persoonsgegevens en geven null of false.

import type { SupabaseClient } from '@supabase/supabase-js'
import { coachingVoor } from '../coaching'
import type { SchemaInvoer } from '../invoer'
import { OEFENING_KOLOMMEN, REGEL_KOLOMMEN, isRij, oefeningUitRij, regelUitRij, tekstOfNull, type Oefening } from '../rijen'
import { vervangRegels } from '../schrijven'
import { isDoel, isNiveau, isUuid } from '../typen'
import { isMaker, kiesActief, lidSchemaInstellingNaarJson, lidSchemaInstellingUitJson, magBewerken, magVerwijderen, type LidSchemaInstelling, type Maker } from './regels'
import type { LidOefening, LidSchemaDetail, SchemaKeuze } from './typen'
import { kiesbaarVoorLid } from './voorstel'

function meld(wat: string, fout: { message: string }): null {
  console.error(`[club/lid-schemas] ${wat} mislukt`, fout.message)
  return null
}

export function lidOefening(o: Oefening): LidOefening {
  return {
    id: o.id, naam: o.naam, spiergroep: o.spiergroep, materiaal: o.materiaal, niveau: o.niveau, patroon: o.patroon,
    spierenPrimair: o.spierenPrimair, spierenSecundair: o.spierenSecundair, uitleg: o.uitleg, aandachtspunten: o.aandachtspunten,
  }
}

/** Alle oefeningen van de sportschool (voor het voorstel), of null bij een leesfout. */
export async function haalAlleOefeningen(admin: SupabaseClient, userId: string): Promise<Oefening[] | null> {
  const { data, error } = await admin.from('club_oefeningen').select(`${OEFENING_KOLOMMEN}, coaching`).eq('user_id', userId).eq('actief', true).limit(1000)
  if (error) return meld('oefeningen lezen', error)
  return (data ?? []).map(oefeningUitRij).filter((o): o is Oefening => o !== null)
}

/** Heeft deze oefening coaching (standaard of eigen van de sportschool)? */
export function heeftCoachingIn(eigen: ReadonlySet<string>): (o: Oefening) => boolean {
  return (o) => eigen.has(o.id) || coachingVoor(o.naam) !== null
}

/** Ids van oefeningen met eigen coaching van de sportschool. */
export async function eigenCoaching(admin: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await admin.from('club_oefeningen').select('id').eq('user_id', userId).not('coaching', 'is', null).limit(1000)
  if (error) meld('eigen coaching lezen', error)
  return new Set((data ?? []).map((r) => (isRij(r) && typeof r.id === 'string' ? r.id : '')).filter(Boolean))
}

/** De bibliotheek voor leden: kiesbaar, met Blender-render en coaching. Op naam gesorteerd. */
export async function haalLidBibliotheek(admin: SupabaseClient, userId: string): Promise<LidOefening[] | null> {
  const [alle, eigen] = await Promise.all([haalAlleOefeningen(admin, userId), eigenCoaching(admin, userId)])
  if (!alle) return null
  const coaching = heeftCoachingIn(eigen)
  return alle.filter((o) => kiesbaarVoorLid(o) && coaching(o)).map(lidOefening).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

interface SchemaRij {
  id: string
  naam: string
  maker: Maker
  lidId: string | null
  status: string
  doel: unknown
  niveau: unknown
  notitie: string | null
  dagTitels: string[]
  aangemaaktOp: string
  actiefGekozenOp: string | null
}

const KOP = 'id, naam, maker, lid_id, status, doel, niveau, notitie, dag_titels, aangemaakt_op, actief_gekozen_op'

function schemaRij(v: unknown): SchemaRij | null {
  if (!isRij(v)) return null
  const id = tekstOfNull(v.id)
  const naam = tekstOfNull(v.naam)
  if (!id || !naam || !isMaker(v.maker)) return null
  return {
    id, naam, maker: v.maker, lidId: tekstOfNull(v.lid_id), status: tekstOfNull(v.status) ?? '', doel: v.doel, niveau: v.niveau, notitie: tekstOfNull(v.notitie),
    dagTitels: Array.isArray(v.dag_titels) ? v.dag_titels.map((t) => (typeof t === 'string' ? t : '')) : [],
    aangemaaktOp: tekstOfNull(v.aangemaakt_op) ?? '', actiefGekozenOp: tekstOfNull(v.actief_gekozen_op),
  }
}

/** De actieve schema's van het lid (trainer en eigen), of null bij een leesfout. */
async function actieveSchemas(admin: SupabaseClient, userId: string, lidId: string): Promise<SchemaRij[] | null> {
  const { data, error } = await admin.from('club_schemas').select(KOP).eq('user_id', userId).eq('lid_id', lidId).eq('status', 'actief').order('aangemaakt_op', { ascending: false }).limit(50)
  if (error) return meld("schema's lezen", error)
  return (data ?? []).map(schemaRij).filter((s): s is SchemaRij => s !== null)
}

/** Het id van het schema dat het lid nu in de app ziet, of null. */
export async function actiefSchemaId(admin: SupabaseClient, userId: string, lidId: string): Promise<{ id: string | null; maker: Maker | null } | null> {
  const lijst = await actieveSchemas(admin, userId, lidId)
  if (!lijst) return null
  const gekozen = kiesActief(lijst)
  return { id: gekozen?.id ?? null, maker: gekozen?.maker ?? null }
}

/** De lijst "Mijn schema's", met het actieve schema bovenaan. */
export async function haalKeuzes(admin: SupabaseClient, userId: string, lidId: string, trainerAanpassen: boolean): Promise<SchemaKeuze[] | null> {
  const lijst = await actieveSchemas(admin, userId, lidId)
  if (!lijst) return null
  const actief = kiesActief(lijst)
  const keuzes = lijst.map((s) => ({
    id: s.id, naam: s.naam, maker: s.maker, dagen: Math.max(1, s.dagTitels.length), actief: s.id === actief?.id,
    magBewerken: magBewerken(s, lidId, trainerAanpassen), magVerwijderen: magVerwijderen(s, lidId),
  }))
  return [...keuzes].sort((a, b) => Number(b.actief) - Number(a.actief))
}

/** Hoeveel eigen schema's heeft het lid (alle statussen)? Null bij een leesfout. */
export async function telEigen(admin: SupabaseClient, userId: string, lidId: string): Promise<number | null> {
  const { count, error } = await admin.from('club_schemas').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lid_id', lidId).eq('maker', 'lid')
  if (error) return meld('eigen schema s tellen', error)
  return count ?? 0
}

/** Een schema van dit lid (actief), of null als het niet bestaat of niet van dit lid is. */
export async function haalSchemaVanLid(admin: SupabaseClient, userId: string, lidId: string, id: string): Promise<SchemaRij | null> {
  if (!isUuid(id) || !isUuid(lidId)) return null
  const { data, error } = await admin.from('club_schemas').select(KOP).eq('user_id', userId).eq('lid_id', lidId).eq('id', id).eq('status', 'actief').maybeSingle()
  if (error) return meld('schema lezen', error)
  return schemaRij(data)
}

/** Het schema met regels en de oefeningen erin, om te bewerken of te bekijken. */
export async function haalDetail(admin: SupabaseClient, userId: string, s: SchemaRij): Promise<LidSchemaDetail | null> {
  const regelRes = await admin.from('club_schema_oefeningen').select(REGEL_KOLOMMEN).eq('user_id', userId).eq('schema_id', s.id).order('dag').order('volgorde')
  if (regelRes.error) return meld('schema-oefeningen lezen', regelRes.error)
  const regels = (regelRes.data ?? []).map(regelUitRij).filter((r) => r !== null)
  const ids = [...new Set(regels.map((r) => r.oefeningId))]
  let oefeningen: LidOefening[] = []
  if (ids.length > 0) {
    const oefRes = await admin.from('club_oefeningen').select(OEFENING_KOLOMMEN).eq('user_id', userId).in('id', ids)
    if (oefRes.error) return meld('oefeningen van schema lezen', oefRes.error)
    oefeningen = (oefRes.data ?? []).map(oefeningUitRij).filter((o): o is Oefening => o !== null).map(lidOefening)
  }
  return {
    id: s.id, naam: s.naam, maker: s.maker, doel: isDoel(s.doel) ? s.doel : null, niveau: isNiveau(s.niveau) ? s.niveau : 1, dagTitels: s.dagTitels, regels, oefeningen,
  }
}

/** Ids van de oefeningen die nu in een schema staan. */
export async function oefeningenInSchema(admin: SupabaseClient, userId: string, schemaId: string): Promise<Set<string> | null> {
  const { data, error } = await admin.from('club_schema_oefeningen').select('oefening_id').eq('user_id', userId).eq('schema_id', schemaId)
  if (error) return meld('oefeningen van schema lezen', error)
  return new Set((data ?? []).map((r) => (isRij(r) && typeof r.oefening_id === 'string' ? r.oefening_id : '')).filter(Boolean))
}

/** Een nieuw eigen schema; het wordt meteen het actieve schema in de app. */
export async function maakEigenSchema(admin: SupabaseClient, userId: string, lidId: string, s: SchemaInvoer): Promise<string | null> {
  const nu = new Date().toISOString()
  const { data, error } = await admin
    .from('club_schemas')
    .insert({ user_id: userId, lid_id: lidId, maker: 'lid', naam: s.naam, doel: s.doel, niveau: s.niveau, weken: null, status: 'actief', medewerker_id: null, notitie: null, dag_titels: s.dagTitels, actief_gekozen_op: nu })
    .select('id')
    .single()
  if (error || !isRij(data) || typeof data.id !== 'string') {
    if (error) meld('eigen schema aanmaken', error)
    return null
  }
  const id = data.id
  if (!(await vervangRegels(admin, userId, id, s.regels))) {
    const weg = await admin.from('club_schemas').delete().eq('user_id', userId).eq('lid_id', lidId).eq('id', id)
    if (weg.error) meld('half schema opruimen', weg.error)
    return null
  }
  return id
}

/** Naam, doel, niveau, dagen en oefeningen bijwerken. Status, trainer en notitie blijven zoals ze waren. */
export async function werkSchemaBij(admin: SupabaseClient, userId: string, lidId: string, id: string, s: SchemaInvoer): Promise<boolean> {
  const { error } = await admin
    .from('club_schemas')
    .update({ naam: s.naam, doel: s.doel, niveau: s.niveau, dag_titels: s.dagTitels, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('id', id)
  if (error) {
    meld('schema bijwerken', error)
    return false
  }
  return vervangRegels(admin, userId, id, s.regels)
}

/** Dit schema wordt het actieve schema in de app. */
export async function kiesSchema(admin: SupabaseClient, userId: string, lidId: string, id: string): Promise<boolean> {
  const { error } = await admin.from('club_schemas').update({ actief_gekozen_op: new Date().toISOString() }).eq('user_id', userId).eq('lid_id', lidId).eq('id', id).eq('status', 'actief')
  if (error) meld('schema kiezen', error)
  return !error
}

/** Een eigen schema verwijderen; de trainingslog blijft (schema_id wordt leeg). */
export async function verwijderEigen(admin: SupabaseClient, userId: string, lidId: string, id: string): Promise<boolean> {
  const { error } = await admin.from('club_schemas').delete().eq('user_id', userId).eq('lid_id', lidId).eq('maker', 'lid').eq('id', id)
  if (error) meld('eigen schema verwijderen', error)
  return !error
}

/** De instelling van de sportschool (club_organisaties.instellingen.lid_schemas). Bij een leesfout: de standaard (nee). */
export async function haalLidSchemaInstelling(admin: SupabaseClient, organisatieId: string): Promise<LidSchemaInstelling> {
  const { data, error } = await admin.from('club_organisaties').select('instellingen').eq('id', organisatieId).maybeSingle()
  if (error) meld('instelling lezen', error)
  const ruw = isRij(data) && isRij(data.instellingen) ? data.instellingen.lid_schemas : undefined
  return lidSchemaInstellingUitJson(ruw)
}

/** De instelling opslaan; andere sleutels in de kolom blijven staan. */
export async function bewaarLidSchemaInstelling(admin: SupabaseClient, organisatieId: string, i: LidSchemaInstelling): Promise<boolean> {
  const huidig = await admin.from('club_organisaties').select('instellingen').eq('id', organisatieId).maybeSingle()
  if (huidig.error) {
    meld('instelling lezen', huidig.error)
    return false
  }
  const overig = isRij(huidig.data) && isRij(huidig.data.instellingen) ? huidig.data.instellingen : {}
  const { error } = await admin
    .from('club_organisaties')
    .update({ instellingen: { ...overig, lid_schemas: lidSchemaInstellingNaarJson(i) }, bijgewerkt_op: new Date().toISOString() })
    .eq('id', organisatieId)
  if (error) meld('instelling opslaan', error)
  return !error
}
