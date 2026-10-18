// /api/club/afspraken/[id]/tegoed: het PT-tegoed bij een afspraak van het type
// personal training (onderdeel Afspraken, zie src/lib/club/betalen/pt-acties.ts).
//   GET     staat er een sessie op, en hoeveel heeft het lid nog
//   POST    een sessie afboeken
//   DELETE  de afboeking ongedaan maken

import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { ptAfboeken, ptStand, ptTerugzetten } from '@/lib/club/betalen/pt-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

async function poort(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  const buiten = await eisVestigingVanRecord(t, 'club_afspraken', id)
  return buiten ?? { t, id }
}

export async function GET(req: NextRequest, ctx: Context) {
  const p = await poort(req, ctx)
  return p instanceof NextResponse ? p : ptStand(p.t, p.id)
}

export async function POST(req: NextRequest, ctx: Context) {
  const p = await poort(req, ctx)
  return p instanceof NextResponse ? p : ptAfboeken(p.t, p.id)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const p = await poort(req, ctx)
  return p instanceof NextResponse ? p : ptTerugzetten(p.t, p.id)
}
