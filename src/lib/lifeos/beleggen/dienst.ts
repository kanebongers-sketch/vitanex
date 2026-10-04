// ─── LifeOS — portefeuille ophalen en bijhouden (SERVER-ONLY) ───────────────
// Ververst koersen die ouder zijn dan een kwartier (Yahoo, gratis, ± 15 min
// vertraagd), rekent de portefeuille door en legt de waarde van vandaag vast voor
// het verloop. Valt Yahoo om, dan blijft de laatst bekende koers staan — met het
// tijdstip erbij, zodat je ziet hoe oud hij is.

import type { SupabaseClient } from '@supabase/supabase-js'
import { dagVan } from '@/lib/lifeos/blokken/tijd'
import { haalKoers, type Koers } from './yahoo'
import { benodigdeSymbolen, rekenRegel, rekenTotaal, type PositieRegel, type Totaal } from './portefeuille'
import { bewaarDagwaarde, bewaarKoersen, haalCash, haalHistorie, haalKoersen, haalPosities, type HistoriePunt } from './opslag'

const VERS_MS = 15 * 60_000

export interface Overzicht {
  regels: PositieRegel[]
  totaal: Totaal
  cashEur: number
  historie: HistoriePunt[]
  /** Oudste koers-tijdstip van de getoonde posities (ISO), of null. */
  koersenVan: string | null
}

export async function verversKoersen(admin: SupabaseClient, userId: string, symbolen: readonly string[], nu = new Date()): Promise<void> {
  const bekend = await haalKoersen(admin, userId)
  const oud = symbolen.filter((s) => {
    const k = bekend.get(s)
    return !k || nu.getTime() - new Date(k.opgehaaldOp).getTime() > VERS_MS
  })
  if (oud.length === 0) return
  // Bewaar onder het GEVRAAGDE symbool: Yahoo schrijft het soms anders terug.
  const nieuw = (await Promise.all(oud.map(async (s) => {
    const k = await haalKoers(s)
    return k ? { ...k, symbool: s } : null
  }))).filter((k): k is Koers => k !== null)
  await bewaarKoersen(admin, userId, nieuw)
}

/** Het hele overzicht, met verse koersen en de dagwaarde vastgelegd. `null` = DB-storing. */
export async function haalOverzicht(admin: SupabaseClient, userId: string, nu = new Date()): Promise<Overzicht | null> {
  const posities = await haalPosities(admin, userId)
  if (!posities.ok) return null
  await verversKoersen(admin, userId, benodigdeSymbolen(posities.waarde), nu).catch(() => undefined)

  const [koersen, cashEur] = await Promise.all([haalKoersen(admin, userId), haalCash(admin, userId)])
  const regels = posities.waarde.map((p) => rekenRegel(p, koersen))
  const totaal = rekenTotaal(regels, cashEur)

  if (regels.length > 0 && totaal.zonderKoers === 0) {
    await bewaarDagwaarde(admin, userId, { dag: dagVan(nu), waardeEur: totaal.waardeEur, inlegEur: totaal.inlegEur }).catch(() => undefined)
  }
  const tijden = posities.waarde.map((p) => koersen.get(p.symbool)?.opgehaaldOp).filter((t): t is string => !!t).sort()
  return { regels, totaal, cashEur, historie: await haalHistorie(admin, userId), koersenVan: tijden[0] ?? null }
}
