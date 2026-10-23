// GET /api/club/health?lid=<id>: metingen uit apps van een lid, voor trainers.
// Alleen wat het lid trainers laat zien (toestemming per soort, en bij Strava
// apart). Rechten: onderdeel Training (schemas) in rechten.ts. De inzage wordt
// gelogd (AVG: wie keek bij wie). Met CLUB_HEALTH_ACTIEF uit: 404.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { isUuid } from '@/lib/club/kern/organisatie'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { healthActief } from '@/lib/club/health/schakelaar'
import { haalVoorTrainer } from '@/lib/club/health/trainer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!healthActief()) return clubFout('Niet gevonden.', 404)
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lidId = req.nextUrl.searchParams.get('lid')
  const lid = isUuid(lidId) ? await haalLid(t.admin, t.userId, lidId) : null
  if (!isUuid(lidId) || !lid || !hoortBij(t.vestigingen, lid.vestiging)) return clubFout('Lid niet gevonden.', 404)
  const beeld = await haalVoorTrainer(t.admin, t.userId, lidId)
  if (!beeld) return clubFout('De metingen konden niet worden geladen.', 500)
  if (beeld.heeftToestemming) await logActie(t, 'Metingen uit apps bekeken', volledigeNaam(lid), lid.vestiging)
  return clubJson(beeld)
}
