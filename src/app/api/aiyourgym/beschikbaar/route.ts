import type { NextRequest } from 'next/server'
import { ipVan } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { slugVrij } from '@/lib/aiyourgym/opslag'
import { adminOfNull, aygFout, aygJson, poortOpen } from '@/lib/aiyourgym/api'

// GET /api/aiyourgym/beschikbaar?slug=<naam>
// Is naam.aiyourgym.com nog vrij? Alleen ja of nee, nooit van wie het adres is.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await poortOpen())) return aygFout('Niet gevonden.', 404)
  if (isRateLimited(`ayg-beschikbaar:${ipVan(req)}`, 40, 60_000)) return aygFout('Even rustig aan. Probeer het zo opnieuw.', 429)
  const slug = leesSlug(req.nextUrl.searchParams.get('slug')?.slice(0, 60))
  if (!slug.ok) return aygJson({ vrij: false, fout: slug.fout })
  const admin = adminOfNull()
  if (!admin) return aygFout('Even niet te controleren.', 503)
  const vrij = await slugVrij(admin, slug.slug, new Date())
  if (vrij === null) return aygFout('Even niet te controleren.', 500)
  return aygJson(vrij ? { vrij: true } : { vrij: false, fout: 'Dit adres is al bezet. Kies een ander.' })
}
