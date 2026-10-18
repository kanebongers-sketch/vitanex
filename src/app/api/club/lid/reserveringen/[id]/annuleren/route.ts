// POST /api/club/lid/reserveringen/[id]/annuleren
// Het ingelogde lid meldt zich af voor een eigen reservering. Andermans
// reservering bestaat voor dit lid niet (404).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { annuleerLesVoorLid } from '@/lib/club/app/acties-training'
import { stripTerugNaAfmelden } from '@/lib/club/betalen/lid-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisLidToegang(req, 'lessen')
  if (l instanceof NextResponse) return l
  const { id } = await params
  const antwoord = await annuleerLesVoorLid(l, l.lid, id)
  // Met een strip betaald en op tijd afgemeld: strip terug (best effort).
  if (antwoord.ok) await stripTerugNaAfmelden(l, id)
  return antwoord
}
