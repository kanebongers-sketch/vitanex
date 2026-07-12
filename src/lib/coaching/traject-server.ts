// ─── Coaching-traject — server-helpers ──────────────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/traject en /api/coaching/mijn-traject routes ná de auth-check.
// Bevat de kern-logica: coach↔klant-verificatie, traject ophalen/opstellen/
// vervangen/bijwerken, fase-ordening en de huidige-fase-berekening.
//
// Client-veilige types, labels en de PURE huidige-fase-berekening staan in
// ./traject.ts (die deze module hergebruikt), zodat pagina's ze kunnen delen
// zonder server-code te importeren.

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isPijler } from './pijlers'
import {
  berekenHuidigeFaseId,
  huidigeWeekVanTraject,
  alsTrajectStatus,
  type CoachingTraject,
  type TrajectFase,
  type TrajectMetFases,
  type TrajectInvoer,
  type FaseInvoer,
  type TrajectStatus,
} from './traject'

type Admin = ReturnType<typeof createAdminClient>

const TRAJECT_KOLOMMEN = 'id, coach_id, klant_id, titel, doel, start_datum, duur_maanden, status'
const FASE_KOLOMMEN = 'id, traject_id, volgorde, titel, pijler, focus, week_van, week_tot'

export type TrajectResultaat =
  | { ok: true; traject: TrajectMetFases }
  | { ok: false; status: number; fout: string }

/** Bestaat er een coach↔klant-koppeling tussen deze twee? (elke status telt) */
export async function coachBeheertKlant(admin: Admin, coachId: string, klantId: string): Promise<boolean> {
  const { data } = await admin
    .from('coach_klanten')
    .select('id')
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .maybeSingle()
  return Boolean(data)
}

/** Combineert traject + fases + berekende voortgang tot één object. */
function bouwTrajectMetFases(traject: CoachingTraject, fases: TrajectFase[]): TrajectMetFases {
  const geordend = [...fases].sort((a, b) => a.volgorde - b.volgorde)
  const huidigeWeek = huidigeWeekVanTraject(traject.start_datum)
  const huidigeFaseId = traject.status === 'actief'
    ? berekenHuidigeFaseId(geordend, huidigeWeek)
    : null
  return { traject, fases: geordend, huidige_week: huidigeWeek, huidige_fase_id: huidigeFaseId }
}

/** Haalt de fases van een traject op (geordend op volgorde). */
async function haalFases(admin: Admin, trajectId: string): Promise<TrajectFase[]> {
  const { data } = await admin
    .from('coaching_traject_fases')
    .select(FASE_KOLOMMEN)
    .eq('traject_id', trajectId)
    .order('volgorde', { ascending: true })
  return (data ?? []) as TrajectFase[]
}

/** Coach-perspectief: het (enige) traject voor deze coach↔klant, of null. */
export async function getTrajectVoorKlant(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<TrajectMetFases | null> {
  const { data: traject } = await admin
    .from('coaching_trajecten')
    .select(TRAJECT_KOLOMMEN)
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!traject) return null
  const fases = await haalFases(admin, traject.id)
  return bouwTrajectMetFases(traject as CoachingTraject, fases)
}

/** Klant-perspectief: het eigen actieve traject + huidige fase, of null. */
export async function getActiefTrajectVoorKlant(
  admin: Admin,
  klantId: string,
): Promise<TrajectMetFases | null> {
  const { data: traject } = await admin
    .from('coaching_trajecten')
    .select(TRAJECT_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('status', 'actief')
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!traject) return null
  const fases = await haalFases(admin, traject.id)
  return bouwTrajectMetFases(traject as CoachingTraject, fases)
}

/** Valideert en normaliseert één fase-invoer. Null = ongeldig. */
function normaliseerFase(fase: FaseInvoer, index: number, trajectId: string): Record<string, unknown> | null {
  const titel = (fase.titel ?? '').trim()
  if (!titel || !isPijler(fase.pijler)) return null
  const van = typeof fase.week_van === 'number' ? fase.week_van : null
  const tot = typeof fase.week_tot === 'number' ? fase.week_tot : null
  if (van !== null && tot !== null && tot < van) return null
  return {
    traject_id: trajectId,
    volgorde: index + 1,
    titel,
    pijler: fase.pijler,
    focus: (fase.focus ?? '').trim() || null,
    week_van: van,
    week_tot: tot,
  }
}

/** Valideert elke fase op titel, geldige pijler en weekbereik. Fout of null. */
function valideerFases(fases: FaseInvoer[]): string | null {
  for (let i = 0; i < fases.length; i++) {
    if (!normaliseerFase(fases[i], i, 'x')) {
      return `Fase ${i + 1} is onvolledig (titel en geldige pijler vereist).`
    }
  }
  return null
}

/** Valideert de traject-invoer op systeemgrenzen. Fout-string of null (=ok). */
function valideerInvoer(invoer: TrajectInvoer): string | null {
  if (!invoer || typeof invoer.titel !== 'string' || !invoer.titel.trim()) {
    return 'Titel is verplicht.'
  }
  const duur = invoer.duur_maanden ?? 6
  if (!Number.isInteger(duur) || duur < 1 || duur > 24) {
    return 'Duur moet tussen 1 en 24 maanden liggen.'
  }
  if (!Array.isArray(invoer.fases) || invoer.fases.length === 0) {
    return 'Voeg minstens één fase toe.'
  }
  return valideerFases(invoer.fases)
}

/**
 * Maakt een traject aan of vervangt het bestaande traject voor deze
 * coach↔klant. Bestaande trajecten van dit paar (en hun fases, via cascade)
 * worden verwijderd — één actief traject per klant is het model.
 */
export async function maakOfVervangTraject(
  admin: Admin,
  coachId: string,
  klantId: string,
  invoer: TrajectInvoer,
): Promise<TrajectResultaat> {
  if (!(await coachBeheertKlant(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet aan jou gekoppeld.' }
  }
  const invoerFout = valideerInvoer(invoer)
  if (invoerFout) return { ok: false, status: 400, fout: invoerFout }

  await admin.from('coaching_trajecten').delete().eq('coach_id', coachId).eq('klant_id', klantId)

  const { data: traject, error } = await admin
    .from('coaching_trajecten')
    .insert({
      coach_id: coachId,
      klant_id: klantId,
      titel: invoer.titel.trim(),
      doel: invoer.doel?.trim() || null,
      start_datum: invoer.start_datum || undefined,
      duur_maanden: invoer.duur_maanden ?? 6,
      status: alsTrajectStatus(invoer.status, 'actief'),
    })
    .select(TRAJECT_KOLOMMEN)
    .single()

  if (error || !traject) return { ok: false, status: 500, fout: 'Traject opslaan mislukt.' }

  const faseFout = await voegFasesToe(admin, traject.id, invoer.fases)
  if (faseFout) {
    await admin.from('coaching_trajecten').delete().eq('id', traject.id)
    return { ok: false, status: 400, fout: faseFout }
  }

  const fases = await haalFases(admin, traject.id)
  return { ok: true, traject: bouwTrajectMetFases(traject as CoachingTraject, fases) }
}

/** Voegt de fases toe. Retourneert een fout-string of null bij succes. */
async function voegFasesToe(admin: Admin, trajectId: string, fases: FaseInvoer[]): Promise<string | null> {
  const rijen: Record<string, unknown>[] = []
  for (let i = 0; i < fases.length; i++) {
    const rij = normaliseerFase(fases[i], i, trajectId)
    if (!rij) return `Fase ${i + 1} is onvolledig (titel en geldige pijler vereist).`
    rijen.push(rij)
  }
  const { error } = await admin.from('coaching_traject_fases').insert(rijen)
  return error ? 'Fases opslaan mislukt.' : null
}

/** Werkt losse traject-velden bij (status/titel/doel). */
export async function updateTrajectVeld(
  admin: Admin,
  coachId: string,
  klantId: string,
  patch: { status?: TrajectStatus; titel?: string; doel?: string | null },
): Promise<TrajectResultaat> {
  const wijziging: Record<string, unknown> = {}
  if (patch.status !== undefined) wijziging.status = alsTrajectStatus(patch.status)
  if (typeof patch.titel === 'string' && patch.titel.trim()) wijziging.titel = patch.titel.trim()
  if (patch.doel !== undefined) wijziging.doel = patch.doel?.trim() || null
  if (Object.keys(wijziging).length === 0) {
    return { ok: false, status: 400, fout: 'Niets om bij te werken.' }
  }

  const { data: traject, error } = await admin
    .from('coaching_trajecten')
    .update(wijziging)
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .select(TRAJECT_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Bijwerken mislukt.' }
  if (!traject) return { ok: false, status: 404, fout: 'Geen traject gevonden voor deze klant.' }

  const fases = await haalFases(admin, traject.id)
  return { ok: true, traject: bouwTrajectMetFases(traject as CoachingTraject, fases) }
}
