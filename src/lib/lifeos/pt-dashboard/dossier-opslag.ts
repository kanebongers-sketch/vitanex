// ─── LifeOS — PT-dashboard: klantdossier (SERVER-ONLY) ──────────────────────
// `pt_intakes` en `pt_metingen` (migratie 356). Elke query is gescoped op de
// PT'er achter de link (user_id + persoon_id) én op een klant van díe PT'er:
// een klant-id van een andere PT'er geeft altijd 'niet_gevonden'.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import { intakeDatum, leesIntakeAntwoorden, type Intake, type IntakeAntwoorden } from './intake'
import { leesMeting, type Meting, type MetingInvoer } from './metingen'

export type DossierUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' }

const METING_KOLOMMEN =
  'id, datum, soort, gewicht_kg, taille_cm, heup_cm, borst_cm, arm_cm, been_cm, cardiotest, kracht_oefening, kracht_rm, kracht_kg, fotos_gemaakt, notitie'

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
    gewichtKg: r.gewicht_kg, tailleCm: r.taille_cm, heupCm: r.heup_cm, borstCm: r.borst_cm, armCm: r.arm_cm, beenCm: r.been_cm,
    cardiotest: r.cardiotest, krachtOefening: r.kracht_oefening, krachtRm: r.kracht_rm, krachtKg: r.kracht_kg,
    fotosGemaakt: r.fotos_gemaakt, notitie: r.notitie,
  })
}

function naarMetingRij(m: MetingInvoer) {
  return {
    datum: m.datum, soort: m.soort,
    gewicht_kg: m.gewichtKg, taille_cm: m.tailleCm, heup_cm: m.heupCm, borst_cm: m.borstCm, arm_cm: m.armCm, been_cm: m.beenCm,
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
    .limit(200)
  if (error) return { ok: false, reden: 'db' }
  const rijen = Array.isArray(data) ? (data as MetingRij[]) : []
  return { ok: true, waarde: rijen.flatMap((r) => vanMetingRij(r) ?? []) }
}

export async function voegMetingToe(admin: SupabaseClient, link: LeadLink, klantId: string, m: MetingInvoer): Promise<DossierUitkomst<Meting>> {
  return metKlant(admin, link, klantId, async () => {
    const { data, error } = await admin
      .from('pt_metingen')
      .insert({ klant_id: klantId, user_id: link.userId, persoon_id: link.persoonId, ...naarMetingRij(m) })
      .select(METING_KOLOMMEN)
      .single()
    const uit = !error && data ? vanMetingRij(data as MetingRij) : null
    return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'db' }
  })
}

export async function verwijderMeting(admin: SupabaseClient, link: LeadLink, klantId: string, metingId: string): Promise<DossierUitkomst<null>> {
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
}
