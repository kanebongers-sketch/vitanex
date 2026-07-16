// ─── LifeOS — de enige gebruiker ───────────────────────────────────────────
// Alleen server-side.
//
// ── Waarom dit bestaat ─────────────────────────────────────────────────────
// Een OAuth-callback komt binnen als een gewone browser-redirect vanaf WHOOP of
// Oura. Daar zit géén Authorization-header op, en `getAuthenticatedUser()` is
// bewust Bearer-only (zie `lib/auth/api-auth.ts`). De getekende state draagt
// óók geen user-id — `lib/auth/oauth-state.ts` laat die expliciet weg, met de
// redenering: "LifeOS is single-tenant, er ís maar één gebruiker".
//
// Dat klopt, en dit bestand maakt die aanname één keer expliciet in plaats van
// hem in drie route-handlers te laten rondslingeren.
//
// ── Waarom het luid faalt ──────────────────────────────────────────────────
// Bij 0 of meer dan 1 profiel geeft dit null, niet "de eerste die we vinden".
// Een token bij het verkeerde account opslaan is een datalek tussen accounts —
// precies het soort fout dat een single-tenant-aanname stilletjes verbergt tot
// er ooit een tweede gebruiker bijkomt.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isObject, lijst, tekst } from './narrow'

/**
 * Het user-id van de enige gebruiker van deze installatie, of null als dat niet
 * eenduidig vast te stellen is.
 *
 * Leest `profiel` (één rij per account, PK = FK naar auth.users) via de
 * service-role: de callback heeft geen sessie om mee te lezen.
 */
export async function deEnigeGebruiker(admin: SupabaseClient): Promise<string | null> {
  // limit(2), niet limit(1): we moeten kúnnen zien dát er meer dan één is.
  // Met limit(1) zou een tweede profiel onzichtbaar blijven en zouden we
  // vrolijk het verkeerde account koppelen.
  const { data, error } = await admin.from('profiel').select('id').limit(2)

  if (error) {
    console.error('[herstel] profiel lezen mislukt', error)
    return null
  }

  const rijen = lijst(data)
  if (rijen.length !== 1) {
    console.error(
      `[herstel] verwachtte precies één profiel, vond er ${rijen.length} — ` +
        'koppeling geweigerd omdat niet vaststaat bij wie dit token hoort',
    )
    return null
  }

  const rij = rijen[0]
  return isObject(rij) ? tekst(rij.id) : null
}
