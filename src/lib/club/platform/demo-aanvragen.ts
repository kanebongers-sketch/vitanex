// ─── AI Your Gym: demo-aanvragen op het platformoverzicht ───────────────────
// Alleen voor Kane (/clubkane/platform en PATCH /api/club/platform/demo-aanvragen).
// Leest ayg_demo_aanvragen (migratie 436): open aanvragen eerst, dan de rest.
// De functies boven de streep zijn puur en getest.

import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_DEMO_AANVRAGEN = 100
export const DEMO_KOLOMMEN = 'id, naam, sportschool, email, telefoon, vestigingen, soort, moment, opmerking, status, afgehandeld_op, aangemaakt_op'

export type DemoStatus = 'open' | 'afgehandeld'

export interface PlatformDemoAanvraag {
  id: string
  naam: string
  sportschool: string
  email: string
  telefoon: string
  vestigingen: number
  soort: string
  moment: string
  opmerking: string | null
  status: DemoStatus
  afgehandeldOp: string | null
  aangemaaktOp: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isDemoStatus(v: unknown): v is DemoStatus {
  return v === 'open' || v === 'afgehandeld'
}

function tekst(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export function demoAanvraagUitRij(rij: unknown): PlatformDemoAanvraag | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || !isDemoStatus(r.status)) return null
  return {
    id: r.id,
    naam: tekst(r.naam),
    sportschool: tekst(r.sportschool),
    email: tekst(r.email),
    telefoon: tekst(r.telefoon),
    vestigingen: typeof r.vestigingen === 'number' ? r.vestigingen : 1,
    soort: tekst(r.soort),
    moment: tekst(r.moment),
    opmerking: typeof r.opmerking === 'string' && r.opmerking ? r.opmerking : null,
    status: r.status,
    afgehandeldOp: typeof r.afgehandeld_op === 'string' ? r.afgehandeld_op : null,
    aangemaaktOp: tekst(r.aangemaakt_op),
  }
}

/** Open aanvragen eerst (oudste bovenaan: die wacht het langst), daarna afgehandeld, nieuwste eerst. */
export function sorteerDemoAanvragen(lijst: readonly PlatformDemoAanvraag[]): PlatformDemoAanvraag[] {
  const open = lijst.filter((a) => a.status === 'open').sort((a, b) => a.aangemaaktOp.localeCompare(b.aangemaaktOp))
  const klaar = lijst.filter((a) => a.status !== 'open').sort((a, b) => b.aangemaaktOp.localeCompare(a.aangemaaktOp))
  return [...open, ...klaar]
}

export function telOpen(lijst: readonly PlatformDemoAanvraag[] | null): number | null {
  return lijst ? lijst.filter((a) => a.status === 'open').length : null
}

export type StatusWijziging = { ok: true; id: string; status: DemoStatus } | { ok: false; fout: string }

/** De body van PATCH: { id, status }. */
export function leesStatusWijziging(body: unknown): StatusWijziging {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  if (typeof b.id !== 'string' || !UUID.test(b.id)) return { ok: false, fout: 'Onbekende aanvraag.' }
  if (!isDemoStatus(b.status)) return { ok: false, fout: 'Onbekende status.' }
  return { ok: true, id: b.id.toLowerCase(), status: b.status }
}

// ─── Database (server) ──────────────────────────────────────────────────────

/** De demo-aanvragen; null bij een leesfout (de melding komt in `problemen`). */
export async function haalDemoAanvragen(admin: SupabaseClient, problemen: Set<string>): Promise<PlatformDemoAanvraag[] | null> {
  const { data, error } = await admin.from('ayg_demo_aanvragen').select(DEMO_KOLOMMEN).order('aangemaakt_op', { ascending: false }).limit(MAX_DEMO_AANVRAGEN)
  if (error) {
    console.error('[platform] demo-aanvragen lezen mislukt', error.code ?? '')
    problemen.add('Demo-aanvragen niet te lezen. Staat migratie 436 (ayg_demo_aanvragen) op de database?')
    return null
  }
  return sorteerDemoAanvragen((data ?? []).map(demoAanvraagUitRij).filter((a): a is PlatformDemoAanvraag => a !== null))
}

/** Zet de status; false bij een fout of als de aanvraag niet bestaat. */
export async function zetDemoStatus(admin: SupabaseClient, id: string, status: DemoStatus, nu: Date): Promise<boolean> {
  const { data, error } = await admin
    .from('ayg_demo_aanvragen')
    .update({ status, afgehandeld_op: status === 'afgehandeld' ? nu.toISOString() : null })
    .eq('id', id)
    .select('id')
  if (error) console.error('[platform] demo-aanvraag bijwerken mislukt', error.code ?? '')
  return !error && (data ?? []).length === 1
}
