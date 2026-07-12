// ─── Coaching-voedingsrichtlijn — server-helpers ────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/voeding/* routes ná de auth-check. Bevat de kern-logica voor
// het opstellen (coach), bijwerken (coach) en lezen (coach + klant) van de
// persoonlijke voedingsrichtlijn van een gekoppelde klant.
//
// Verificatie: elke coach-actie eist een ACTIEVE coach↔klant-relatie
// (status = 'actief'), net als taken-server.ts. Eigenaarschap wordt bij
// mutaties bovendien in de query afgedwongen (coach_id = coach).

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isDieetvoorkeur, type VoedingRichtlijn, type VoedingRichtlijnInput } from '@/lib/coaching/voeding'

type Admin = ReturnType<typeof createAdminClient>

const RICHTLIJN_KOLOMMEN =
  'id, coach_id, klant_id, calorie_doel, eiwit_g, koolhydraat_g, vet_g, richtlijn_tekst, dieetvoorkeur, actief, aangemaakt_op, bijgewerkt_op'

// Grenzen — spiegelen de CHECK-constraints in migratie 042.
const CALORIE_MIN = 800
const CALORIE_MAX = 8000
const MACRO_MAX = { eiwit_g: 1000, koolhydraat_g: 1500, vet_g: 1000 } as const
const TEKST_MAX = 4000

type Falen = { ok: false; status: number; fout: string }
type Slagen<T> = { ok: true } & T

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

// ─── Normalisatie van de invoer ──────────────────────────────────────────────
type GenormaliseerdeVelden = {
  calorie_doel: number | null
  eiwit_g: number | null
  koolhydraat_g: number | null
  vet_g: number | null
  richtlijn_tekst: string | null
  dieetvoorkeur: string | null
}

/**
 * Klemt een optioneel getal tussen [min, max]. `undefined` = veld niet
 * meegestuurd (blijft dan default `null`); expliciet `null` = leegmaken.
 * Ongeldige (niet-eindige) invoer faalt hard.
 */
function normaliseerGetal(
  waarde: number | null | undefined,
  min: number,
  max: number,
  label: string,
): { ok: true; waarde: number | null } | { ok: false; fout: string } {
  if (waarde === undefined || waarde === null) return { ok: true, waarde: null }
  if (typeof waarde !== 'number' || !Number.isFinite(waarde)) {
    return { ok: false, fout: `Ongeldige waarde voor ${label}.` }
  }
  return { ok: true, waarde: Math.min(max, Math.max(min, Math.round(waarde))) }
}

function normaliseerVelden(
  input: VoedingRichtlijnInput,
): { ok: true; velden: GenormaliseerdeVelden } | { ok: false; fout: string } {
  const calorie = normaliseerGetal(input.calorie_doel, CALORIE_MIN, CALORIE_MAX, 'calorieën')
  if (!calorie.ok) return calorie
  const eiwit = normaliseerGetal(input.eiwit_g, 0, MACRO_MAX.eiwit_g, 'eiwit')
  if (!eiwit.ok) return eiwit
  const koolhydraat = normaliseerGetal(input.koolhydraat_g, 0, MACRO_MAX.koolhydraat_g, 'koolhydraten')
  if (!koolhydraat.ok) return koolhydraat
  const vet = normaliseerGetal(input.vet_g, 0, MACRO_MAX.vet_g, 'vet')
  if (!vet.ok) return vet

  let dieetvoorkeur: string | null = null
  if (input.dieetvoorkeur != null && input.dieetvoorkeur !== '') {
    if (!isDieetvoorkeur(input.dieetvoorkeur)) return { ok: false, fout: 'Ongeldige dieetvoorkeur.' }
    dieetvoorkeur = input.dieetvoorkeur
  }

  const tekstRuw = (input.richtlijn_tekst ?? '').trim()
  if (tekstRuw.length > TEKST_MAX) {
    return { ok: false, fout: `De richtlijntekst mag maximaal ${TEKST_MAX} tekens zijn.` }
  }
  const richtlijn_tekst = tekstRuw || null

  return {
    ok: true,
    velden: {
      calorie_doel: calorie.waarde,
      eiwit_g: eiwit.waarde,
      koolhydraat_g: koolhydraat.waarde,
      vet_g: vet.waarde,
      richtlijn_tekst,
      dieetvoorkeur,
    },
  }
}

/** Een richtlijn zonder één enkel ingevuld veld is zinloos. */
function heeftMinstensEenVeld(v: GenormaliseerdeVelden): boolean {
  return (
    v.calorie_doel != null ||
    v.eiwit_g != null ||
    v.koolhydraat_g != null ||
    v.vet_g != null ||
    v.richtlijn_tekst != null ||
    (v.dieetvoorkeur != null && v.dieetvoorkeur !== 'geen')
  )
}

// ─── Coach: actieve richtlijn van één klant ──────────────────────────────────
/** De huidige actieve richtlijn van een klant (of null). Verifieert relatie. */
export async function getRichtlijnVoorKlant(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<Falen | Slagen<{ richtlijn: VoedingRichtlijn | null }>> {
  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const { data, error } = await admin
    .from('coaching_voeding_richtlijnen')
    .select(RICHTLIJN_KOLOMMEN)
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .eq('actief', true)
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Richtlijn ophalen mislukt.' }
  return { ok: true, richtlijn: (data as VoedingRichtlijn | null) ?? null }
}

// ─── Coach: richtlijn opstellen (nieuwe versie, deactiveert de vorige) ────────
/**
 * Stelt een nieuwe actieve richtlijn op voor een klant. Verifieert de relatie
 * en deactiveert eerst de vorige actieve richtlijn (versiehistorie blijft
 * bewaard, en de partiële unieke index blijft gerespecteerd).
 */
export async function stelRichtlijnOp(
  admin: Admin,
  coachId: string,
  input: VoedingRichtlijnInput,
): Promise<Falen | Slagen<{ richtlijn: VoedingRichtlijn }>> {
  const klantId = (input.klant_id ?? '').trim()
  if (!klantId) return { ok: false, status: 400, fout: 'klant_id is verplicht.' }

  if (!(await isActieveRelatie(admin, coachId, klantId))) {
    return { ok: false, status: 403, fout: 'Deze klant is niet (actief) aan jou gekoppeld.' }
  }

  const genormaliseerd = normaliseerVelden(input)
  if (!genormaliseerd.ok) return { ok: false, status: 400, fout: genormaliseerd.fout }
  if (!heeftMinstensEenVeld(genormaliseerd.velden)) {
    return { ok: false, status: 400, fout: 'Vul minstens één dagdoel of een richtlijntekst in.' }
  }

  // Deactiveer de vorige actieve richtlijn(en) vóór de nieuwe invoeging,
  // zodat de partiële unieke index (één actief per coach+klant) nooit botst.
  const { error: deactiveerFout } = await admin
    .from('coaching_voeding_richtlijnen')
    .update({ actief: false })
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .eq('actief', true)
  if (deactiveerFout) return { ok: false, status: 500, fout: 'Richtlijn opstellen mislukt.' }

  const { data, error } = await admin
    .from('coaching_voeding_richtlijnen')
    .insert({ coach_id: coachId, klant_id: klantId, actief: true, ...genormaliseerd.velden })
    .select(RICHTLIJN_KOLOMMEN)
    .single()

  if (error || !data) return { ok: false, status: 500, fout: 'Richtlijn opstellen mislukt.' }
  return { ok: true, richtlijn: data as VoedingRichtlijn }
}

// ─── Coach: bestaande richtlijn bijwerken (in-place) ─────────────────────────
/**
 * Werkt een bestaande richtlijn in-place bij. Eigenaarschap (coach_id = coach)
 * wordt in de query afgedwongen. Alleen meegestuurde velden veranderen niet —
 * de payload wordt volledig genormaliseerd, dus dit is een vervanging van de
 * inhoud van de bestaande (actieve) richtlijn.
 */
export async function wijzigRichtlijn(
  admin: Admin,
  coachId: string,
  richtlijnId: string,
  input: VoedingRichtlijnInput,
): Promise<Falen | Slagen<{ richtlijn: VoedingRichtlijn }>> {
  if (!richtlijnId) return { ok: false, status: 400, fout: 'id is verplicht.' }

  const genormaliseerd = normaliseerVelden(input)
  if (!genormaliseerd.ok) return { ok: false, status: 400, fout: genormaliseerd.fout }
  if (!heeftMinstensEenVeld(genormaliseerd.velden)) {
    return { ok: false, status: 400, fout: 'Vul minstens één dagdoel of een richtlijntekst in.' }
  }

  const { data, error } = await admin
    .from('coaching_voeding_richtlijnen')
    .update(genormaliseerd.velden)
    .eq('id', richtlijnId)
    .eq('coach_id', coachId) // eigenaarschap afgedwongen in de query
    .select(RICHTLIJN_KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Richtlijn bijwerken mislukt.' }
  if (!data) return { ok: false, status: 404, fout: 'Richtlijn niet gevonden.' }
  return { ok: true, richtlijn: data as VoedingRichtlijn }
}

// ─── Klant: mijn actieve richtlijn ───────────────────────────────────────────
/** De eigen actieve richtlijn van de ingelogde klant (of null). */
export async function getMijnRichtlijn(admin: Admin, klantId: string): Promise<VoedingRichtlijn | null> {
  const { data } = await admin
    .from('coaching_voeding_richtlijnen')
    .select(RICHTLIJN_KOLOMMEN)
    .eq('klant_id', klantId)
    .eq('actief', true)
    .order('bijgewerkt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as VoedingRichtlijn | null) ?? null
}
