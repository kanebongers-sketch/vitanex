// /api/club/betalen/connect (alleen Kane en de eigenaar, CLUB_BETALEN_ACTIEF aan)
//   GET                          de stand bij Stripe ophalen en bewaren
//   POST  { actie: 'onboarding' } een link naar de onboarding van Stripe
//   POST  { actie: 'dashboard' }  een inloglink voor het Express-dashboard
//   PATCH { betalenAan }          betalen in de ledenapp aan of uit

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { oorsprongVanVerzoek, vereisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { dashboardLink, startOnboarding, verversStand, zetSchakelaar } from '@/lib/club/betalen/beheer-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  return verversStand(t)
}

export async function POST(req: NextRequest) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 500)
  if (gelezen instanceof NextResponse) return gelezen
  const actie = (gelezen.body as { actie?: unknown } | null)?.actie
  if (actie === 'onboarding') return startOnboarding(t, oorsprongVanVerzoek(req))
  if (actie === 'dashboard') return dashboardLink(t)
  return clubFout('Onbekende actie.', 400)
}

export async function PATCH(req: NextRequest) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 500)
  if (gelezen instanceof NextResponse) return gelezen
  return zetSchakelaar(t, (gelezen.body as { betalenAan?: unknown } | null)?.betalenAan)
}
