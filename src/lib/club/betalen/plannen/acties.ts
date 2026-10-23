// ─── Club, betalen: API-acties voor plannen en kortingen (SERVER-ONLY) ──────
// De route heeft de toegang al gecontroleerd (vereisLidgeldBeheer). Hier: de
// invoer controleren en de opslag aanroepen, altijd op t.userId.

import type { NextResponse } from 'next/server'
import { clubFout, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isDatum } from '../contract/datum'
import { leesPlanInvoer, object } from './invoer'
import { leesGezinInvoer, leesKortingInvoer } from './korting-invoer'
import { maakPlan, trekPrijsIn, verwijderPlan, wijzigPlan } from './opslag'
import { kortingIds, maakGezin, maakKorting, planIds, verwijderGezin, verwijderKorting, wijzigGezin, wijzigKorting } from './korting-opslag'

const NIET = 'Niet gevonden.'
const LEZEN_MIS = 'De gegevens konden niet worden gelezen. Probeer het opnieuw.'

function slugs(t: ClubToegang): string[] {
  return t.vestigingen.map((v) => v.sleutel)
}

export async function nieuwPlan(t: ClubToegang, body: unknown): Promise<NextResponse> {
  const vormId = object(body)?.vormId
  if (typeof vormId !== 'string' || !isUuid(vormId)) return clubFout('Kies een lidmaatschapsvorm.', 400)
  const invoer = leesPlanInvoer(body, slugs(t))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakPlan(t, vormId, invoer.waarde))
}

export async function pasPlanAan(t: ClubToegang, id: string, body: unknown): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  const invoer = leesPlanInvoer(body, slugs(t))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigPlan(t, id, invoer.waarde, object(body)?.prijsVanaf))
}

export async function haalPlanWeg(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  return alsAntwoord(await verwijderPlan(t, id))
}

export async function prijsIntrekken(t: ClubToegang, id: string, vanaf: string | null): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  if (!isDatum(vanaf)) return clubFout('Kies de prijswijziging die je wilt intrekken.', 400)
  return alsAntwoord(await trekPrijsIn(t, id, vanaf))
}

export async function nieuweKorting(t: ClubToegang, body: unknown): Promise<NextResponse> {
  const plannen = await planIds(t.admin, t.userId)
  if (!plannen) return clubFout(LEZEN_MIS, 500)
  const invoer = leesKortingInvoer(body, plannen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakKorting(t, invoer.waarde))
}

export async function pasKortingAan(t: ClubToegang, id: string, body: unknown): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  const plannen = await planIds(t.admin, t.userId)
  if (!plannen) return clubFout(LEZEN_MIS, 500)
  const invoer = leesKortingInvoer(body, plannen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigKorting(t, id, invoer.waarde))
}

export async function haalKortingWeg(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  return alsAntwoord(await verwijderKorting(t, id))
}

export async function nieuwGezin(t: ClubToegang, body: unknown): Promise<NextResponse> {
  const kortingen = await kortingIds(t.admin, t.userId)
  if (!kortingen) return clubFout(LEZEN_MIS, 500)
  const invoer = leesGezinInvoer(body, kortingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakGezin(t, invoer.waarde))
}

export async function pasGezinAan(t: ClubToegang, id: string, body: unknown): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  const kortingen = await kortingIds(t.admin, t.userId)
  if (!kortingen) return clubFout(LEZEN_MIS, 500)
  const invoer = leesGezinInvoer(body, kortingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigGezin(t, id, invoer.waarde))
}

export async function haalGezinWeg(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout(NIET, 404)
  return alsAntwoord(await verwijderGezin(t, id))
}
