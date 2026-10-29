// ─── AI Your Gym: een testbetaling afronden (SERVER-ONLY) ───────────────────
// De nagespeelde tegenhanger van Stripe Checkout (zie testbetaling.ts). De
// aanmelding wordt gevonden op het geheime sessie-id test_...; afronden gaat via
// verwerkSessie, dus inrichten gebeurt precies een keer, ook bij dubbelklikken.

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vindOpSessie, type AanmeldingRij } from './opslag'
import { isTestSessie, testSessie, testbetalenVoor } from './testbetaling'
import { verwerkSessie, type VerwerkDeps } from './verwerk'

/** Geldt voor de pakketten van deze aanmelding (nog steeds) de testbetaling? */
function testVoor(a: AanmeldingRij): boolean {
  return testbetalenVoor(a.pakketten)
}

export function nieuweTestSessie(): string {
  return `test_${randomBytes(24).toString('base64url')}`
}

/** De aanmelding die op deze testbetaling wacht, of null (onbekend, al afgerond of Stripe staat nu aan). */
export async function wachtendeTestbetaling(admin: SupabaseClient, sessieId: unknown): Promise<AanmeldingRij | null> {
  if (!isTestSessie(sessieId)) return null
  const a = await vindOpSessie(admin, sessieId)
  return a && a.status === 'wacht_op_betaling' && testVoor(a) ? a : null
}

export type TestUitkomst = { staat: 'ingericht'; organisatieId: string; email: string } | { staat: 'al_klaar' | 'onbekend' | 'fout' }

export async function rondTestbetalingAf(admin: SupabaseClient, sessieId: unknown, deps: VerwerkDeps): Promise<TestUitkomst> {
  if (!isTestSessie(sessieId)) return { staat: 'onbekend' }
  const a = await vindOpSessie(admin, sessieId)
  if (!a) return { staat: 'onbekend' }
  // Een tweede klik (of een tweede tabblad) na het inrichten: gewoon door naar welkom.
  if (a.status !== 'wacht_op_betaling' && a.status !== 'inrichten') return { staat: a.organisatieId ? 'al_klaar' : 'onbekend' }
  if (!testVoor(a)) return { staat: 'onbekend' }
  const uit = await verwerkSessie(admin, testSessie(sessieId, a.id), deps)
  if (uit === 'fout') return { staat: 'fout' }
  if (uit === 'klaar') return { staat: 'al_klaar' }
  const klaar = await vindOpSessie(admin, sessieId)
  return klaar?.organisatieId ? { staat: 'ingericht', organisatieId: klaar.organisatieId, email: klaar.eigenaarEmail } : { staat: 'al_klaar' }
}
