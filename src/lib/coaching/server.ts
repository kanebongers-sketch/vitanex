// ─── Coaching-relatie — server-helpers ──────────────────────────────────────
// Alleen server-side (gebruikt de service-role admin-client). Wordt door de
// /api/coaching/* routes aangeroepen ná de auth-check. Bevat de kern-logica
// voor koppelen, klant-overzicht en de welzijnssamenvatting van een klant.

import { createAdminClient } from '@/lib/supabase/supabase-admin'
import type { KlantOverzicht, KlantDetail, KlantWelzijn } from '@/lib/coaching/relatie'

type Admin = ReturnType<typeof createAdminClient>

interface ProfielMini {
  id: string
  rol: string | null
  naam: string | null
  email: string | null
  avatar_url: string | null
}

/** Haalt het profiel (rol, naam, e-mail) op van een gebruiker. */
export async function getProfiel(admin: Admin, userId: string): Promise<ProfielMini | null> {
  const { data } = await admin
    .from('profiles')
    .select('id, rol, naam, email, avatar_url')
    .eq('id', userId)
    .single()
  return data ?? null
}

/** True als de gebruiker de coach- of admin-rol heeft. */
export async function isCoach(admin: Admin, userId: string): Promise<boolean> {
  const profiel = await getProfiel(admin, userId)
  return profiel?.rol === 'coach' || profiel?.rol === 'admin'
}

function dagenSinds(datum: string | null): number | null {
  if (!datum) return null
  return Math.floor((Date.now() - new Date(datum).getTime()) / 86400000)
}

/** Alle klanten van een coach, met status, toestemming en laatste check-in. */
export async function getKlantenVoorCoach(admin: Admin, coachId: string): Promise<KlantOverzicht[]> {
  const { data: koppelingen } = await admin
    .from('coach_klanten')
    .select('id, klant_id, status, inzage_toestemming, sinds')
    .eq('coach_id', coachId)
    .order('sinds', { ascending: false })

  const rijen = koppelingen ?? []
  if (rijen.length === 0) return []

  const klantIds = rijen.map(r => r.klant_id)

  const [{ data: profielen }, { data: sessies }] = await Promise.all([
    admin.from('profiles').select('id, naam, email, avatar_url').in('id', klantIds),
    admin.from('checkin_sessies').select('user_id, aangemaakt_op').in('user_id', klantIds)
      .order('aangemaakt_op', { ascending: false }),
  ])

  const profielMap = new Map((profielen ?? []).map(p => [p.id, p]))
  const laatsteCheckinMap = new Map<string, string>()
  for (const s of sessies ?? []) {
    if (!laatsteCheckinMap.has(s.user_id)) laatsteCheckinMap.set(s.user_id, s.aangemaakt_op)
  }

  return rijen.map(r => {
    const p = profielMap.get(r.klant_id)
    const laatste = laatsteCheckinMap.get(r.klant_id) ?? null
    return {
      koppeling_id: r.id,
      klant_id: r.klant_id,
      naam: p?.naam ?? 'Onbekende klant',
      email: p?.email ?? null,
      avatar_url: p?.avatar_url ?? null,
      status: r.status,
      inzage_toestemming: r.inzage_toestemming,
      sinds: r.sinds,
      laatste_checkin: laatste,
      dagen_sinds_checkin: dagenSinds(laatste),
    }
  })
}

/** Koppelt een bestaande gebruiker (op e-mail) als klant aan de coach. */
export async function koppelKlantViaEmail(
  admin: Admin,
  coachId: string,
  email: string,
): Promise<{ ok: true; klant_id: string } | { ok: false; status: number; fout: string }> {
  const schoon = email.trim().toLowerCase()
  if (!schoon || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(schoon)) {
    return { ok: false, status: 400, fout: 'Ongeldig e-mailadres.' }
  }

  const { data: klant } = await admin
    .from('profiles')
    .select('id, rol')
    .ilike('email', schoon)
    .maybeSingle()

  if (!klant) {
    return { ok: false, status: 404, fout: 'Geen gebruiker met dit e-mailadres. De klant moet eerst een account aanmaken.' }
  }
  if (klant.id === coachId) {
    return { ok: false, status: 400, fout: 'Je kunt jezelf niet als klant koppelen.' }
  }

  const { error } = await admin
    .from('coach_klanten')
    .upsert(
      { coach_id: coachId, klant_id: klant.id, status: 'actief' },
      { onConflict: 'coach_id,klant_id', ignoreDuplicates: true },
    )

  if (error) {
    return { ok: false, status: 500, fout: 'Koppeling mislukt. Probeer opnieuw.' }
  }
  return { ok: true, klant_id: klant.id }
}

/** Welzijnssamenvatting van één klant (30 dagen) — spiegelt team-overzicht. */
export async function getKlantWelzijn(admin: Admin, klantId: string): Promise<KlantWelzijn> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffISO = cutoff.toISOString()

  const [{ data: analyses }, { data: burnout }] = await Promise.all([
    admin.from('checkin_analyses')
      .select('aangemaakt_op, scores')
      .eq('user_id', klantId)
      .gte('aangemaakt_op', cutoffISO)
      .order('aangemaakt_op', { ascending: false }),
    admin.from('burnout_predictor_scores')
      .select('risico_score, trending, week_start')
      .eq('user_id', klantId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const rijen = analyses ?? []

  const gemiddelden: Record<string, number> = {}
  if (rijen.length > 0) {
    const domeinen = Object.keys((rijen[0]?.scores as Record<string, number>) ?? {})
    for (const d of domeinen) {
      const scores = rijen
        .map(c => (c.scores as Record<string, number>)?.[d])
        .filter((s): s is number => typeof s === 'number')
      if (scores.length > 0) {
        gemiddelden[d] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      }
    }
  }

  const laatste = rijen[0]?.aangemaakt_op ?? null

  return {
    gemiddelde_scores: gemiddelden,
    checkins_30d: rijen.length,
    laatste_checkin: laatste,
    dagen_sinds_checkin: dagenSinds(laatste),
    burnout_risico: burnout?.risico_score ?? null,
    burnout_trending: burnout?.trending ?? null,
    recente_analyses: rijen.slice(0, 8).map(c => ({
      datum: c.aangemaakt_op,
      scores: (c.scores as Record<string, number> | null) ?? null,
    })),
  }
}

/** Detail van één klant. Welzijn alleen bij actieve toestemming. Null = geen relatie. */
export async function getKlantDetail(
  admin: Admin,
  coachId: string,
  klantId: string,
): Promise<KlantDetail | null> {
  const { data: koppeling } = await admin
    .from('coach_klanten')
    .select('status, inzage_toestemming, sinds, notitie')
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)
    .maybeSingle()

  if (!koppeling) return null

  const profiel = await getProfiel(admin, klantId)

  const magInzien = koppeling.status === 'actief' && koppeling.inzage_toestemming
  const welzijn = magInzien ? await getKlantWelzijn(admin, klantId) : null

  return {
    klant_id: klantId,
    naam: profiel?.naam ?? 'Onbekende klant',
    email: profiel?.email ?? null,
    avatar_url: profiel?.avatar_url ?? null,
    status: koppeling.status,
    inzage_toestemming: koppeling.inzage_toestemming,
    sinds: koppeling.sinds,
    notitie: koppeling.notitie ?? null,
    welzijn,
  }
}

/** Klant zet zijn inzage-toestemming voor een coach aan/uit. */
export async function zetToestemming(
  admin: Admin,
  klantId: string,
  coachId: string,
  waarde: boolean,
): Promise<{ ok: boolean; fout?: string }> {
  const { error } = await admin
    .from('coach_klanten')
    .update({ inzage_toestemming: waarde })
    .eq('coach_id', coachId)
    .eq('klant_id', klantId)

  if (error) return { ok: false, fout: 'Bijwerken mislukt.' }
  return { ok: true }
}

/** Koppeling(en) van een klant — wie is mijn coach? (klant-perspectief) */
export async function getCoachesVoorKlant(admin: Admin, klantId: string) {
  const { data: koppelingen } = await admin
    .from('coach_klanten')
    .select('id, coach_id, status, inzage_toestemming, sinds')
    .eq('klant_id', klantId)
    .in('status', ['actief', 'gepauzeerd'])

  const rijen = koppelingen ?? []
  if (rijen.length === 0) return []

  const coachIds = rijen.map(r => r.coach_id)
  const { data: profielen } = await admin
    .from('profiles').select('id, naam, avatar_url').in('id', coachIds)
  const map = new Map((profielen ?? []).map(p => [p.id, p]))

  return rijen.map(r => ({
    koppeling_id: r.id,
    coach_id: r.coach_id,
    coach_naam: map.get(r.coach_id)?.naam ?? 'Je coach',
    coach_avatar: map.get(r.coach_id)?.avatar_url ?? null,
    status: r.status,
    inzage_toestemming: r.inzage_toestemming,
    sinds: r.sinds,
  }))
}
