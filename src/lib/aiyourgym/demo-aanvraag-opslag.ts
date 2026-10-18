// ─── AI Your Gym: demo-aanvragen opslaan (SERVER-ONLY) ──────────────────────
// Tabel ayg_demo_aanvragen (migratie 436) in de LifeOS-database, alleen via de
// service role. Er gaat niets automatisch naar buiten: Kane neemt zelf contact op.

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DemoAanvraag } from './demo-aanvraag'

/** Grenzen per uur: per e-mailadres, per IP en in totaal (tegen misbruik). */
export const DEMO_REM = { perEmail: 3, perIp: 5, totaal: 100 } as const

/** Het IP-adres als sha256: genoeg voor de rem, zonder het adres zelf te bewaren. */
export function ipHash(ip: string): string | null {
  const schoon = ip.trim()
  if (!schoon || schoon === 'onbekend') return null
  return createHash('sha256').update(`ayg-demo:${schoon}`).digest('hex')
}

export interface RemTellingen {
  email: number
  ip: number
  totaal: number
}

/** Zit een van de tellingen (laatste uur) aan de grens? */
export function isTeVeel(t: RemTellingen): boolean {
  return t.email >= DEMO_REM.perEmail || t.ip >= DEMO_REM.perIp || t.totaal >= DEMO_REM.totaal
}

/** Te veel aanvragen in het laatste uur? Null bij een databasefout (dan niet doorgaan). */
export async function teVeelDemoAanvragen(admin: SupabaseClient, email: string, ip: string | null, nu: Date): Promise<boolean | null> {
  const sinds = new Date(nu.getTime() - 60 * 60_000).toISOString()
  const tel = () => admin.from('ayg_demo_aanvragen').select('id', { count: 'exact', head: true }).gte('aangemaakt_op', sinds)
  const [eigen, alles, perIp] = await Promise.all([tel().eq('email', email), tel(), ip ? tel().eq('ip_hash', ip) : Promise.resolve(null)])
  if (eigen.error || alles.error || perIp?.error) {
    console.error('[aiyourgym] rem demo-aanvragen lezen mislukt', eigen.error?.code ?? alles.error?.code ?? perIp?.error?.code ?? '')
    return null
  }
  return isTeVeel({ email: eigen.count ?? 0, ip: perIp?.count ?? 0, totaal: alles.count ?? 0 })
}

export async function bewaarDemoAanvraag(admin: SupabaseClient, a: DemoAanvraag, ip: string | null, nu: Date): Promise<boolean> {
  const { error } = await admin.from('ayg_demo_aanvragen').insert({
    naam: a.naam,
    sportschool: a.sportschool,
    email: a.email,
    telefoon: a.telefoon,
    vestigingen: a.vestigingen,
    soort: a.soort,
    moment: a.moment,
    opmerking: a.opmerking,
    ip_hash: ip,
    akkoord_op: nu.toISOString(),
  })
  if (error) console.error('[aiyourgym] demo-aanvraag opslaan mislukt', error.code ?? '')
  return !error
}
