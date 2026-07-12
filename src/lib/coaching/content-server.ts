// ─── Coaching-content — server-helpers ──────────────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/content/* en /api/coaching/mijn-content routes ná de auth-check.
// Bevat de kern-logica voor het beheren van content (coach) en het lezen ervan
// (klant). Spiegelt het protocollen-patroon (auteur → publiceren → lezer), maar
// dan coach↔klant.

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import {
  isContentType,
  isPijler,
  type CoachingContent,
  type ContentType,
  type Pijler,
} from '@/lib/coaching/content'

type Admin = ReturnType<typeof createAdminClient>

const CONTENT_KOLOMMEN =
  'id, coach_id, klant_id, titel, inhoud, pijler, type, media_url, gepubliceerd, aangemaakt_op, bijgewerkt_op'

const MAX_TITEL = 160
const MAX_INHOUD = 20000
const MAX_MEDIA_URL = 500

export interface NieuweContentInput {
  klant_id?: string | null
  titel?: string
  inhoud?: string
  pijler?: string
  type?: string
  media_url?: string | null
  gepubliceerd?: boolean
}

export interface ContentPatchInput {
  titel?: string
  inhoud?: string
  pijler?: string
  type?: string
  media_url?: string | null
  gepubliceerd?: boolean
}

type Falen = { ok: false; status: number; fout: string }
type Slagen<T> = { ok: true } & T

// ─── Verificatie ─────────────────────────────────────────────────────────────
/** True als er een ACTIEVE coach↔klant-relatie bestaat (coach levert aan klant). */
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

// ─── Validatie-helpers ───────────────────────────────────────────────────────
/** Normaliseert een optionele externe media-link; leeg → null, anders http(s). */
function schoneMediaUrl(waarde: unknown): { ok: true; url: string | null } | { ok: false; fout: string } {
  if (waarde === undefined || waarde === null) return { ok: true, url: null }
  const schoon = String(waarde).trim()
  if (!schoon) return { ok: true, url: null }
  if (schoon.length > MAX_MEDIA_URL) return { ok: false, fout: 'De media-link is te lang.' }
  if (!/^https?:\/\/\S+$/i.test(schoon)) return { ok: false, fout: 'Geef een geldige http(s)-link of laat het veld leeg.' }
  return { ok: true, url: schoon }
}

interface GenormaliseerdeContent {
  titel: string
  inhoud: string
  pijler: Pijler
  type: ContentType
  media_url: string | null
  gepubliceerd: boolean
}

function normaliseerNieuweContent(
  input: NieuweContentInput,
): { ok: true; waarden: GenormaliseerdeContent } | { ok: false; fout: string } {
  const titel = (input.titel ?? '').trim()
  if (titel.length < 2) return { ok: false, fout: 'Geef de content een duidelijke titel.' }
  if (titel.length > MAX_TITEL) return { ok: false, fout: `De titel mag maximaal ${MAX_TITEL} tekens zijn.` }

  const inhoud = (input.inhoud ?? '').trim()
  if (inhoud.length < 2) return { ok: false, fout: 'Schrijf de inhoud van je les of opdracht.' }
  if (inhoud.length > MAX_INHOUD) return { ok: false, fout: 'De inhoud is te lang.' }

  const media = schoneMediaUrl(input.media_url)
  if (!media.ok) return { ok: false, fout: media.fout }

  return {
    ok: true,
    waarden: {
      titel,
      inhoud,
      pijler: isPijler(input.pijler) ? input.pijler : 'mind',
      type: isContentType(input.type) ? input.type : 'artikel',
      media_url: media.url,
      gepubliceerd: Boolean(input.gepubliceerd),
    },
  }
}

// ─── Coach: content aanmaken ─────────────────────────────────────────────────
/** Maakt content voor één klant of (klant_id null) voor alle klanten van de coach. */
export async function maakContent(
  admin: Admin,
  coachId: string,
  input: NieuweContentInput,
): Promise<Falen | Slagen<{ content: CoachingContent }>> {
  const ruweKlant = input.klant_id
  const klantId = typeof ruweKlant === 'string' && ruweKlant.trim() ? ruweKlant.trim() : null

  // Persoonlijke content vereist een actieve koppeling; algemene content niet.
  if (klantId !== null && !(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const genormaliseerd = normaliseerNieuweContent(input)
  if (!genormaliseerd.ok) return { ok: false, status: 400, fout: genormaliseerd.fout }

  const { data, error } = await admin
    .from('coaching_content')
    .insert({ coach_id: coachId, klant_id: klantId, ...genormaliseerd.waarden })
    .select(CONTENT_KOLOMMEN)
    .single()

  if (error || !data) return { ok: false, status: 500, fout: 'Content aanmaken mislukt.' }
  return { ok: true, content: data as CoachingContent }
}

// ─── Coach: content wijzigen / publiceren ────────────────────────────────────
function bouwPatch(
  input: ContentPatchInput,
): { ok: true; patch: Record<string, unknown> } | { ok: false; fout: string } {
  const patch: Record<string, unknown> = {}

  if (input.titel !== undefined) {
    const titel = input.titel.trim()
    if (titel.length < 2) return { ok: false, fout: 'Geef de content een duidelijke titel.' }
    if (titel.length > MAX_TITEL) return { ok: false, fout: `De titel mag maximaal ${MAX_TITEL} tekens zijn.` }
    patch.titel = titel
  }
  if (input.inhoud !== undefined) {
    const inhoud = input.inhoud.trim()
    if (inhoud.length < 2) return { ok: false, fout: 'Schrijf de inhoud van je les of opdracht.' }
    if (inhoud.length > MAX_INHOUD) return { ok: false, fout: 'De inhoud is te lang.' }
    patch.inhoud = inhoud
  }
  if (input.pijler !== undefined) {
    if (!isPijler(input.pijler)) return { ok: false, fout: 'Ongeldige pijler.' }
    patch.pijler = input.pijler
  }
  if (input.type !== undefined) {
    if (!isContentType(input.type)) return { ok: false, fout: 'Ongeldig type.' }
    patch.type = input.type
  }
  if (input.media_url !== undefined) {
    const media = schoneMediaUrl(input.media_url)
    if (!media.ok) return { ok: false, fout: media.fout }
    patch.media_url = media.url
  }
  if (input.gepubliceerd !== undefined) patch.gepubliceerd = Boolean(input.gepubliceerd)

  return { ok: true, patch }
}

/** Wijzigt/publiceert content. Verifieert eigenaarschap (coach_id = coach). */
export async function wijzigContent(
  admin: Admin,
  coachId: string,
  contentId: string,
  input: ContentPatchInput,
): Promise<Falen | Slagen<{ content: CoachingContent }>> {
  const resultaat = bouwPatch(input)
  if (!resultaat.ok) return { ok: false, status: 400, fout: resultaat.fout }
  if (Object.keys(resultaat.patch).length === 0) return { ok: false, status: 400, fout: 'Geen wijzigingen opgegeven.' }

  const { data, error } = await admin
    .from('coaching_content')
    .update(resultaat.patch)
    .eq('id', contentId)
    .eq('coach_id', coachId) // eigenaarschap afgedwongen in de query
    .select(CONTENT_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Content bijwerken mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Content niet gevonden.' }
  return { ok: true, content: data as CoachingContent }
}

/** Verwijdert content. Verifieert eigenaarschap (coach_id = coach). */
export async function verwijderContent(
  admin: Admin,
  coachId: string,
  contentId: string,
): Promise<Falen | Slagen<Record<never, never>>> {
  const { data, error } = await admin
    .from('coaching_content')
    .delete()
    .eq('id', contentId)
    .eq('coach_id', coachId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Content verwijderen mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Content niet gevonden.' }
  return { ok: true }
}

// ─── Coach: content voor één klant ───────────────────────────────────────────
/**
 * Alle content die deze klant van de coach ontvangt: persoonlijk (klant_id =
 * klantId) én algemeen (klant_id NULL), inclusief concepten. Verifieert relatie.
 */
export async function getContentVoorKlant(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<Falen | Slagen<{ content: CoachingContent[] }>> {
  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const { data, error } = await admin
    .from('coaching_content')
    .select(CONTENT_KOLOMMEN)
    .eq('coach_id', coachId)
    .or(`klant_id.eq.${klantId},klant_id.is.null`)
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, status: 500, fout: 'Content ophalen mislukt.' }
  return { ok: true, content: (data ?? []) as CoachingContent[] }
}

// ─── Klant: mijn leeslijst ───────────────────────────────────────────────────
/**
 * De gepubliceerde content die een klant mag lezen: persoonlijk aan hem gericht
 * plus algemene content van coaches met een actieve koppeling. Spiegelt de RLS
 * uit migratie 043 (uitgevoerd in twee gerichte queries met de admin-client).
 */
export async function getContentVoorLezer(admin: Admin, klantId: string): Promise<CoachingContent[]> {
  const { data: koppelingen } = await admin
    .from('coach_klanten')
    .select('coach_id')
    .eq('klant_id', klantId)
    .eq('status', 'actief')

  const coachIds = [...new Set((koppelingen ?? []).map(k => k.coach_id))]

  // Persoonlijke content (klant_id = deze klant) plus, indien er coaches zijn,
  // algemene content (klant_id NULL) van die coaches. Twee gerichte queries
  // spiegelen exact de RLS uit migratie 043.
  const { data: persoonlijk } = await admin
    .from('coaching_content')
    .select(CONTENT_KOLOMMEN)
    .eq('gepubliceerd', true)
    .eq('klant_id', klantId)

  let algemeen: CoachingContent[] = []
  if (coachIds.length > 0) {
    const { data } = await admin
      .from('coaching_content')
      .select(CONTENT_KOLOMMEN)
      .eq('gepubliceerd', true)
      .is('klant_id', null)
      .in('coach_id', coachIds)
    algemeen = (data ?? []) as CoachingContent[]
  }

  // Nieuwste eerst; geen overlap (persoonlijk = klant_id gevuld, algemeen = null).
  const alles = [...((persoonlijk ?? []) as CoachingContent[]), ...algemeen]
  return alles.sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))
}
