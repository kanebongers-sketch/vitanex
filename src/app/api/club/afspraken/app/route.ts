// GET  /api/club/afspraken/app?lid=<id>: komende afspraken van het lid en wat
//      het lid zelf kan boeken (typen met hun trainers).
// POST /api/club/afspraken/app: het lid boekt zelf een vrij tijdslot, met de
//      boekregels van het type. Trainer null = maakt niet uit.
// Voorvertoning voor de beheerder (lid uit de vraag). Leden zelf gebruiken
// /api/club/lid/afspraken; de regels staan op een plek: src/lib/club/app/acties-afspraken.ts.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { leesJson } from '@/lib/club/afspraken/api'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'
import { afsprakenVoorLid, boekAfspraakVoorLid } from '@/lib/club/app/acties-afspraken'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lid = await lidVoorApp(t, req.nextUrl.searchParams.get('lid'))
  if (lid instanceof NextResponse) return lid
  return afsprakenVoorLid(t, lid)
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body = await leesJson(req)
  const lidId = typeof body === 'object' && body !== null && 'lidId' in body ? body.lidId : null
  const lid = await lidVoorApp(t, lidId)
  if (lid instanceof NextResponse) return lid
  return boekAfspraakVoorLid(t, lid, body)
}
