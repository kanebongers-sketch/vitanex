// POST /api/club/lid/community/gezien  de reacties op eigen berichten zijn gezien

import { NextResponse, type NextRequest } from 'next/server'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { vereisCommunityLid } from '@/lib/club/community/api'
import { markeerActiviteitGezien } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  return alsAntwoord(await markeerActiviteitGezien(l))
}
