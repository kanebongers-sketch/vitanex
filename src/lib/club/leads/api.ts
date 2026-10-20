// ─── Fit Factory Club: hulp voor de leads-routes (SERVER-ONLY) ──────────────
// Gedeelde stappen van /api/club/leads/[id]/**: het id controleren, de lead
// ophalen, de body lezen en een medewerker controleren.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, type ClubToegang } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalLead } from './data'
import { isUuid } from './filters'
import type { Lead } from './model'

export interface LeadContext {
  params: Promise<{ id: string }>
}

/**
 * De lead uit de route, of een 404-antwoord. Een gewiste lead (AVG) is niet
 * meer te bewerken: 409, tenzij de route hem alleen leest (ookGewist).
 */
export async function leadUitRoute(t: ClubToegang, ctx: LeadContext, opties: { ookGewist?: boolean } = {}): Promise<Lead | NextResponse> {
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Lead niet gevonden.', 404)
  const lead = await haalLead(t.admin, t.userId, id)
  // Een medewerker ziet alleen leads van de eigen vestigingen.
  if (!lead || !hoortBij(t.vestigingen, lead.vestiging)) return clubFout('Lead niet gevonden.', 404)
  if (lead.geanonimiseerdOp && !opties.ookGewist) return clubFout('Deze lead is gewist (AVG) en kan niet meer worden aangepast.', 409)
  return lead
}

/** De JSON-body, of null bij onleesbare invoer. */
export async function leesJson(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => null)
}

/** Werkt deze medewerker in deze vestiging? null = niemand toegewezen, altijd goed. */
export async function isGeldigeMedewerker(t: ClubToegang, vestiging: Vestiging, id: string | null): Promise<boolean> {
  if (id === null) return true
  const medewerkers = await haalMedewerkers(t.admin, t.userId, vestiging)
  return (medewerkers ?? []).some((m) => m.id === id)
}

/** De naam van een medewerker voor de historie, of null. */
export async function medewerkerNaam(t: ClubToegang, vestiging: Vestiging, id: string): Promise<string | null> {
  const medewerkers = await haalMedewerkers(t.admin, t.userId, vestiging)
  return (medewerkers ?? []).find((m) => m.id === id)?.naam ?? null
}
