// ─── LifeOS binnen MentaForce — de brug ─────────────────────────────────────
// LifeOS is Kane's PERSOONLIJKE Life Operating System. Zijn data (agenda, inbox,
// gezondheid, taken) hoort NIET in de B2B-database van MentaForce: die heeft een
// anonimiteitsbelofte aan de medewerkers van klantbedrijven, en persoonlijke
// data van derden (mailafzenders!) hoort daar niet tussen.
//
// Daarom leeft LifeOS in een EIGEN Supabase-project. Deze module is de enige
// brug: MentaForce praat er server-side met de service-role mee. Twee sloten
// houden dat veilig:
//
//   1. Elke LifeOS-route gate't op `vereisLifeosToegang()` → alleen de founder
//      (kanebongers@gmail.com) komt erlangs; iedereen anders krijgt 403.
//   2. De service-role key en de LifeOS-URL staan alleen server-side in env.
//
// LifeOS is single-tenant: er is precies één gebruiker. De rijen zijn eigendom
// van één vaste `LIFEOS_USER_ID`; daar filteren alle queries op. Er is dus geen
// LifeOS-login meer nodig — de MentaForce-sessie + de founder-gate zijn de lock.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser, isFounder } from '@/lib/auth/api-auth'

/** De vaste eigenaar van alle LifeOS-rijen (Kane's account in het LifeOS-project). */
export function lifeosUserId(): string {
  const id = process.env.LIFEOS_USER_ID
  if (!id) throw new Error('LIFEOS_USER_ID ontbreekt in de omgeving.')
  return id
}

/**
 * Service-role client op het LifeOS-project. Omzeilt RLS — en dat mag hier,
 * want de founder-gate ervoor is het echte slot en LifeOS is single-tenant.
 *
 * Server-only: de service-role key mag nooit naar de browser. Een import van
 * dit bestand in client-code hoort een buildfout te geven; de guard hieronder is
 * de tweede verdediging.
 */
export function createLifeosAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createLifeosAdminClient is server-only en mag niet in de browser draaien.')
  }
  const url = process.env.LIFEOS_SUPABASE_URL
  const key = process.env.LIFEOS_SERVICE_ROLE_KEY
  if (!url) throw new Error('LIFEOS_SUPABASE_URL ontbreekt in de omgeving.')
  if (!key || key === 'undefined') throw new Error('LIFEOS_SERVICE_ROLE_KEY ontbreekt in de omgeving.')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Wat een LifeOS-route krijgt als de toegang klopt. */
export interface LifeosToegang {
  /** De ingelogde MentaForce-gebruiker (de founder). */
  email: string
  /** Het vaste LifeOS-eigenaar-id waarop alle queries filteren. */
  userId: string
  /** Service-role client op het LifeOS-project. */
  admin: SupabaseClient
}

/**
 * De poort voor élke LifeOS-API-route. Geeft óf de toegang, óf een klaar-om-te-
 * returnen `NextResponse` met 401/403. Zo staat de gate op precies één plek en
 * kan geen enkele route 'm vergeten.
 *
 *   const toegang = await vereisLifeosToegang(req)
 *   if (toegang instanceof NextResponse) return toegang
 *   // vanaf hier: toegang.admin, toegang.userId
 */
/**
 * Alleen de founder-check: ben je ingelogd én de eigenaar? Bewust ZONDER de
 * service-role-client of `LIFEOS_USER_ID` — dit is puur de poort. Zo hangt
 * LifeOS-toegang (en de FounderPoort-UI) niet aan de data-env: mist er een
 * LifeOS-data-var, dan kom je nog steeds binnen en falen alleen de datakaarten
 * (elk met hun eigen nette melding), i.p.v. een kale 500 → redirect naar /home.
 */
export async function vereisFounder(
  req: NextRequest,
): Promise<{ email: string } | NextResponse> {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }
  if (!isFounder(user)) {
    // Bewust dezelfde melding als "niet gevonden" zou geven: een niet-founder
    // hoeft niet te weten dát LifeOS hier draait.
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }
  return { email: user.email ?? '' }
}

export async function vereisLifeosToegang(
  req: NextRequest,
): Promise<LifeosToegang | NextResponse> {
  const founder = await vereisFounder(req)
  if (founder instanceof NextResponse) return founder

  // De data-laag: hier kan een ontbrekende LifeOS-env-var (`LIFEOS_USER_ID`,
  // `LIFEOS_SUPABASE_URL`, `LIFEOS_SERVICE_ROLE_KEY`) gooien. Vang dat en geef de
  // échte melding terug (503 + body) i.p.v. een kale, ondoorzichtige 500. Alleen
  // een geverifieerde founder komt hier ooit, dus de var-naam lekt niet breed.
  try {
    return {
      email: founder.email,
      userId: lifeosUserId(),
      admin: createLifeosAdminClient(),
    }
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : 'LifeOS-configuratie ontbreekt.'
    console.error('[lifeos] configuratiefout:', melding)
    return NextResponse.json({ error: melding }, { status: 503 })
  }
}
