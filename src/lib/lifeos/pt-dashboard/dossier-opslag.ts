// ─── LifeOS — PT-dashboard: klantdossier (SERVER-ONLY) ──────────────────────
// `pt_intakes`, `pt_metingen` (migratie 356) en `pt_klantnotities` (364). Elke query is gescoped op de
// PT'er achter de link (user_id + persoon_id) én op een klant van díe PT'er:
// een klant-id van een andere PT'er geeft altijd 'niet_gevonden'.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import { intakeDatum, leesIntakeAntwoorden, type Intake, type IntakeAntwoorden } from './intake'
import { leesMeting, type Meting, type MetingInvoer } from './metingen'
import { leesKlantNotitie, type KlantNotitie, type KlantNotitieInvoer } from './klantnotities'

export type DossierUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' | 'te_veel' }

/** Zoveel metingen per klant maximaal — evenveel als `haalMetingen` toont, zodat er nooit metingen "verdwijnen". */
export const MAX_METINGEN_PER_KLANT = 200

const METING_KOLOMMEN =
  'id, datum, soort, gewicht_kg, vet_pct, taille_cm, heup_cm, borst_cm, arm_cm, been_cm, cardiotest, kracht_oefening, kracht_rm, kracht_kg, fotos_gemaakt, notitie'

interface MetingRij {
  id: string
  datum: string
  soort: string
  gewicht_kg: number | string | null
  taille_cm: number | string | null
  heup_cm: number | string | null
  borst_cm: number | string | null
  arm_cm: number | string | null
  been_cm: number | string | null
  vet_pct: number | string | null
  cardiotest: string | null
  kracht_oefening: string | null
  kracht_rm: number | null
  kracht_kg: number | string | null
  fotos_gemaakt: boolean
  notitie: string | null
}

function vanMetingRij(r: MetingRij): Meting | null {
  return leesMeting({
    id: r.id, datum: r.datum, soort: r.soort,
    gewichtKg: r.gewicht_kg, vetPct: r.vet_pct, tailleCm: r.taille_cm, heupCm: r.heup_cm, borstCm: r.borst_cm, armCm: r.arm_cm, beenCm: r.been_cm,
    cardiotest: r.cardiotest, krachtOefening: r.kracht_oefening, krachtRm: r.kracht_rm, krachtKg: r.kracht_kg,
    fotosGemaakt: r.fotos_gemaakt, notitie: r.notitie,
  })
}

function naarMetingRij(m: MetingInvoer) {
  return {
    datum: m.datum, soort: m.soort,
    gewicht_kg: m.gewichtKg, vet_pct: m.vetPct, taille_cm: m.tailleCm, heup_cm: m.heupCm, borst_cm: m.borstCm, arm_cm: m.armCm, been_cm: m.beenCm,
    cardiotest: m.cardiotest, kracht_oefening: m.krachtOefening, kracht_rm: m.krachtRm, kracht_kg: m.krachtKg,
    fotos_gemaakt: m.fotosGemaakt, notitie: m.notitie,
  }
}

/** Hoort deze klant bij de PT'er achter de link? null bij een databasefout. */
async function eigenKlant(admin: SupabaseClient, link: LeadLink, klantId: string): Promise<boolean | null> {
  const { data, error } = await admin
    .from('pt_klanten')
    .select('id')
    .eq('id', klantId)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .maybeSingle()
  if (error) return null
  return data !== null
}

async function metKlant<T>(admin: SupabaseClient, link: LeadLink, klantId: string, doe: () => Promise<DossierUitkomst<T>>): Promise<DossierUitkomst<T>> {
  const eigen = await eigenKlant(admin, link, klantId)
  if (eigen === null) return { ok: false, reden: 'db' }
  return eigen ? doe() : { ok: false, reden: 'niet_gevonden' }
}

// ─── Intake ───────────────────────────────────────────────────────────────────

const INTAKE_KOLOMMEN = 'antwoorden, ingevuld_op, bijgewerkt_op'

interface IntakeRij {
  antwoorden: unknown
  ingevuld_op: string | null
  bijgewerkt_op: string
}

const vanIntakeRij = (r: IntakeRij): Intake => ({
  antwoorden: leesIntakeAntwoorden(r.antwoorden),
  ingevuldOp: r.ingevuld_op,
  bijgewerktOp: r.bijgewerkt_op,
})

export async function haalIntake(admin: SupabaseClient, link: LeadLink, klantId: string): Promise<DossierUitkomst<Intake | null>> {
  const { data, error } = await admin
    .from('pt_intakes')
    .select(INTAKE_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: data ? vanIntakeRij(data as IntakeRij) : null }
}

export async function bewaarIntake(
  admin: SupabaseClient, link: LeadLink, klantId: string, antwoorden: IntakeAntwoorden,
): Promise<DossierUitkomst<Intake>> {
  return metKlant(admin, link, klantId, async () => {
    const rij = {
      klant_id: klantId,
      user_id: link.userId,
      persoon_id: link.persoonId,
      antwoorden,
      ingevuld_op: intakeDatum(antwoorden),
      bijgewerkt_op: new Date().toISOString(),
    }
    const { data, error } = await admin
      .from('pt_intakes')
      .upsert(rij, { onConflict: 'klant_id' })
      .select(INTAKE_KOLOMMEN)
      .single()
    if (error || !data) return { ok: false, reden: 'db' }
    return { ok: true, waarde: vanIntakeRij(data as IntakeRij) }
  })
}

// ─── Metingen ─────────────────────────────────────────────────────────────────

export async function haalMetingen(admin: SupabaseClient, link: LeadLink, klantId: string): Promise<DossierUitkomst<Meting[]>> {
  const { data, error } = await admin
    .from('pt_metingen')
    .select(METING_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .order('datum', { ascending: true })
    .limit(MAX_METINGEN_PER_KLANT)
  if (error) return { ok: false, reden: 'db' }
  const rijen = Array.isArray(data) ? (data as MetingRij[]) : []
  return { ok: true, waarde: rijen.flatMap((r) => vanMetingRij(r) ?? []) }
}

export async function voegMetingToe(admin: SupabaseClient, link: LeadLink, klantId: string, m: MetingInvoer): Promise<DossierUitkomst<Meting>> {
  return metKlant(admin, link, klantId, async () => {
    const { count, error: telFout } = await admin
      .from('pt_metingen')
      .select('id', { count: 'exact', head: true })
      .eq('klant_id', klantId)
      .eq('user_id', link.userId)
    if (telFout) return { ok: false, reden: 'db' }
    if ((count ?? 0) >= MAX_METINGEN_PER_KLANT) return { ok: false, reden: 'te_veel' }
    const { data, error } = await admin
      .from('pt_metingen')
      .insert({ klant_id: klantId, user_id: link.userId, persoon_id: link.persoonId, ...naarMetingRij(m) })
      .select(METING_KOLOMMEN)
      .single()
    const uit = !error && data ? vanMetingRij(data as MetingRij) : null
    return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'db' }
  })
}

/**
 * Een meting verwijderen. Eerst controleren dat de klant nú van deze trainer
 * is (`metKlant`): een meting-rij die nog de oude `persoon_id` draagt, mag een
 * vorige trainer niet meer kunnen weghalen nadat de klant is verplaatst.
 */
export async function verwijderMeting(admin: SupabaseClient, link: LeadLink, klantId: string, metingId: string): Promise<DossierUitkomst<null>> {
  return metKlant(admin, link, klantId, async () => {
    const { data, error } = await admin
      .from('pt_metingen')
      .delete()
      .eq('id', metingId)
      .eq('klant_id', klantId)
      .eq('user_id', link.userId)
      .eq('persoon_id', link.persoonId)
      .select('id')
    if (error) return { ok: false, reden: 'db' }
    return Array.isArray(data) && data.length === 1 ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
  })
}

// ─── Logboek (migratie 364) ───────────────────────────────────────────────────

/** Zoveel notities per klant maximaal — evenveel als `haalNotities` toont. */
export const MAX_NOTITIES_PER_KLANT = 500

const NOTITIE_KOLOMMEN = 'id, datum, soort, tekst, aangemaakt_op'

interface NotitieRij {
  id: string
  datum: string
  soort: string
  tekst: string
  aangemaakt_op: string
}

const vanNotitieRij = (r: NotitieRij): KlantNotitie | null =>
  leesKlantNotitie({ id: r.id, datum: r.datum, soort: r.soort, tekst: r.tekst, aangemaaktOp: r.aangemaakt_op })

export async function haalNotities(admin: SupabaseClient, link: LeadLink, klantId: string): Promise<DossierUitkomst<KlantNotitie[]>> {
  const { data, error } = await admin
    .from('pt_klantnotities')
    .select(NOTITIE_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .order('datum', { ascending: false })
    .limit(MAX_NOTITIES_PER_KLANT)
  if (error) return { ok: false, reden: 'db' }
  const rijen = Array.isArray(data) ? (data as NotitieRij[]) : []
  return { ok: true, waarde: rijen.flatMap((r) => vanNotitieRij(r) ?? []) }
}

export async function voegNotitieToe(admin: SupabaseClient, link: LeadLink, klantId: string, n: KlantNotitieInvoer): Promise<DossierUitkomst<KlantNotitie>> {
  return metKlant(admin, link, klantId, async () => {
    const { count, error: telFout } = await admin
      .from('pt_klantnotities')
      .select('id', { count: 'exact', head: true })
      .eq('klant_id', klantId)
      .eq('user_id', link.userId)
    if (telFout) return { ok: false, reden: 'db' }
    if ((count ?? 0) >= MAX_NOTITIES_PER_KLANT) return { ok: false, reden: 'te_veel' }
    const { data, error } = await admin
      .from('pt_klantnotities')
      .insert({ klant_id: klantId, user_id: link.userId, persoon_id: link.persoonId, datum: n.datum, soort: n.soort, tekst: n.tekst })
      .select(NOTITIE_KOLOMMEN)
      .single()
    const uit = !error && data ? vanNotitieRij(data as NotitieRij) : null
    return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'db' }
  })
}

export async function verwijderNotitie(admin: SupabaseClient, link: LeadLink, klantId: string, notitieId: string): Promise<DossierUitkomst<null>> {
  return metKlant(admin, link, klantId, async () => {
    const { data, error } = await admin
      .from('pt_klantnotities')
      .delete()
      .eq('id', notitieId)
      .eq('klant_id', klantId)
      .eq('user_id', link.userId)
      .eq('persoon_id', link.persoonId)
      .select('id')
    if (error) return { ok: false, reden: 'db' }
    return Array.isArray(data) && data.length === 1 ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
  })
}

// ─── Dossierstand over meerdere klanten (voor het overzicht) ─────────────────

export interface DossierStand {
  intake: boolean
  startmeting: boolean
  /** Datum van de laatste meting of weging, of null. */
  laatsteMeting: string | null
  /** Datum van de laatste training of no-show in het logboek, of null. */
  laatsteSessie: string | null
}

/** Per klant van deze PT'er: is de intake er, is er een nulmeting, wanneer was de laatste meting/sessie. Fout → lege map. */
export async function haalDossierStand(admin: SupabaseClient, link: LeadLink, klantIds: readonly string[]): Promise<Map<string, DossierStand>> {
  const uit = new Map<string, DossierStand>()
  if (klantIds.length === 0) return uit
  for (const id of klantIds) uit.set(id, { intake: false, startmeting: false, laatsteMeting: null, laatsteSessie: null })
  const ids = [...klantIds]
  const [intakes, metingen, notities] = await Promise.all([
    admin.from('pt_intakes').select('klant_id').eq('user_id', link.userId).eq('persoon_id', link.persoonId).in('klant_id', ids),
    admin.from('pt_metingen').select('klant_id, soort, datum').eq('user_id', link.userId).eq('persoon_id', link.persoonId).in('klant_id', ids),
    admin.from('pt_klantnotities').select('klant_id, datum').eq('user_id', link.userId).eq('persoon_id', link.persoonId).in('klant_id', ids).in('soort', ['training', 'no_show']),
  ])
  for (const r of (intakes.data ?? []) as { klant_id: string }[]) {
    const s = uit.get(r.klant_id)
    if (s) s.intake = true
  }
  for (const r of (metingen.data ?? []) as { klant_id: string; soort: string; datum: string }[]) {
    const s = uit.get(r.klant_id)
    if (!s) continue
    if (r.soort === 'start') s.startmeting = true
    if (s.laatsteMeting === null || r.datum > s.laatsteMeting) s.laatsteMeting = r.datum
  }
  for (const r of (notities.data ?? []) as { klant_id: string; datum: string }[]) {
    const s = uit.get(r.klant_id)
    if (s && (s.laatsteSessie === null || r.datum > s.laatsteSessie)) s.laatsteSessie = r.datum
  }
  return uit
}
