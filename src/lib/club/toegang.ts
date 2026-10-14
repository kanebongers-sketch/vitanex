// ─── Fit Factory clubsoftware: het slot (SERVER-ONLY) ───────────────────────
// Testfase: alleen Kane. Toegang = een geldige beheerder-sessie van de PT-app
// (de httpOnly-cookie die hij krijgt als hij inlogt met zijn hoofdaccount).
// Eigenaren, clubmanagers en PT'ers hebben die rol nooit, dus voor hen bestaat
// /clubkane niet: pagina's geven een gewone 404 en de API ook (geen 401/403 die
// verraadt dat er iets achter zit).

import { cache } from 'react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { beoordeelSessie, leesSessie, vindLink } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, isZelfdeOorsprong } from '@/lib/lifeos/leads/toegang'

export interface ClubToegang {
  admin: SupabaseClient
  /** De vaste eigenaar van alle rijen (LIFEOS_USER_ID). */
  userId: string
  /** Wie er werkt, voor het logboek ("Kane"). */
  naam: string
  /** De PT-code van de beheerder, voor de link terug naar de PT-app. */
  code: string
}

/** De code van de (enige) actieve beheerder-link, of null. */
async function beheerderCode(admin: SupabaseClient): Promise<string | null> {
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('code')
    .eq('rol', 'beheerder')
    .eq('actief', true)
    .limit(1)
    .maybeSingle()
  if (error || !data || typeof data.code !== 'string') return null
  return data.code
}

/** Is dit verzoek van Kane (beheerder, ingelogd)? Per request een keer gevraagd. */
export const clubToegang = cache(async (): Promise<ClubToegang | null> => {
  let admin: SupabaseClient
  try {
    admin = createLifeosAdminClient()
  } catch {
    return null
  }
  const code = await beheerderCode(admin)
  if (!code) return null
  const token = (await cookies()).get(sessieCookieNaam(code))?.value
  if (!token) return null
  const [link, sessie] = await Promise.all([vindLink(admin, code), leesSessie(admin, token)])
  if (!link || link.rol !== 'beheerder') return null
  const ingelogd = await beoordeelSessie(admin, link, token, sessie, new Date())
  if (!ingelogd) return null
  return { admin, userId: link.userId, naam: link.naam, code }
})

/** Voor pagina's en layouts: de toegang, of een gewone 404. */
export async function eisClubToegang(): Promise<ClubToegang> {
  const t = await clubToegang()
  if (!t) notFound()
  return t
}

/** Een JSON-fout van de club-API, altijd zonder cache en noindex. */
export function clubFout(fout: string, status: number): NextResponse {
  return NextResponse.json({ fout }, { status, headers: GEEN_CACHE })
}

/** Een JSON-antwoord van de club-API, altijd zonder cache en noindex. */
export function clubJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: GEEN_CACHE })
}

/**
 * De poort voor elke /api/club-route. Niet Kane: 404 (bestaat niet).
 * Muterende verzoeken (alles behalve GET/HEAD) moeten van onze eigen pagina komen.
 *
 *   const t = await vereisClubToegang(req)
 *   if (t instanceof NextResponse) return t
 */
export async function vereisClubToegang(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  const leest = req.method === 'GET' || req.method === 'HEAD'
  if (!leest && !isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  return t
}

/** Een regel in het logboek. Best-effort: een mislukte log breekt de actie niet. */
export async function logActie(t: ClubToegang, actie: string, onderwerp: string | null, vestiging: string | null): Promise<void> {
  const { error } = await t.admin.from('club_logboek').insert({
    user_id: t.userId,
    wie: t.naam.slice(0, 80),
    actie: actie.slice(0, 80),
    onderwerp: onderwerp ? onderwerp.slice(0, 200) : null,
    vestiging,
  })
  if (error) console.error('[club] logboek schrijven mislukt', error.message)
}
