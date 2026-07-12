// ─── Coaching-taken — server-helpers ────────────────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/taken/* routes ná de auth-check. Bevat de kern-logica voor
// het beheren van taken (coach) en het afvinken ervan (klant).
//
// Belangrijk: een succesvolle completie schrijft OOK een rij in `gewoonte_logs`
// (sleutel `coaching:<taak_id>`), zodat de bestaande streak- en achievement-
// infrastructuur (zie /api/streak en /api/achievements/check) meteen mee leeft.

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL } from '@/lib/utils/date-nl'
import {
  isPijler,
  isFrequentie,
  type CoachingTaak,
  type Frequentie,
  type Pijler,
  type TaakMetVoortgang,
} from '@/lib/coaching/taken'

type Admin = ReturnType<typeof createAdminClient>

const TAAK_KOLOMMEN =
  'id, coach_id, klant_id, titel, beschrijving, pijler, frequentie, target_per_week, actief, aangemaakt_op, bijgewerkt_op'

export interface NieuweTaakInput {
  klant_id?: string
  titel?: string
  beschrijving?: string | null
  pijler?: string
  frequentie?: string
  target_per_week?: number
}

export interface TaakPatchInput {
  titel?: string
  beschrijving?: string | null
  pijler?: string
  frequentie?: string
  target_per_week?: number
  actief?: boolean
}

type Falen = { ok: false; status: number; fout: string }
type Slagen<T> = { ok: true } & T

// ─── Datum-helpers ───────────────────────────────────────────────────────────
/** Maandag (YYYY-MM-DD) van de week waarin de NL-'vandaag' valt. */
function weekStartNL(): string {
  const [jaar, maand, dag] = vandaagNL().split('-').map(Number)
  // Behandel de NL-kalenderdatum als een pure datum in UTC om tz-drift te mijden.
  const d = new Date(Date.UTC(jaar, maand - 1, dag))
  const dagVanWeek = d.getUTCDay() // 0 = zondag
  const sindsMaandag = (dagVanWeek + 6) % 7
  d.setUTCDate(d.getUTCDate() - sindsMaandag)
  return d.toISOString().slice(0, 10)
}

// ─── Verificatie ─────────────────────────────────────────────────────────────
/** True als er een ACTIEVE coach↔klant-relatie bestaat (coach beheert klant). */
async function isActieveRelatie(admin: Admin, coachId: string, klantId: string): Promise<boolean> {
  const { data } = await admin
    .from('coach_klanten')
    .select('id')
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .eq('status', 'actief')
    .maybeSingle()
  return Boolean(data)
}

// ─── Voortgang verrijken ─────────────────────────────────────────────────────
/** Voegt week-voortgang (deze_week_gehaald, vandaag_gehaald) toe aan taken. */
async function verrijkMetVoortgang(admin: Admin, taken: CoachingTaak[]): Promise<TaakMetVoortgang[]> {
  if (taken.length === 0) return []

  const taakIds = taken.map(t => t.id)
  const weekStart = weekStartNL()
  const vandaag = vandaagNL()

  const { data: logs } = await admin
    .from('coaching_taak_logs')
    .select('taak_id, datum')
    .in('taak_id', taakIds)
    .eq('gehaald', true)
    .gte('datum', weekStart)

  const weekTeller = new Map<string, number>()
  const vandaagGehaald = new Set<string>()
  for (const log of logs ?? []) {
    const datum = String(log.datum).slice(0, 10)
    weekTeller.set(log.taak_id, (weekTeller.get(log.taak_id) ?? 0) + 1)
    if (datum === vandaag) vandaagGehaald.add(log.taak_id)
  }

  return taken.map(t => ({
    ...t,
    deze_week_gehaald: weekTeller.get(t.id) ?? 0,
    vandaag_gehaald: vandaagGehaald.has(t.id),
  }))
}

// ─── Coach: taken van één klant ──────────────────────────────────────────────
/** Alle taken (actief + inactief) van een klant, mét voortgang. Verifieert relatie. */
export async function getTakenVoorKlant(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<Falen | Slagen<{ taken: TaakMetVoortgang[] }>> {
  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const { data, error } = await admin
    .from('coaching_taken')
    .select(TAAK_KOLOMMEN)
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .order('actief', { ascending: false })
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, status: 500, fout: 'Taken ophalen mislukt.' }

  const taken = await verrijkMetVoortgang(admin, (data ?? []) as CoachingTaak[])
  return { ok: true, taken }
}

// ─── Coach: taak aanmaken ────────────────────────────────────────────────────
function normaliseerNieuweTaak(input: NieuweTaakInput):
  | { ok: true; titel: string; beschrijving: string | null; pijler: Pijler; frequentie: Frequentie; target: number }
  | { ok: false; fout: string } {
  const titel = (input.titel ?? '').trim()
  if (titel.length < 2) return { ok: false, fout: 'Geef de taak een duidelijke titel.' }
  if (titel.length > 120) return { ok: false, fout: 'De titel mag maximaal 120 tekens zijn.' }

  const pijler: Pijler = isPijler(input.pijler) ? input.pijler : 'body'
  const frequentie: Frequentie = isFrequentie(input.frequentie) ? input.frequentie : 'dagelijks'

  // Dagelijks = elke dag (7); wekelijks = door de coach gekozen doel, geklemd 1–7.
  const gevraagd = Number.isFinite(input.target_per_week) ? Number(input.target_per_week) : 3
  const target = frequentie === 'dagelijks' ? 7 : Math.min(7, Math.max(1, Math.round(gevraagd)))

  const beschrijving = (input.beschrijving ?? '').trim() || null
  return { ok: true, titel, beschrijving, pijler, frequentie, target }
}

/** Maakt een taak voor een klant. Verifieert de relatie server-side. */
export async function maakTaak(
  admin: Admin,
  coachId: string,
  input: NieuweTaakInput,
): Promise<Falen | Slagen<{ taak: CoachingTaak }>> {
  const klantId = (input.klant_id ?? '').trim()
  if (!klantId) return { ok: false, status: 400, fout: 'klant_id is verplicht.' }

  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const genormaliseerd = normaliseerNieuweTaak(input)
  if (!genormaliseerd.ok) return { ok: false, status: 400, fout: genormaliseerd.fout }

  const { data, error } = await admin
    .from('coaching_taken')
    .insert({
      coach_id: coachId,
      klant_id: klantId,
      titel: genormaliseerd.titel,
      beschrijving: genormaliseerd.beschrijving,
      pijler: genormaliseerd.pijler,
      frequentie: genormaliseerd.frequentie,
      target_per_week: genormaliseerd.target,
    })
    .select(TAAK_KOLOMMEN)
    .single()

  if (error || !data) return { ok: false, status: 500, fout: 'Taak aanmaken mislukt.' }
  return { ok: true, taak: data as CoachingTaak }
}

// ─── Coach: taak wijzigen ────────────────────────────────────────────────────
function bouwPatch(
  input: TaakPatchInput,
): { ok: true; patch: Record<string, unknown> } | { ok: false; fout: string } {
  const patch: Record<string, unknown> = {}

  if (input.titel !== undefined) {
    const titel = input.titel.trim()
    if (titel.length < 2) return { ok: false, fout: 'Geef de taak een duidelijke titel.' }
    if (titel.length > 120) return { ok: false, fout: 'De titel mag maximaal 120 tekens zijn.' }
    patch.titel = titel
  }
  if (input.beschrijving !== undefined) patch.beschrijving = (input.beschrijving ?? '').trim() || null
  if (input.pijler !== undefined) {
    if (!isPijler(input.pijler)) return { ok: false, fout: 'Ongeldige pijler.' }
    patch.pijler = input.pijler
  }
  if (input.frequentie !== undefined) {
    if (!isFrequentie(input.frequentie)) return { ok: false, fout: 'Ongeldige frequentie.' }
    patch.frequentie = input.frequentie
  }
  if (input.target_per_week !== undefined) {
    const t = Number(input.target_per_week)
    if (!Number.isFinite(t)) return { ok: false, fout: 'Ongeldig weekdoel.' }
    patch.target_per_week = Math.min(7, Math.max(1, Math.round(t)))
  }
  if (input.actief !== undefined) patch.actief = Boolean(input.actief)

  return { ok: true, patch }
}

/** Wijzigt/deactiveert een taak. Verifieert eigenaarschap (coach_id = coach). */
export async function wijzigTaak(
  admin: Admin,
  coachId: string,
  taakId: string,
  input: TaakPatchInput,
): Promise<Falen | Slagen<{ taak: CoachingTaak }>> {
  const resultaat = bouwPatch(input)
  if (!resultaat.ok) return { ok: false, status: 400, fout: resultaat.fout }
  if (Object.keys(resultaat.patch).length === 0) return { ok: false, status: 400, fout: 'Geen wijzigingen opgegeven.' }

  const { data, error } = await admin
    .from('coaching_taken')
    .update(resultaat.patch)
    .eq('id', taakId)
    .eq('coach_id', coachId) // eigenaarschap afgedwongen in de query
    .select(TAAK_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Taak bijwerken mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Taak niet gevonden.' }
  return { ok: true, taak: data as CoachingTaak }
}

/** Verwijdert een taak (en via cascade z'n logs). Verifieert eigenaarschap. */
export async function verwijderTaak(
  admin: Admin,
  coachId: string,
  taakId: string,
): Promise<Falen | Slagen<Record<never, never>>> {
  const { data, error } = await admin
    .from('coaching_taken')
    .delete()
    .eq('id', taakId)
    .eq('coach_id', coachId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Taak verwijderen mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Taak niet gevonden.' }
  return { ok: true }
}

// ─── Klant: completie loggen ─────────────────────────────────────────────────
/** Telt de 'gehaald'-logs van deze week voor één taak (na een mutatie). */
async function telWeekVoortgang(admin: Admin, taakId: string): Promise<number> {
  const { count } = await admin
    .from('coaching_taak_logs')
    .select('*', { count: 'exact', head: true })
    .eq('taak_id', taakId)
    .eq('gehaald', true)
    .gte('datum', weekStartNL())
  return count ?? 0
}

/**
 * Vinkt een taak voor vandaag af (of terug). Verifieert dat de taak bij deze
 * klant hoort. Bij `gehaald` schrijft dit ook een `gewoonte_logs`-rij zodat de
 * streak/achievements gaan leven; bij afvinken-uit wordt die weer verwijderd.
 */
export async function logCompletie(
  admin: Admin,
  klantId: string,
  taakId: string,
  gehaald: boolean,
  notitie: string | null,
): Promise<Falen | Slagen<{ vandaag_gehaald: boolean; deze_week_gehaald: number }>> {
  if (!taakId) return { ok: false, status: 400, fout: 'taak_id is verplicht.' }

  const { data: taak } = await admin
    .from('coaching_taken')
    .select('id, klant_id, actief')
    .eq('id', taakId)
    .maybeSingle()

  if (!taak || taak.klant_id !== klantId) {
    return { ok: false, status: 404, fout: 'Taak niet gevonden.' }
  }
  if (!taak.actief) {
    return { ok: false, status: 409, fout: 'Deze taak is niet meer actief.' }
  }

  const datum = vandaagNL()

  const { error: logFout } = await admin
    .from('coaching_taak_logs')
    .upsert(
      { taak_id: taakId, klant_id: klantId, datum, gehaald, notitie: notitie?.trim() || null },
      { onConflict: 'taak_id,datum' },
    )
  if (logFout) return { ok: false, status: 500, fout: 'Afvinken mislukt.' }

  // Spiegel naar gewoonte_logs zodat streak/achievements meetellen.
  const gewoonte = `coaching:${taakId}`
  if (gehaald) {
    await admin
      .from('gewoonte_logs')
      .upsert(
        { user_id: klantId, gewoonte, datum },
        { onConflict: 'user_id,gewoonte,datum', ignoreDuplicates: true },
      )
  } else {
    await admin
      .from('gewoonte_logs')
      .delete()
      .eq('user_id', klantId)
      .eq('gewoonte', gewoonte)
      .eq('datum', datum)
  }

  const dezeWeek = await telWeekVoortgang(admin, taakId)
  return { ok: true, vandaag_gehaald: gehaald, deze_week_gehaald: dezeWeek }
}

// ─── Klant: mijn taken vandaag ───────────────────────────────────────────────
/** Actieve taken van de klant, mét voortgang van vandaag/deze week. */
export async function getMijnTaken(
  admin: Admin,
  klantId: string,
): Promise<TaakMetVoortgang[]> {
  const { data } = await admin
    .from('coaching_taken')
    .select(TAAK_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('actief', true)
    .order('pijler', { ascending: true })
    .order('aangemaakt_op', { ascending: true })

  return verrijkMetVoortgang(admin, (data ?? []) as CoachingTaak[])
}
