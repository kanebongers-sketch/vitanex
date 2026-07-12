// ─── Coaching-training — server-helpers ─────────────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/training/* routes ná de auth-check. Bevat de kern-logica voor
// het TOEWIJZEN van een trainingsschema aan een gekoppelde klant en het lezen
// van diens schema's + recente training_logs. Spiegelt ./taken-server.ts.
//
// ADDITIEF: dit schrijft in de BESTAANDE `fitness_schemas`-tabel met
// user_id = klant_id en toegewezen_door = coach_id (migratie 041). De klant
// volgt het schema in de bestaande /sport-UI, die het actieve schema van de
// ingelogde gebruiker laadt (maybeSingle op user_id + actief). We deactiveren
// daarom eerst alle bestaande actieve schema's van de klant — exact zoals de
// AI-generator (src/app/api/fitness/genereer-schema) dat doet — zodat er altijd
// precies één actief schema overblijft.
//
// De bestaande route weigert userId != user.id (403), dus we roepen de generator
// NIET via HTTP aan; we schrijven de fitness_schemas-rij hier direct.

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import {
  isNiveau,
  type FitnessSchemaRij,
  type NieuweDagInput,
  type NieuweOefeningInput,
  type NieuwSchemaInput,
  type TrainingDag,
  type TrainingLogRij,
  type TrainingNiveau,
  type TrainingOefening,
} from '@/lib/coaching/training'

type Admin = ReturnType<typeof createAdminClient>

const SCHEMA_KOLOMMEN =
  'id, naam, doel, niveau, sessies_per_week, actief, ai_gegenereerd, toegewezen_door, aangemaakt_op, schema_json'

type Falen = { ok: false; status: number; fout: string }
type Slagen<T> = { ok: true } & T

// ─── Verificatie ────────────────────────────────────────────────────────────
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

// ─── Normalisatie van het samengestelde schema ──────────────────────────────
function klem(waarde: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, waarde))
}

/** Valideert + normaliseert één oefening naar de sport-UI-vorm. */
function normaliseerOefening(
  input: NieuweOefeningInput,
): { ok: true; oefening: TrainingOefening } | { ok: false; fout: string } {
  const naam = (input.naam ?? '').trim()
  if (naam.length < 2) return { ok: false, fout: 'Elke oefening heeft een naam nodig.' }
  if (naam.length > 80) return { ok: false, fout: 'Een oefeningnaam mag maximaal 80 tekens zijn.' }

  const sets = klem(Math.round(Number(input.sets) || 3), 1, 20)
  const rusttijd = klem(Math.round(Number(input.rusttijd_sec) || 90), 15, 600)
  const naamEn = (input.naam_en ?? '').trim()

  return {
    ok: true,
    oefening: {
      naam: naam.slice(0, 80),
      ...(naamEn ? { naam_en: naamEn.slice(0, 80) } : {}),
      sets,
      herhalingen: ((input.herhalingen ?? '').trim() || '8-12').slice(0, 24),
      rusttijd_sec: rusttijd,
      heeft_gewicht: input.heeft_gewicht ?? true,
      gewicht_tip: (input.gewicht_tip ?? '').trim().slice(0, 160),
      uitvoering_tip: (input.uitvoering_tip ?? '').trim().slice(0, 300),
    },
  }
}

/** Ruwe schatting van de sessieduur wanneer de coach er geen opgeeft. */
function schatDuur(aantalOefeningen: number): number {
  return klem(Math.round(aantalOefeningen * 6.5) + 8, 15, 180)
}

/** Valideert + normaliseert één trainingsdag (dag-nummer is 1-gebaseerd). */
function normaliseerDag(
  input: NieuweDagInput,
  index: number,
): { ok: true; dag: TrainingDag } | { ok: false; fout: string } {
  const oefeningenInput = Array.isArray(input.oefeningen) ? input.oefeningen : []
  if (oefeningenInput.length === 0) return { ok: false, fout: `Dag ${index + 1} heeft minstens één oefening nodig.` }
  if (oefeningenInput.length > 20) return { ok: false, fout: `Dag ${index + 1} heeft te veel oefeningen (max 20).` }

  const oefeningen: TrainingOefening[] = []
  for (const ruw of oefeningenInput) {
    const resultaat = normaliseerOefening(ruw)
    if (!resultaat.ok) return { ok: false, fout: resultaat.fout }
    oefeningen.push(resultaat.oefening)
  }

  const opgegevenDuur = Number(input.geschatte_duur)
  const geschatteDuur = Number.isFinite(opgegevenDuur) && opgegevenDuur > 0
    ? klem(Math.round(opgegevenDuur), 5, 180)
    : schatDuur(oefeningen.length)

  const spiergroepen = Array.isArray(input.spiergroepen)
    ? input.spiergroepen.map(s => String(s).trim()).filter(Boolean).slice(0, 8)
    : []

  return {
    ok: true,
    dag: {
      dag: index + 1,
      naam: ((input.naam ?? '').trim() || `Dag ${index + 1}`).slice(0, 80),
      spiergroepen,
      coaching_tekst: (input.coaching_tekst ?? '').trim().slice(0, 400),
      geschatte_duur: geschatteDuur,
      oefeningen,
    },
  }
}

interface GenormaliseerdSchema {
  titel: string
  doel: string | null
  niveau: TrainingNiveau
  dagen: TrainingDag[]
}

/** Valideert het volledige samengestelde schema van de coach. */
function normaliseerSchema(
  input: NieuwSchemaInput,
): { ok: true; waarde: GenormaliseerdSchema } | { ok: false; fout: string } {
  const titel = (input.titel ?? '').trim()
  if (titel.length < 2) return { ok: false, fout: 'Geef het schema een duidelijke titel.' }
  if (titel.length > 120) return { ok: false, fout: 'De titel mag maximaal 120 tekens zijn.' }

  const dagenInput = Array.isArray(input.dagen) ? input.dagen : []
  if (dagenInput.length === 0) return { ok: false, fout: 'Voeg minstens één trainingsdag toe.' }
  if (dagenInput.length > 7) return { ok: false, fout: 'Een schema heeft maximaal 7 dagen.' }

  const dagen: TrainingDag[] = []
  for (let i = 0; i < dagenInput.length; i++) {
    const resultaat = normaliseerDag(dagenInput[i], i)
    if (!resultaat.ok) return { ok: false, fout: resultaat.fout }
    dagen.push(resultaat.dag)
  }

  const niveau: TrainingNiveau = isNiveau(input.niveau) ? input.niveau : 'beginner'
  const doel = (input.doel ?? '').trim().slice(0, 60) || null
  return { ok: true, waarde: { titel: titel.slice(0, 120), doel, niveau, dagen } }
}

// ─── Coach: schema toewijzen ────────────────────────────────────────────────
/** Stelt een schema samen en wijst het toe aan een klant. Verifieert de relatie. */
export async function wijsSchemaToe(
  admin: Admin,
  coachId: string,
  input: NieuwSchemaInput,
): Promise<Falen | Slagen<{ schema: FitnessSchemaRij }>> {
  const klantId = (input.klant_id ?? '').trim()
  if (!klantId) return { ok: false, status: 400, fout: 'klant_id is verplicht.' }

  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const genormaliseerd = normaliseerSchema(input)
  if (!genormaliseerd.ok) return { ok: false, status: 400, fout: genormaliseerd.fout }
  const { titel, doel, niveau, dagen } = genormaliseerd.waarde

  // Bedrijf van de klant overnemen (mag null zijn voor zelfstandigen — migratie 011).
  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id')
    .eq('id', klantId)
    .maybeSingle()

  // Deactiveer bestaande actieve schema's zodat de sport-UI er precies één vindt.
  const { error: deactiveerFout } = await admin
    .from('fitness_schemas')
    .update({ actief: false })
    .eq('user_id', klantId)
    .eq('actief', true)
  if (deactiveerFout) return { ok: false, status: 500, fout: 'Bestaand schema deactiveren mislukt.' }

  const { data, error } = await admin
    .from('fitness_schemas')
    .insert({
      user_id: klantId,
      company_id: profiel?.bedrijf_id ?? null,
      naam: titel,
      doel,
      niveau,
      sessies_per_week: dagen.length,
      schema_json: dagen,
      ai_gegenereerd: false,
      toegewezen_door: coachId,
      actief: true,
    })
    .select(SCHEMA_KOLOMMEN)
    .single()

  if (error || !data) return { ok: false, status: 500, fout: 'Schema toewijzen mislukt.' }
  return { ok: true, schema: data as FitnessSchemaRij }
}

// ─── Coach: schema's + recente logs van een klant ───────────────────────────
/** Alle schema's (actief + inactief) en recente training_logs van een klant. */
export async function getKlantTraining(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<Falen | Slagen<{ schemas: FitnessSchemaRij[]; logs: TrainingLogRij[] }>> {
  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const [{ data: schemas, error: schemaFout }, { data: logs }] = await Promise.all([
    admin
      .from('fitness_schemas')
      .select(SCHEMA_KOLOMMEN)
      .eq('user_id', klantId)
      .order('actief', { ascending: false })
      .order('aangemaakt_op', { ascending: false }),
    admin
      .from('training_logs')
      .select('id, datum, naam, duur_minuten')
      .eq('user_id', klantId)
      .order('datum', { ascending: false })
      .limit(8),
  ])

  if (schemaFout) return { ok: false, status: 500, fout: 'Schema-overzicht ophalen mislukt.' }

  return {
    ok: true,
    schemas: (schemas ?? []) as FitnessSchemaRij[],
    logs: (logs ?? []) as TrainingLogRij[],
  }
}

// ─── Coach: toegewezen schema deactiveren ───────────────────────────────────
/**
 * Zet een door DEZE coach toegewezen schema op inactief. Eigenaarschap wordt in
 * de query afgedwongen (toegewezen_door = coach), zodat een coach nooit een
 * door de klant zélf gegenereerd schema kan raken.
 */
export async function deactiveerSchema(
  admin: Admin,
  coachId: string,
  schemaId: string,
): Promise<Falen | Slagen<Record<never, never>>> {
  const { data, error } = await admin
    .from('fitness_schemas')
    .update({ actief: false })
    .eq('id', schemaId)
    .eq('toegewezen_door', coachId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Schema deactiveren mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Schema niet gevonden of niet door jou toegewezen.' }
  return { ok: true }
}
